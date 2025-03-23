const express = require('express');
const cors = require('cors');
const axios = require('axios');
const bodyParser = require('body-parser');
const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const session = require('express-session');
const LocalStrategy = require("passport-local").Strategy;
const User = require("./models/User.js");
const dotenv = require('dotenv');
const cors = require('cors');
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
        console.log('Received analysis request:', req.body);
        
        const response = await axios.post(
            `${PYTHON_API_URL}/analyze-answers`, 
            req.body,
            { timeout: 25000 }  // Set timeout to 25 seconds
        );
        
        console.log('Analysis response received:', response.data);
        res.json(response.data);
    } catch (error) {
        console.error('Error analyzing answers:', {
            message: error.message,
            code: error.code,
            response: error.response?.data
        });
        
        const errorMessage = error.code === 'ECONNABORTED'
            ? 'Analysis request timed out'
            : error.response?.data?.error || error.message;
            
        res.status(500).json({ 
            error: errorMessage,
            details: error.message,
            timestamp: new Date().toISOString()
        });
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

app.post('/api/search-web-careers', async (req, res) => {
    try {
        const response = await axios.post(`${PYTHON_API_URL}/search-web-careers`, req.body);
        res.json(response.data);
    } catch (error) {
        console.error('Error searching web careers:', error.message);
        res.status(500).json({ error: error.message });
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