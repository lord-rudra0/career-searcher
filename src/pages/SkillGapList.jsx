import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import api from '@/services/api';
import { Calendar, Target, Search, Loader2 } from 'lucide-react';

const SkillGapList = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');

  const load = async (lim = limit) => {
    setLoading(true);
    setError(null);
    try {
      const { results } = await api.getUserSkillGapResults(lim);
      setItems(Array.isArray(results) ? results : []);
    } catch (e) {
      setError(e.message || 'Failed to load skill gap analyses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(limit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.trim().toLowerCase();
    return items.filter(it =>
      (it.groupName || '').toLowerCase().includes(q) ||
      (Array.isArray(it.careers) && it.careers.some(c => (c.title || '').toLowerCase().includes(q)))
    );
  }, [items, query]);

  const handleLoadMore = async () => {
    const next = limit + 10;
    setLimit(next);
    await load(next);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 pt-28 pb-20">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl md:text-3xl font-bold flex items-center">
            <Target className="w-6 h-6 text-purple-600 mr-2" />
            My Skill Gap Analyses
          </h1>
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search by group or career title"
              className="pl-9 pr-3 py-2 bg-white rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-300"
            />
          </div>
        </div>

        {loading && (
          <div className="flex items-center text-gray-600">
            <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Loading...
          </div>
        )}
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 mb-4 rounded">{error}</div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="bg-white rounded-xl p-6 text-center text-gray-600">
            No skill gap analyses found.
            <div className="mt-4">
              <Link to="/test" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Take Assessment</Link>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {filtered.map((sg) => (
            <div key={sg._id} className="bg-white rounded-xl p-5 flex items-center justify-between shadow-sm">
              <div>
                <div className="flex items-center space-x-3">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">{new Date(sg.createdAt).toLocaleString()}</span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {sg.groupName && (
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded text-xs">{sg.groupName}</span>
                  )}
                  <span className="text-sm text-gray-700">
                    {Array.isArray(sg.careers) ? `${sg.careers.length} careers` : 'No careers'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate(`/skill-gap/${sg._id}`)}
                  className="px-4 py-2 bg-white border rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  View
                </button>
              </div>
            </div>
          ))}
        </div>

        {filtered.length >= limit && (
          <div className="mt-6 text-center">
            <button
              onClick={handleLoadMore}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
            >
              Load more
            </button>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default SkillGapList;
