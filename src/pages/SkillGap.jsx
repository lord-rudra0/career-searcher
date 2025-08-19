import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SkillGapPanel from '@/components/SkillGapPanel';
import api from '@/services/api';
import { Loader2 } from 'lucide-react';

const SkillGapPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [completedSkills, setCompletedSkills] = useState([]);
  const [completedCourses, setCompletedCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        if (id) {
          const doc = await api.getSkillGapResultById(id);
          setData({ id: doc._id, userSkills: doc.userSkills, careers: doc.careers });
          setCompletedSkills(Array.isArray(doc.completedSkills) ? doc.completedSkills : []);
          setCompletedCourses(Array.isArray(doc.completedCourses) ? doc.completedCourses : []);
        } else {
          // No id: load latest for user
          const res = await api.getUserSkillGapResults(1);
          const latest = res.results?.[0];
          if (!latest) {
            setError('No saved skill gap results found.');
          } else {
            setData({ id: latest._id, userSkills: latest.userSkills, careers: latest.careers });
            setCompletedSkills(Array.isArray(latest.completedSkills) ? latest.completedSkills : []);
            setCompletedCourses(Array.isArray(latest.completedCourses) ? latest.completedCourses : []);
            // normalize route to include id for shareable URL
            navigate(`/skill-gap/${latest._id}`, { replace: true });
          }
        }
      } catch (e) {
        setError(e.message || 'Failed to load skill gap analysis');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, navigate]);

  const handleToggle = async (type, item, nextCompleted) => {
    if (!data?.id) return;
    try {
      const res = await api.updateSkillGapProgress(data.id, { type, item, completed: nextCompleted });
      setCompletedSkills(res.completedSkills || []);
      setCompletedCourses(res.completedCourses || []);
    } catch (e) {
      console.error('Failed to update progress', e);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 pt-28 pb-20">
        {loading && (
          <div className="flex items-center justify-center text-gray-600">
            <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Loading Skill Gap Analysis...
          </div>
        )}
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 mb-4 rounded">{error}</div>
        )}
        {data && (
          <div className="mt-4">
            <SkillGapPanel
              data={data}
              completedSkills={completedSkills}
              completedCourses={completedCourses}
              onToggle={handleToggle}
            />
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default SkillGapPage;
