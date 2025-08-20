import React, { useEffect, useMemo, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import api from '@/services/api';
import { User, Target, BarChart3, CheckCircle2, Clock, ListChecks, Sparkles, TrendingUp, Circle } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, footer, delta }) => (
  <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <div className="mt-2 flex items-end gap-3">
          <p className="text-3xl font-semibold">{value}</p>
          {typeof delta === 'number' && (
            <span className="inline-flex items-center text-emerald-600 text-xs font-medium bg-emerald-50 px-2 py-1 rounded-full">
              <TrendingUp className="w-3 h-3 mr-1" />
              {delta > 0 ? `+${delta}%` : `${delta}%`}
            </span>
          )}
        </div>
      </div>
      <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600">
        <Icon className="w-6 h-6" />
      </div>
    </div>
    {footer && <div className="mt-4 text-xs text-gray-500">{footer}</div>}
  </div>
);

export default function Dashboard() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [skillGapResults, setSkillGapResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [journeyProgress, setJourneyProgress] = useState({});
  const [topCareers, setTopCareers] = useState([]);
  const [recentAssessments, setRecentAssessments] = useState([]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/signin');
      return;
    }
    const load = async () => {
      try {
        const { results } = await api.getUserSkillGapResults(50);
        setSkillGapResults(results || []);
      } catch (e) {
        setSkillGapResults([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isAuthenticated, navigate]);

  // Load journey progress: first localStorage for instant UX, then server to sync
  useEffect(() => {
    const key = user?._id || user?.email || 'anon';
    try {
      const saved = JSON.parse(localStorage.getItem(`journeyProgress:${key}`) || '{}');
      setJourneyProgress(saved && typeof saved === 'object' ? saved : {});
    } catch {
      setJourneyProgress({});
    }
    // Fetch from server and overwrite/merge
    (async () => {
      try {
        const res = await api.getJourneyProgress();
        const serverProg = res?.progress && typeof res.progress === 'object' ? res.progress : {};
        // Merge local and server (server wins)
        const next = { ...saved, ...serverProg };
        setJourneyProgress(next);
        try { localStorage.setItem(`journeyProgress:${key}`, JSON.stringify(next)); } catch {}
      } catch (err) {
        // ignore; stay with local
      }
    })();
  }, [user?._id, user?.email]);

  const persistJourneyProgress = async (next) => {
    const key = user?._id || user?.email || 'anon';
    try { localStorage.setItem(`journeyProgress:${key}`, JSON.stringify(next)); } catch {}
    try { await api.updateJourneyProgress(next, true); } catch {}
  };

  const lastSkillGapDate = useMemo(() => {
    if (!skillGapResults.length) return '-';
    const latest = skillGapResults.reduce((a, b) => new Date(a.createdAt) > new Date(b.createdAt) ? a : b);
    return new Date(latest.createdAt).toLocaleString();
  }, [skillGapResults]);

  // Load recent assessments: server only
  useEffect(() => {
    (async () => {
      try {
        const { items } = await api.getRecentAssessments(5);
        setRecentAssessments(Array.isArray(items) ? items : []);
      } catch { setRecentAssessments([]); }
    })();
  }, []);
  

  // Load top careers from backend with local fallback
  useEffect(() => {
    (async () => {
      try {
        const res = await api.getTopCareers(3);
        const list = Array.isArray(res?.careers) ? res.careers : [];
        if (list.length) {
          setTopCareers(list);
          return;
        }
      } catch {}
      // Fallback to local cache if server has none
      if (recentAssessments.length) {
        const latest = recentAssessments[0];
        const list = Array.isArray(latest?.aiCareers) ? latest.aiCareers : [];
        const sorted = [...list].sort((a, b) => (b?.match || 0) - (a?.match || 0));
        setTopCareers(sorted.slice(0, 3));
      } else {
        setTopCareers([]);
      }
    })();
  }, [recentAssessments.length]);

  const profileCompleteness = useMemo(() => {
    if (!user) return 0;
    const fields = ['name', 'email', 'groupType', 'preferences'];
    const filled = fields.filter(f => !!user[f] && (typeof user[f] !== 'object' || Object.keys(user[f]).length > 0)).length;
    return Math.round((filled / fields.length) * 100);
  }, [user]);

  // --- Personalized Journey helpers ---
  const getClassAndStream = () => {
    const prefs = user?.preferences || {};
    const rawClass = prefs.class || prefs.grade || prefs.standard || prefs.year || prefs.educationLevel || user?.groupType;
    const stream = (prefs.stream || prefs.group || prefs.track || '').toString().toLowerCase();
    // Normalize class to number if possible
    let cls = 0;
    if (typeof rawClass === 'number') cls = rawClass;
    else if (typeof rawClass === 'string') {
      const m = rawClass.match(/(9|10|11|12|fy|sy|ty|first|second|third)/i);
      if (m) {
        const t = m[0].toLowerCase();
        if (['9','10','11','12'].includes(t)) cls = parseInt(t, 10);
        else if (['fy','first'].includes(t)) cls = 13; // college first year
        else if (['sy','second'].includes(t)) cls = 14;
        else if (['ty','third'].includes(t)) cls = 15;
      }
    }
    return { cls, stream };
  };

  const buildJourney = ({ cls, stream }) => {
    const steps = [];
    const lower = stream;

    const add = (title, desc, to, badge) => steps.push({ title, desc, to, badge });

    if (cls === 9 || cls === 10) {
      add('Explore Streams (XI)', 'Understand Science, Commerce, and Humanities with outcomes.', '/test', 'Start here');
      add('Discover Your Interests', 'Take the Career Test to map interests to subjects.', '/test', 'Assessment');
      add('Skill Foundations', 'Identify subject-wise gaps early and plan improvements.', '/skill-gap', 'Skill Gap');
      add('Build a Study Plan', 'Create weekly targets for Class 10 boards.', '/profile/overview', 'Planning');
    } else if (cls === 11 || cls === 12) {
      if (lower.includes('sci') || lower.includes('pcm') || lower.includes('pcb')) {
        add('Target JEE/NEET', 'Pick your exam track and review syllabus + weightage.', '/test', 'Roadmap');
        add('Skill Gap on Core', 'Run skill gap for Physics, Chemistry, Math/Bio topics.', '/skill-gap', 'Analyze');
        add('Mock Practice', 'Schedule topic-wise mocks and analyze errors.', '/test/questions', 'Practice');
        add('College Shortlist', 'Shortlist colleges based on target rank and preferences.', '/profile/history', 'Shortlist');
      } else if (lower.includes('com')) {
        add('Commerce Pathways', 'Explore CA/CS/CMA vs B.Com specializations.', '/test', 'Explore');
        add('Subject Gaps', 'Audit Accountancy, Economics, Business Studies gaps.', '/skill-gap', 'Analyze');
        add('Aptitude Prep', 'Start aptitude + reasoning practice for entrances.', '/test/questions', 'Practice');
        add('Course Shortlist', 'Shortlist colleges and entrance timelines (CUET, etc.)', '/profile/history', 'Shortlist');
      } else {
        add('Humanities Tracks', 'Explore Psychology, Law, Design, UPSC-foundation etc.', '/test', 'Explore');
        add('Portfolio/Reading', 'Start portfolio and curated reading list per interest.', '/profile/overview', 'Build');
        add('Skill Audit', 'Run gap analysis on writing, GK, reasoning, communication.', '/skill-gap', 'Analyze');
        add('College Pathways', 'Plan CUET/college applications with deadlines.', '/profile/history', 'Plan');
      }
    } else if (cls >= 13) {
      add('Career Targeting', 'Refine goals with the Career Test and industry paths.', '/test', 'Assess');
      add('Skill Gap to Role', 'Benchmark current skills to target roles.', '/skill-gap', 'Analyze');
      add('Projects & Internships', 'Plan 1-2 projects and internships this term.', '/profile/overview', 'Execute');
      add('Applications', 'Track applications, exams, and interviews.', '/profile/history', 'Track');
    }
    return steps;
  };

  const { cls, stream } = getClassAndStream();
  const journeySteps = useMemo(() => buildJourney({ cls, stream }), [cls, stream]);

  const isStepDone = (title) => !!journeyProgress[title];
  const toggleStep = (e, title) => {
    e.preventDefault();
    e.stopPropagation();
    const next = { ...journeyProgress, [title]: !journeyProgress[title] };
    setJourneyProgress(next);
    persistJourneyProgress(next);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 pt-28 pb-20">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Welcome{user?.name ? `, ${user.name}` : ''}</h1>
          <p className="text-gray-600 mt-1">Your professional overview and quick actions</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-sm animate-pulse">
                <div className="h-4 w-24 bg-gray-200 rounded" />
                <div className="mt-4 h-8 w-32 bg-gray-200 rounded" />
                <div className="mt-6 h-3 w-40 bg-gray-100 rounded" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <StatCard title="Assessments (recent)" value={recentAssessments.length} icon={BarChart3} footer={'Synced from server'} delta={recentAssessments.length > 0 ? 4 : 0} />
            <StatCard title="Skill Gap Analyses" value={skillGapResults.length} icon={Target} footer={`Last: ${lastSkillGapDate}`} delta={skillGapResults.length > 0 ? 7 : 0} />
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Profile Completeness</p>
                  <p className="mt-2 text-3xl font-semibold">{profileCompleteness}%</p>
                </div>
                <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600">
                  <User className="w-6 h-6" />
                </div>
              </div>
              <div className="mt-4">
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-2 bg-indigo-500 rounded-full" style={{ width: `${profileCompleteness}%` }} />
                </div>
                <div className="mt-2 text-xs text-gray-500">Complete your profile to improve personalization</div>
              </div>
            </div>
            <StatCard title="Next Steps" value={<span className="text-indigo-600">Ready</span>} icon={CheckCircle2} footer="Pick an action below" />
          </div>
        )}

        {/* Profile Checklist */}
        <div className="mt-10 bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold flex items-center gap-2"><ListChecks className="w-5 h-5"/> Profile Checklist</h2>
          </div>
          {user ? (
            <ul className="mt-4 space-y-3">
              {(() => {
                const prefs = user?.preferences || {};
                const items = [
                  {
                    key: 'stream',
                    label: 'Set your stream (Science/Commerce/Humanities)',
                    done: !!prefs.stream,
                    to: '/profile/edit'
                  },
                  {
                    key: 'targetExam',
                    label: 'Pick a target exam (e.g., JEE/NEET/CUET/—)',
                    done: !!prefs.targetExam,
                    to: '/profile/edit'
                  },
                  {
                    key: 'colleges',
                    label: 'Add at least 3 colleges to your shortlist',
                    done: Array.isArray(prefs.colleges) && prefs.colleges.length >= 3,
                    to: '/profile/edit'
                  },
                ];
                return items.map(it => (
                  <li key={it.key} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      {it.done ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <Circle className="w-5 h-5 text-gray-400" />
                      )}
                      <span className={it.done ? 'text-gray-500 line-through' : ''}>{it.label}</span>
                    </div>
                    {!it.done && (
                      <Link to={it.to} className="text-xs text-indigo-600 hover:underline">Update</Link>
                    )}
                  </li>
                ));
              })()}
            </ul>
          ) : (
            <div className="mt-4 text-sm text-gray-600">Sign in to see your checklist.</div>
          )}
        </div>

        {/* Personalized Journey section */}
        <div className="mt-10 bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Personalized Journey</h2>
            <div className="text-xs text-gray-500">
              {cls ? `Class: ${cls}` : 'Class: -'}
              {typeof stream === 'string' && stream ? ` • Stream: ${stream}` : ''}
            </div>
          </div>
          {journeySteps.length ? (
            <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {journeySteps.map((s, i) => (
                <Link key={i} to={s.to} className={`block p-5 rounded-xl border hover:shadow-md transition ${isStepDone(s.title) ? 'bg-emerald-50 border-emerald-200' : ''}`}>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium flex items-center gap-2">
                      {isStepDone(s.title) ? <CheckCircle2 className="w-4 h-4 text-emerald-600"/> : <Circle className="w-4 h-4 text-gray-400"/>}
                      {s.title}
                    </p>
                    <div className="flex items-center gap-2">
                      {s.badge && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">{s.badge}</span>
                      )}
                      <button onClick={(e) => toggleStep(e, s.title)} className="text-xs text-gray-500 hover:text-emerald-600">{isStepDone(s.title) ? 'Undo' : 'Done'}</button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">{s.desc}</p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="mt-4 p-5 rounded-xl border bg-slate-50 text-sm text-gray-600">
              We couldn’t detect your class/stream. Complete your profile to get a tailored roadmap.
              <Link to="/profile/edit" className="ml-2 text-indigo-600 hover:underline">Complete Profile</Link>
            </div>
          )}
        </div>

        {/* Top Recommended Careers */}
        <div className="mt-10 bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold flex items-center gap-2"><Sparkles className="w-5 h-5 text-yellow-500"/> Top Recommended Careers</h2>
            {!topCareers.length && (
              <Link to="/test" className="text-xs text-indigo-600 hover:underline">Take Career Test</Link>
            )}
          </div>
          {topCareers.length ? (
            <ul className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {topCareers.map((c, idx) => (
                <li key={idx} className="p-4 rounded-xl border">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{c.title || 'Career'}</p>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100">{typeof c.match === 'number' ? `${c.match}%` : '—'}</span>
                  </div>
                  {c.description && <p className="text-xs text-gray-600 mt-2 line-clamp-3">{c.description}</p>}
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-4 text-sm text-gray-600">No assessments found on this device. Run a quick assessment to see personalized career recommendations.</div>
          )}
        </div>

        <div className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold flex items-center gap-2"><Sparkles className="w-5 h-5 text-yellow-500"/> Recommended Actions</h2>
            </div>
            <div className="mt-4 grid sm:grid-cols-2 gap-4">
              <Link to="/test" className="block p-5 rounded-xl border hover:shadow-md transition">
                <div className="flex items-center gap-3 text-indigo-700"><ListChecks className="w-5 h-5"/> Take Career Test</div>
                <p className="text-sm text-gray-600 mt-2">Answer questions to get AI-generated career recommendations.</p>
              </Link>
              <Link to="/skill-gap/list" className="block p-5 rounded-xl border hover:shadow-md transition">
                <div className="flex items-center gap-3 text-purple-700"><Target className="w-5 h-5"/> View Skill Gap Analyses</div>
                <p className="text-sm text-gray-600 mt-2">Browse your saved analyses and track progress.</p>
              </Link>
              <Link to="/profile/overview" className="block p-5 rounded-xl border hover:shadow-md transition">
                <div className="flex items-center gap-3 text-slate-700"><User className="w-5 h-5"/> View Profile</div>
                <p className="text-sm text-gray-600 mt-2">Check details and improve your profile completeness.</p>
              </Link>
              <Link to="/skill-gap" className="block p-5 rounded-xl border hover:shadow-md transition">
                <div className="flex items-center gap-3 text-emerald-700"><Clock className="w-5 h-5"/> Resume Last Analysis</div>
                <p className="text-sm text-gray-600 mt-2">Open the latest saved skill gap analysis.</p>
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold">Recent Activity</h2>
            {loading ? (
              <div className="mt-4 space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="p-3 rounded-lg border animate-pulse">
                    <div className="h-4 w-24 bg-gray-200 rounded" />
                    <div className="mt-2 h-3 w-40 bg-gray-100 rounded" />
                  </div>
                ))}
              </div>
            ) : (
              <ul className="mt-4 space-y-3">
                {recentAssessments.slice(0, 5).map((r, i) => (
                  <li key={r._id || i} className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="text-sm font-medium">Assessment</p>
                      <p className="text-xs text-gray-500">{new Date(r.timestamp).toLocaleString()} • {r.group || r.groupName || '—'}</p>
                    </div>
                    <Link
                      to="/test/questions"
                      className="text-xs text-indigo-600 hover:underline"
                    >Open</Link>
                  </li>
                ))}
                {skillGapResults.slice(0, 5).map((sg) => (
                  <li key={sg._id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="text-sm font-medium">Skill Gap • {sg.groupName || 'General'}</p>
                      <p className="text-xs text-gray-500">{new Date(sg.createdAt).toLocaleString()}</p>
                    </div>
                    <Link
                      to={`/skill-gap/${sg._id}`}
                      className="text-xs text-purple-600 hover:underline"
                    >View</Link>
                  </li>
                ))}
                {!recentAssessments.length && !skillGapResults.length && (
                  <li className="text-sm text-gray-500 p-6 text-center border rounded-lg">No recent activity yet. Start by taking the career test or creating a skill gap analysis.</li>
                )}
              </ul>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
