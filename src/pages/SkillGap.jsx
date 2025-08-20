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
  const [plans, setPlans] = useState({}); // { [careerIndex]: { day0_30, day31_60, day61_90 } }
  const [planLoading, setPlanLoading] = useState({}); // { [careerIndex]: boolean }

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

  const handleClosePlan = (careerIndex) => {
    setPlans(prev => {
      const next = { ...prev };
      delete next[careerIndex];
      return next;
    });
  };

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

  const handleGeneratePlan = async (careerIndex, course) => {
    try {
      setPlanLoading(prev => ({ ...prev, [careerIndex]: true }));
      const career = data?.careers?.[careerIndex];
      const payload = {
        careerTitle: career?.title,
        course,
        userSkills: data?.userSkills || {},
        gaps: career?.gaps || {},
      };
      const res = await api.generateCoursePlan(payload);
      const raw = res?.plan || {};
      const pick = (obj, keys) => keys.map(k => obj?.[k]).find(v => v !== undefined && v !== null);
      const toArray = (val) => {
        if (!val) return [];
        if (Array.isArray(val)) return val.filter(Boolean);
        if (typeof val === 'string') {
          // split by newline or bullet
          return val
            .split(/\r?\n|•|\d+\.|\-/)
            .map(s => s.trim())
            .filter(Boolean);
        }
        return [];
      };
      const normalized = {
        day0_30: toArray(pick(raw, ['day0_30','days0_30','day0-30','days0-30','0_30','0-30'])),
        day31_60: toArray(pick(raw, ['day31_60','days31_60','day31-60','days31-60','31_60','31-60'])),
        day61_90: toArray(pick(raw, ['day61_90','days61_90','day61-90','days61-90','61_90','61-90'])),
      };
      setPlans(prev => ({ ...prev, [careerIndex]: normalized }));
    } catch (e) {
      console.error('Failed to generate plan', e);
      setError(e.message || 'Failed to generate plan');
    } finally {
      setPlanLoading(prev => ({ ...prev, [careerIndex]: false }));
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
              plans={plans}
              onGeneratePlan={handleGeneratePlan}
              planLoading={planLoading}
              onClosePlan={handleClosePlan}
            />
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default SkillGapPage;
