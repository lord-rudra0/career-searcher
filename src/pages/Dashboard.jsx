import React, { useEffect, useMemo, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import api from '@/services/api';
import { User, Target, BarChart3, CheckCircle2, Clock, ListChecks, Sparkles, TrendingUp } from 'lucide-react';

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

  const lastSkillGapDate = useMemo(() => {
    if (!skillGapResults.length) return '-';
    const latest = skillGapResults.reduce((a, b) => new Date(a.createdAt) > new Date(b.createdAt) ? a : b);
    return new Date(latest.createdAt).toLocaleString();
  }, [skillGapResults]);

  const recentAssessments = useMemo(() => {
    try {
      const arr = JSON.parse(localStorage.getItem('careerResults') || '[]');
      return Array.isArray(arr) ? arr : [];
    } catch { return []; }
  }, []);

  const profileCompleteness = useMemo(() => {
    if (!user) return 0;
    const fields = ['name', 'email', 'groupType', 'preferences'];
    const filled = fields.filter(f => !!user[f] && (typeof user[f] !== 'object' || Object.keys(user[f]).length > 0)).length;
    return Math.round((filled / fields.length) * 100);
  }, [user]);

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
            <StatCard title="Assessments (recent)" value={recentAssessments.length} icon={BarChart3} footer="Stored locally on this device" delta={recentAssessments.length > 0 ? 4 : 0} />
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
                  <li key={i} className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="text-sm font-medium">Assessment</p>
                      <p className="text-xs text-gray-500">{new Date(r.timestamp).toLocaleString()} • {r.group}</p>
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
