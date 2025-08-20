const cors = require('cors');
const axios = require('axios');
const bodyParser = require('body-parser');
const express = require('express');
const mongoose = require('mongoose');
const crypto = require('crypto');
const passport = require('passport');
const session = require('express-session');
const LocalStrategy = require("passport-local").Strategy;
const User = require("./models/User.js");
const Tryout = require('./models/Tryout.js');
const AnalysisResult = require('./models/AnalysisResult.js');
const FullAnalysisResult = require('./models/FullAnalysisResult.js');
const SkillGapResult = require('./models/SkillGapResult.js');
const dotenv = require('dotenv');
// const cors = require('cors');
const jwt = require('jsonwebtoken'); // Import jsonwebtoken
const { verifyToken } = require('./middleware/auth');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 5001;
const PYTHON_API_URL = 'http://localhost:5002';

// Middleware
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true
}));
app.use(bodyParser.json());

dotenv.config();

// Initialize Express app
// const app = express();
// const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: ['http://localhost:8080'], // Allow requests from both origins
    methods: ['GET', 'POST'], // Allow specific HTTP methods
    credentials: true // Allow credentials (if needed)
}));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
    secret: 'mySecretKey',
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/api/auth', authRoutes);

// Protected route example
app.get('/api/profile', verifyToken, (req, res) => {
  res.json({ message: 'Protected route accessed successfully', user: req.user });
});

// ----- Tryouts (A/B) Endpoints -----

function generateTasksForPath(careerTitle, durationDays) {
  const skills = ['Foundations', 'Tooling', 'Problem Solving', 'Project'];
  const templates = {
    Foundations: (ct) => `Read a 10-min intro on ${ct} fundamentals and write 3 bullets`,
    Tooling: (ct) => `Install/setup a basic ${ct} tool and capture a screenshot`,
    'Problem Solving': (ct) => `Solve one micro-challenge related to ${ct}`,
    Project: (ct) => `Create a tiny deliverable for ${ct} and share link`
  };
  const arr = [];
  for (let d = 0; d < durationDays; d++) {
    const tag = skills[d % skills.length];
    arr.push({
      id: `${d + 1}`,
      day: d,
      title: templates[tag](careerTitle),
      skillTag: tag,
      status: 'pending',
      timeMin: 0,
      interest: 0,
      difficulty: 0,
      evidence: []
    });
  }
  return arr;
}

function computeSideSummary(tasks) {
  const total = tasks.length || 1;
  const completed = tasks.filter(t => t.status === 'completed');
  const completionRate = completed.length / total;
  const avg = (key) => {
    const vals = completed.map(t => Number(t[key]) || 0);
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  };
  const avgInterest = avg('interest');
  const avgDifficulty = avg('difficulty');
  const avgTime = avg('timeMin');
  // Simple fit formula (0-100): interest up, difficulty down (but not penalize small), time moderate
  const fitScore = Math.max(0, Math.min(100, (avgInterest * 18) + (5 - Math.min(5, avgDifficulty)) * 10 + Math.min(30, avgTime)));
  return { completionRate, avgInterest, avgDifficulty, fitScore };
}

app.post('/tryouts', verifyToken, async (req, res) => {
  try {
    const { pathA, pathB, durationDays = 7 } = req.body || {};
    if (!pathA || !pathB) return res.status(400).json({ error: 'pathA and pathB are required' });
    const dur = Math.max(3, Math.min(14, Number(durationDays) || 7));
    const tasksA = generateTasksForPath(pathA, dur);
    const tasksB = generateTasksForPath(pathB, dur);
    const summary = { A: computeSideSummary(tasksA), B: computeSideSummary(tasksB) };
    const doc = await Tryout.create({
      userId: req.user.id,
      pathA,
      pathB,
      durationDays: dur,
      tasks: { A: tasksA, B: tasksB },
      summary,
    });
    return res.json({ tryoutId: String(doc._id) });
  } catch (e) {
    console.error('Create tryout failed:', e);
    res.status(500).json({ error: 'Failed to create tryout' });
  }
});

// List current user's tryouts
app.get('/tryouts', verifyToken, async (req, res) => {
  try {
    const items = await Tryout.find({ userId: req.user.id })
      .select('_id pathA pathB durationDays createdAt summary')
      .sort({ createdAt: -1 })
      .lean();
    const result = items.map(t => ({
      id: String(t._id),
      pathA: t.pathA,
      pathB: t.pathB,
      durationDays: t.durationDays,
      createdAt: t.createdAt,
      summary: t.summary,
    }));
    res.json({ tryouts: result });
  } catch (e) {
    console.error('List tryouts failed:', e);
    res.status(500).json({ error: 'Failed to list tryouts' });
  }
});

app.get('/tryouts/:id', verifyToken, async (req, res) => {
  try {
    const doc = await Tryout.findOne({ _id: req.params.id, userId: req.user.id }).lean();
    if (!doc) return res.status(404).json({ error: 'Not found' });
    // Align id shape with frontend
    const { _id, ...rest } = doc;
    res.json({ tryout: { id: String(_id), ...rest } });
  } catch (e) {
    res.status(404).json({ error: 'Not found' });
  }
});

app.post('/tryouts/:id/tasks/:key/:taskId/log', verifyToken, async (req, res) => {
  const key = req.params.key === 'A' ? 'A' : 'B';
  const { timeMin = 0, interest = 0, difficulty = 0, evidence } = req.body || {};
  const doc = await Tryout.findOne({ _id: req.params.id, userId: req.user.id });
  if (!doc) return res.status(404).json({ error: 'Not found' });
  const list = doc.tasks?.[key] || [];
  const idx = list.findIndex(t => String(t.id) === String(req.params.taskId));
  if (idx === -1) return res.status(404).json({ error: 'Task not found' });
  list[idx].timeMin = Number(timeMin) || 0;
  list[idx].interest = Number(interest) || 0;
  list[idx].difficulty = Number(difficulty) || 0;
  if (evidence) list[idx].evidence = [...(list[idx].evidence || []), String(evidence)];
  list[idx].status = 'completed';
  // Recompute summary and save
  doc.summary = { A: computeSideSummary(doc.tasks.A), B: computeSideSummary(doc.tasks.B) };
  await doc.save();
  return res.json({ ok: true });
});

app.get('/tryouts/:id/summary', verifyToken, async (req, res) => {
  const doc = await Tryout.findOne({ _id: req.params.id, userId: req.user.id }).lean();
  if (!doc) return res.status(404).json({ error: 'Not found' });
  const summary = doc.summary || { A: computeSideSummary(doc.tasks.A || []), B: computeSideSummary(doc.tasks.B || []) };
  res.json({ summary });
});

// ----- Journey Progress Endpoints -----
// Get current user's journey progress
app.get('/user/journey-progress', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('journeyProgress');
    if (!user) return res.status(404).json({ error: 'User not found' });
    const progress = user.journeyProgress instanceof Map
      ? Object.fromEntries(user.journeyProgress)
      : (user.journeyProgress || {});
    res.json({ progress });
  } catch (err) {
    console.error('Failed to fetch journey progress:', err.message);
    res.status(500).json({ error: 'Failed to fetch journey progress' });
  }
});

// Update user's journey progress (replace or merge)
// Accepts body: { progress: { [title]: boolean }, merge?: boolean }
app.put('/user/journey-progress', verifyToken, async (req, res) => {
  try {
    const { progress, merge } = req.body || {};
    if (!progress || typeof progress !== 'object') {
      return res.status(400).json({ error: 'progress object is required' });
    }

    const user = await User.findById(req.user.id).select('journeyProgress');
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (merge) {
      const current = user.journeyProgress instanceof Map ? Object.fromEntries(user.journeyProgress) : (user.journeyProgress || {});
      const next = { ...current, ...progress };
      user.journeyProgress = next;
    } else {
      user.journeyProgress = progress;
    }

    await user.save();
    const out = user.journeyProgress instanceof Map ? Object.fromEntries(user.journeyProgress) : user.journeyProgress;
    res.json({ progress: out });
  } catch (err) {
    console.error('Failed to update journey progress:', err.message);
    res.status(500).json({ error: 'Failed to update journey progress' });
  }
});

// ----- Top Careers Endpoint -----
// Returns top N careers from the latest AnalysisResult for the authenticated user
app.get('/user/top-careers', verifyToken, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || '3', 10), 10);
    const latest = await AnalysisResult.findOne({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .select('aiCareers createdAt groupName')
      .lean();
    if (!latest) return res.json({ careers: [] });
    const list = Array.isArray(latest.aiCareers) ? latest.aiCareers : [];
    const sorted = [...list].sort((a, b) => (b?.match || 0) - (a?.match || 0));
    res.json({ careers: sorted.slice(0, limit), groupName: latest.groupName, createdAt: latest.createdAt });
  } catch (err) {
    console.error('Failed to fetch top careers:', err.message);
    res.status(500).json({ error: 'Failed to fetch top careers' });
  }
});

// Fetch current user's analysis results (requires auth)
app.get('/user/analysis-results', verifyToken, async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit || '10', 10), 50);
        const results = await AnalysisResult.find({ userId: req.user.id })
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean();
        res.json({ results });
    } catch (err) {
        console.error('Failed to fetch user analysis results:', err.message);
        res.status(500).json({ error: 'Failed to fetch user analysis results' });
    }
});

// Fetch current user's full analysis results (requires auth)
app.get('/user/full-analysis-results', verifyToken, async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit || '10', 10), 50);
        const results = await FullAnalysisResult.find({ userId: req.user.id })
            .sort({ createdAt: -1 })
            .limit(limit)
            .select('_id groupName answersCount durationMs createdAt')
            .lean();
        res.json({ results });
    } catch (err) {
        console.error('Failed to fetch full analysis results:', err.message);
        res.status(500).json({ error: 'Failed to fetch full analysis results' });
    }
});

// Fetch a specific full analysis (must be owner)
app.get('/full-analysis-results/:id', verifyToken, async (req, res) => {
    try {
        const doc = await FullAnalysisResult.findById(req.params.id).lean();
        if (!doc) return res.status(404).json({ error: 'Not found' });
        if (!doc.userId || String(doc.userId) !== String(req.user.id)) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        res.json(doc);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch full analysis' });
    }
});

// Proxy: Skill Gap Analysis -> Flask
app.post('/skill-gap-analysis', async (req, res) => {
    try {
        const t0 = Date.now();
        // Merge auth user's stored preferences/groupType if missing (optional)
        let merged = { ...req.body };
        let userId = undefined;
        try {
            const token = req.header('x-auth-token');
            if (token) {
                const decoded = jwt.verify(token, JWT_SECRET);
                userId = decoded?.id;
                if (userId) {
                    const u = await User.findById(userId).select('groupType preferences');
                    if (u) {
                        if (!merged.group_name && u.groupType) merged.group_name = u.groupType;
                        if (!merged.preferences && u.preferences) merged.preferences = u.preferences;
                    }
                }
            }
        } catch (e) {
            // non-fatal
        }

        const response = await axios.post(
            `${PYTHON_API_URL}/skill-gap`,
            merged,
            { timeout: 120000 }
        );
        const elapsed = Date.now() - t0;
        console.log('Skill gap response in', elapsed, 'ms');
        // Persist minimal skill gap result for later retrieval
        try {
            const aiData = response.data || {};
            const userSkills = aiData.userSkills || {};
            const careers = Array.isArray(aiData.careers) ? aiData.careers : [];
            const finalAnswers = merged?.final_answers || merged?.answers || [];
            const groupName = merged?.group_name || 'Unknown';
            const inputHash = crypto.createHash('sha256')
                .update(JSON.stringify({ finalAnswers, groupName }))
                .digest('hex');

            const doc = await SkillGapResult.create({
                userId: userId || undefined,
                groupName,
                preferences: merged?.preferences || {},
                targetCareers: merged?.target_careers || [],
                userSkills,
                careers,
                inputHash,
            });
            res.json({ savedId: doc._id, ...aiData });
        } catch (persistErr) {
            console.error('Persist skill gap result failed:', persistErr.message);
            // Return AI data even if persistence fails
            res.json(response.data);
        }
    } catch (error) {
        console.error('Error in skill gap analysis:', {
            message: error.message,
            code: error.code,
            response: error.response?.data
        });
        const errorMessage = error.code === 'ECONNABORTED'
            ? 'Skill gap request timed out (backend->Flask, 120s). Try again.'
            : error.response?.data?.error || error.message;
        res.status(500).json({ error: errorMessage, details: error.message, timestamp: new Date().toISOString() });
    }
});

// Alias: also support /api/skill-gap-analysis for clients that prefix with /api
app.post('/api/skill-gap-analysis', async (req, res) => {
    try {
        const t0 = Date.now();
        let merged = { ...req.body };
        try {
            const token = req.header('x-auth-token');
            if (token) {
                const decoded = jwt.verify(token, JWT_SECRET);
                const userId = decoded?.id;
                if (userId) {
                    const u = await User.findById(userId).select('groupType preferences');
                    if (u) {
                        if (!merged.group_name && u.groupType) merged.group_name = u.groupType;
                        if (!merged.preferences && u.preferences) merged.preferences = u.preferences;
                    }
                }
            }
        } catch (e) {
            // non-fatal
        }

        const response = await axios.post(
            `${PYTHON_API_URL}/skill-gap`,
            merged,
            { timeout: 120000 }
        );
        const elapsed = Date.now() - t0;
        console.log('Skill gap (alias) response in', elapsed, 'ms');
        try {
            const aiData = response.data || {};
            const userSkills = aiData.userSkills || {};
            const careers = Array.isArray(aiData.careers) ? aiData.careers : [];
            const finalAnswers = merged?.final_answers || merged?.answers || [];
            const groupName = merged?.group_name || 'Unknown';
            const inputHash = crypto.createHash('sha256')
                .update(JSON.stringify({ finalAnswers, groupName }))
                .digest('hex');

            const doc = await SkillGapResult.create({
                userId: undefined,
                groupName,
                preferences: merged?.preferences || {},
                targetCareers: merged?.target_careers || [],
                userSkills,
                careers,
                inputHash,
            });
            res.json({ savedId: doc._id, ...aiData });
        } catch (persistErr) {
            console.error('Persist skill gap result failed (alias):', persistErr.message);
            res.json(response.data);
        }
    } catch (error) {
        console.error('Error in skill gap analysis (alias):', {
            message: error.message,
            code: error.code,
            response: error.response?.data
        });
        const errorMessage = error.code === 'ECONNABORTED'
            ? 'Skill gap request timed out (backend->Flask, 120s). Try again.'
            : error.response?.data?.error || error.message;
        res.status(500).json({ error: errorMessage, details: error.message, timestamp: new Date().toISOString() });
    }
});

// Retrieve current user's saved skill gap results (requires auth)
app.get('/user/skill-gap-results', verifyToken, async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit || '10', 10), 50);
        const results = await SkillGapResult.find({ userId: req.user.id })
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean();
        res.json({ results });
    } catch (err) {
        console.error('Failed to fetch user skill gap results:', err.message);
        res.status(500).json({ error: 'Failed to fetch user skill gap results' });
    }
});

// Retrieve a single skill gap result by id (public if you know the id)
app.get('/skill-gap-results/:id', async (req, res) => {
    try {
        const doc = await SkillGapResult.findById(req.params.id).lean();
        if (!doc) return res.status(404).json({ error: 'Not found' });
        res.json(doc);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch skill gap result' });
    }
});

// Delete a skill gap result (must be owner)
app.delete('/skill-gap-results/:id', verifyToken, async (req, res) => {
    try {
        const doc = await SkillGapResult.findById(req.params.id);
        if (!doc) return res.status(404).json({ error: 'Not found' });
        if (!doc.userId || String(doc.userId) !== String(req.user.id)) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        await SkillGapResult.deleteOne({ _id: doc._id });
        res.json({ ok: true });
    } catch (err) {
        console.error('Failed to delete skill gap result:', err.message);
        res.status(500).json({ error: 'Failed to delete skill gap result' });
    }
});

// Update completion progress (skills/courses) for a skill gap result
// Body: { type: 'skill' | 'course', item: string, completed: boolean }
app.put('/skill-gap-results/:id/progress', verifyToken, async (req, res) => {
    try {
        const { type, item, completed } = req.body || {};
        if (!type || !item || typeof completed !== 'boolean') {
            return res.status(400).json({ error: 'type, item and completed are required' });
        }

        const doc = await SkillGapResult.findById(req.params.id);
        if (!doc) return res.status(404).json({ error: 'Not found' });
        if (!doc.userId || String(doc.userId) !== String(req.user.id)) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        const field = type === 'course' ? 'completedCourses' : 'completedSkills';

        if (completed) {
            if (!doc[field].includes(item)) doc[field].push(item);
        } else {
            doc[field] = doc[field].filter(v => v !== item);
        }
        await doc.save();

        res.json({
            ok: true,
            completedSkills: doc.completedSkills,
            completedCourses: doc.completedCourses,
        });
    } catch (err) {
        console.error('Failed to update progress:', err.message);
        res.status(500).json({ error: 'Failed to update progress' });
    }
});

// Update user profile (username, email, groupType, preferences)
app.put('/user/profile', verifyToken, async (req, res) => {
    try {
        const { username, email, groupType, preferences } = req.body;
        const update = {};
        if (typeof username === 'string' && username.trim()) update.username = username.trim();
        if (typeof email === 'string' && email.trim()) update.email = email.trim().toLowerCase();
        if (typeof groupType === 'string' && groupType.trim()) update.groupType = groupType.trim();
        if (preferences && typeof preferences === 'object') update.preferences = preferences;

        // If email is being updated, ensure uniqueness
        if (update.email) {
            const existing = await User.findOne({ email: update.email, _id: { $ne: req.user.id } }).select('_id');
            if (existing) {
                return res.status(400).json({ message: 'Email already in use' });
            }
        }

        const user = await User.findByIdAndUpdate(req.user.id, update, { new: true })
            .select('username email groupType preferences');
        res.json({ user });
    } catch (err) {
        console.error('Failed to update profile:', err.message);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

// Update user preferences (locations) and groupType
app.put('/user/preferences', verifyToken, async (req, res) => {
  try {
    const { preferences, groupType } = req.body;
    const update = {};
    if (preferences) update.preferences = preferences;
    if (groupType) update.groupType = groupType;
    const user = await User.findByIdAndUpdate(req.user.id, update, { new: true }).select('username email groupType preferences');
    res.json({ user });
  } catch (err) {
    console.error('Failed to update preferences:', err.message);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

app.get("/", (req, res) => {
  res.send("Hello World");
});

// Connect to MongoDB
const mongoURI = process.env.MONGO_URI; // Use the MongoDB URI from the environment variable
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("MongoDB connected for authentication"))
    .catch(err => console.error("MongoDB connection error:", err));

// Secret key for JWT
const JWT_SECRET = process.env.JWT_SECRET || 'your_default_jwt_secret'; // Ensure this is set

passport.use(new LocalStrategy(
    async (email, password, done) => {
      try {
        const user = await User.findOne({ email }); // Find user by email
        if (!user) return done(null, false, { message: "User not found" });
  
        const isMatch = await user.verifyPassword(password); // Use the verifyPassword method
        if (!isMatch) return done(null, false, { message: "Incorrect password" });
  
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
));  

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

app.post("/auth/login", async (req, res, next) => {
  const { email, password } = req.body; // Destructure email and password from the request body
  try {
    const user = await User.findOne({ email }); // Find user by email
    if (!user) return res.status(401).send("Login failed"); // Check if user exists

    const isMatch = await user.verifyPassword(password); // Verify password
    if (!isMatch) return res.status(401).send("Login failed"); // Check if password matches

    // Generate a token
    const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: '1h' }); // Token expires in 1 hour

    // Send the token and user data back to the client (include groupType and preferences)
    res.json({ 
      token, 
      user: { 
        id: user._id, 
        username: user.username, 
        email: user.email,
        groupType: user.groupType,
        preferences: user.preferences
      } 
    });
  } catch (err) {
    return next(err); // Handle any errors
  }
});

app.post("/auth/register", async (req, res) => {
    try {
        const { username, email, password, groupType, preferences } = req.body;

        if (!groupType) {
            return res.status(400).json({ message: "groupType is required" });
        }

        // Check if the user already exists
        const existingUserByEmail = await User.findOne({ email });
        if (existingUserByEmail) {
            return res.status(400).json({ message: "Email already exists" });
        }

        const existingUserByUsername = await User.findOne({ username });
        if (existingUserByUsername) {
            return res.status(400).json({ message: "Username already exists" });
        }

        // Create a new user
        const newUser = new User({ username, email, password, groupType, preferences });
        await newUser.save();

        // Create JWT token
        const token = jwt.sign({ id: newUser._id, username: newUser.username }, JWT_SECRET, { expiresIn: '7d' });

        // Send success message as JSON
        return res.json({ token, user: { id: newUser._id, username: newUser.username, email: newUser.email, groupType: newUser.groupType, preferences: newUser.preferences } });
    } catch (err) {
        console.error("Registration error:", err); // Log the error for debugging
        return res.status(500).json({ message: "Error registering user" });
    }
});

// Use JWT verification for fetching current user
app.get("/auth/user", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('username email groupType preferences journeyProgress');
    if (!user) {
      return res.status(404).send("User not found");
    }
    return res.json({ username: user.username, email: user.email, groupType: user.groupType, preferences: user.preferences, journeyProgress: user.journeyProgress });
  } catch (err) {
    return res.status(500).send("Error retrieving user data");
  }
});


// Middleware to log requests
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
    next();
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Route handlers
app.post('/generate-question', async (req, res) => {
    try {
        console.log('Received request for question generation:', req.body);
        
        const response = await axios.post(`${PYTHON_API_URL}/generate-question`, {
            previousQA: req.body.previousQA || []
        });
        
        console.log('Response from Flask:', response.data);
        
        if (response.data.error) {
            throw new Error(response.data.error);
        }
        
        res.json(response.data);
    } catch (error) {
        console.error('Error generating question:', error.message);
        console.error('Full error:', error);
        
        res.status(500).json({ 
            error: 'Failed to generate question',
            details: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

app.post('/analyze-answers', async (req, res) => {
    try {
        const t0 = Date.now();
        console.log('Received analysis request:', req.body);
        // Try to identify user from JWT (optional)
        let userId = undefined;
        try {
            const token = req.header('x-auth-token');
            if (token) {
                const decoded = jwt.verify(token, JWT_SECRET);
                userId = decoded?.id;
            }
        } catch (e) {
            // Non-fatal; proceed unauthenticated
        }

        // Merge server-side preferences/groupType if missing in request
        let mergedPayload = { ...req.body };
        if (userId) {
            try {
                const u = await User.findById(userId).select('groupType preferences');
                if (u) {
                    if (!mergedPayload.group_name && u.groupType) {
                        mergedPayload.group_name = u.groupType;
                    }
                    if (!mergedPayload.preferences && u.preferences) {
                        mergedPayload.preferences = u.preferences;
                    }
                }
            } catch (e) {
                console.warn('Unable to merge user profile into analysis payload:', e.message);
            }
        }

        // Fetch previous minimal analysis for personalization
        if (userId) {
            try {
                const last = await AnalysisResult.findOne({ userId }).sort({ createdAt: -1 }).lean();
                if (last) {
                    mergedPayload.previous_analysis = {
                        aiCareers: last.aiCareers || [],
                        pdfCareers: last.pdfCareers || [],
                        groupName: last.groupName,
                        createdAt: last.createdAt,
                    };
                }
            } catch (e) {
                console.warn('Unable to fetch previous analysis:', e.message);
            }
        }
            
        const response = await axios.post(
            `${PYTHON_API_URL}/analyze-answers`, 
            mergedPayload,
            { timeout: 120000 }  // Increase timeout to 120 seconds for AI + PDF processing
        );
        
        console.log('Analysis response received:', response.data);
        const elapsed = Date.now() - t0;

        // Non-blocking persist minimal result (best-effort)
        (async () => {
            try {
                const ai = Array.isArray(response.data?.ai_generated_careers) ? response.data.ai_generated_careers : [];
                const pdf = Array.isArray(response.data?.pdf_based_careers) ? response.data.pdf_based_careers : [];
                const minify = list => list.slice(0, 5).map(c => ({
                    title: c?.title || c?.name || 'Unknown',
                    match: typeof c?.match === 'number' ? c.match : undefined,
                }));

                const finalAnswers = mergedPayload?.final_answers || mergedPayload?.answers || [];
                const groupName = mergedPayload?.group_name || 'Unknown';
                const inputHash = crypto.createHash('sha256')
                    .update(JSON.stringify({ finalAnswers, groupName }))
                    .digest('hex');

                await AnalysisResult.create({
                    userId: userId || undefined,
                    groupName,
                    answersCount: Array.isArray(finalAnswers) ? finalAnswers.length : 0,
                    durationMs: elapsed,
                    aiCareers: minify(ai),
                    pdfCareers: minify(pdf),
                    inputHash,
                });

                // Persist full analysis payload as well
                try {
                    await FullAnalysisResult.create({
                        userId: userId || undefined,
                        groupName,
                        preferences: mergedPayload?.preferences || {},
                        finalAnswers: Array.isArray(finalAnswers) ? finalAnswers : [],
                        response: response.data,
                        answersCount: Array.isArray(finalAnswers) ? finalAnswers.length : 0,
                        durationMs: elapsed,
                        inputHash,
                    });
                } catch (fullErr) {
                    console.error('Persist full analysis failed:', fullErr.message);
                }
            } catch (persistErr) {
                console.error('Persist minimal analysis failed:', persistErr.message);
            }
        })();

        res.json(response.data);
    } catch (error) {
        console.error('Error analyzing answers:', {
            message: error.message,
            code: error.code,
            response: error.response?.data
        });
        
        const errorMessage = error.code === 'ECONNABORTED'
            ? 'Analysis request timed out (backend->Flask, 120s). Try again or simplify inputs.'
            : error.response?.data?.error || error.message;
            
        res.status(500).json({ 
            error: errorMessage,
            details: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Fetch recent minimal analysis results
app.get('/analysis-results', async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit || '10', 10), 50);
        const results = await AnalysisResult.find({},
            { aiCareers: 1, pdfCareers: 1, groupName: 1, answersCount: 1, durationMs: 1, createdAt: 1 }
        )
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();
        res.json({ results });
    } catch (err) {
        console.error('Failed to fetch analysis results:', err.message);
        res.status(500).json({ error: 'Failed to fetch analysis results' });
    }
});

app.get('/api/test-api', async (req, res) => {
    try {
        const response = await axios.get(`${PYTHON_API_URL}/test-api`);
        res.json(response.data);
    } catch (error) {
        console.error('Error testing API:', error.message);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/list-models', async (req, res) => {
    try {
        const response = await axios.get(`${PYTHON_API_URL}/list-models`);
        res.json(response.data);
    } catch (error) {
        console.error('Error listing models:', error.message);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/web-search', async (req, res) => {
    try {
        const response = await axios.post(`${PYTHON_API_URL}/web-search`, req.body);
        res.json(response.data);
    } catch (error) {
        console.error('Error performing web search:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Proxy: Generate dynamic 90-day course plan -> Flask
app.post('/api/course-plan', async (req, res) => {
    try {
        const response = await axios.post(`${PYTHON_API_URL}/course-plan`, req.body, { timeout: 120000 });
        res.json(response.data);
    } catch (error) {
        console.error('Error generating course plan:', error.message);
        const msg = error.response?.data || { error: error.message };
        res.status(500).json(msg);
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        error: 'An unexpected error occurred',
        details: err.message,
        timestamp: new Date().toISOString()
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Express server running on port ${PORT}`);
    console.log(`Connecting to Flask API at ${PYTHON_API_URL}`);
}); 