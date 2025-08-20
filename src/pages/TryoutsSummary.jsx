import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '@/services/api';
import Navbar from '@/components/Navbar';
import { Award, TrendingUp, Clock } from 'lucide-react';

const Metric = ({ label, value }) => (
  <div className="p-4 rounded-lg bg-muted/40 border">
    <div className="text-xs uppercase text-muted-foreground">{label}</div>
    <div className="text-xl font-semibold text-foreground">{value}</div>
  </div>
);

const TaskItem = ({ t, onLog, disabled }) => {
  const [timeMin, setTimeMin] = useState(t.timeMin || '');
  const [interest, setInterest] = useState(t.interest || 3);
  const [difficulty, setDifficulty] = useState(t.difficulty || 3);
  const [evidence, setEvidence] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    try {
      await onLog({ timeMin: Number(timeMin) || 0, interest: Number(interest) || 0, difficulty: Number(difficulty) || 0, evidence });
      setEvidence('');
    } finally {
      setSaving(false);
    }
  };

  const isCompleted = t.status === 'completed';
  return (
    <div className={`p-4 rounded-xl border ${isCompleted ? 'bg-green-50' : 'bg-card'}`}>
      <div className="font-medium text-foreground">{t.title}</div>
      <div className="text-sm text-muted-foreground mb-2">Skill: {t.skillTag} • Day {t.day + 1}</div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 items-end">
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Time (min)</label>
          <input className="w-full bg-background border rounded-lg px-2 py-1" value={timeMin} onChange={(e)=>setTimeMin(e.target.value)} disabled={isCompleted || disabled} />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Interest</label>
          <input type="number" min="1" max="5" className="w-full bg-background border rounded-lg px-2 py-1" value={interest} onChange={(e)=>setInterest(e.target.value)} disabled={isCompleted || disabled} />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Difficulty</label>
          <input type="number" min="1" max="5" className="w-full bg-background border rounded-lg px-2 py-1" value={difficulty} onChange={(e)=>setDifficulty(e.target.value)} disabled={isCompleted || disabled} />
        </div>
        <div className="md:col-span-1 col-span-2">
          <label className="block text-xs text-muted-foreground mb-1">Evidence (link)</label>
          <input className="w-full bg-background border rounded-lg px-2 py-1" value={evidence} onChange={(e)=>setEvidence(e.target.value)} placeholder="https://..." disabled={isCompleted || disabled} />
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <button disabled={saving || disabled || isCompleted} onClick={submit} className={`px-4 py-1.5 rounded-lg text-white bg-primary hover:bg-primary/90 ${(saving||disabled||isCompleted)?'opacity-60':''}`}>{saving?'Saving...': isCompleted ? 'Completed' : 'Log Progress'}</button>
      </div>
    </div>
  );
};

const TryoutsSummary = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = async () => {
    setLoading(true);
    try {
      const res = await api.getTryout(id);
      setData(res?.tryout || null);
    } catch (err) {
      setError(err.message || 'Failed to load tryout');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, [id]);

  const summary = useMemo(() => {
    if (!data) return null;
    const s = data.summary || {};
    return s;
  }, [data]);

  const stats = useMemo(() => {
    const build = (arr = []) => {
      const total = arr.length || 0;
      const completed = arr.filter(x => x.status === 'completed').length;
      const time = arr.reduce((a,b)=>a + (Number(b.timeMin)||0), 0);
      const interest = arr.reduce((a,b)=>a + (Number(b.interest)||0), 0);
      const difficulty = arr.reduce((a,b)=>a + (Number(b.difficulty)||0), 0);
      return {
        total,
        completed,
        completionRate: total ? completed/total : 0,
        avgTime: total ? Math.round(time/total) : 0,
        avgInterest: total ? (interest/total).toFixed(1) : '0.0',
        avgDifficulty: total ? (difficulty/total).toFixed(1) : '0.0'
      };
    };
    const A = build(data?.tasks?.A || []);
    const B = build(data?.tasks?.B || []);
    return { A, B };
  }, [data]);

  const logHandler = (key, taskId) => async (payload) => {
    await api.logTask({ id, key, taskId, payload });
    await refresh();
  };

  if (loading) return <div className="min-h-screen grid place-items-center"><div className="text-muted-foreground">Loading...</div></div>;
  if (error) return <div className="min-h-screen grid place-items-center"><div className="text-destructive">{error}</div></div>;
  if (!data) return <div className="min-h-screen grid place-items-center"><div className="text-muted-foreground">Not found</div></div>;

  const { pathA, pathB, durationDays, tasks } = data;

  const recommendation = useMemo(() => {
    const aFit = Math.round((summary?.A?.fitScore || 0));
    const bFit = Math.round((summary?.B?.fitScore || 0));
    const aComp = Math.round((summary?.A?.completionRate || 0) * 100);
    const bComp = Math.round((summary?.B?.completionRate || 0) * 100);
    if (aFit === 0 && bFit === 0) return null;
    const winner = (aFit + aComp/10) >= (bFit + bComp/10) ? { key:'A', title: pathA, fit:aFit, comp:aComp } : { key:'B', title: pathB, fit:bFit, comp:bComp };
    return { winner };
  }, [summary, pathA, pathB]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-28 pb-20 max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-foreground">Tryouts Summary</h1>
          <Link to="/tryouts" className="px-4 py-2 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground">New Tryout</Link>
        </div>
        <p className="text-muted-foreground mb-6">Paths: <span className="font-medium text-foreground">{pathA}</span> vs <span className="font-medium text-foreground">{pathB}</span> • Duration: {durationDays} days</p>

        {summary && (
          <>
            {recommendation && (
              <div className="mb-6 p-4 rounded-2xl bg-amber-50 border text-amber-800 flex items-start gap-3">
                <Award className="w-5 h-5 mt-0.5" />
                <div>
                  <div className="font-semibold">Recommended: {recommendation.winner.title}</div>
                  <div className="text-sm">Based on fit score and completion, this path looks most promising for you now.</div>
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <Metric label={`Fit Score (${pathA})`} value={Math.round((summary?.A?.fitScore || 0))} />
              <Metric label={`Fit Score (${pathB})`} value={Math.round((summary?.B?.fitScore || 0))} />
              <Metric label={`Completion (${pathA})`} value={`${Math.round((summary?.A?.completionRate || 0) * 100)}%`} />
              <Metric label={`Completion (${pathB})`} value={`${Math.round((summary?.B?.completionRate || 0) * 100)}%`} />
            </div>
          </>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {['A','B'].map((key) => (
            <div key={key} className="bg-card rounded-2xl shadow-xl p-6 border">
              <h2 className="text-xl font-semibold mb-4">Path {key}: {key==='A'?pathA:pathB}</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                <Metric label="Avg Interest" value={stats?.[key]?.avgInterest || '0.0'} />
                <Metric label="Avg Difficulty" value={stats?.[key]?.avgDifficulty || '0.0'} />
                <Metric label="Avg Time (min)" value={stats?.[key]?.avgTime || 0} />
              </div>
              <div className="mb-4">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Completion</span>
                  <span>{Math.round((stats?.[key]?.completionRate || 0) * 100)}%</span>
                </div>
                <div className="w-full bg-background rounded-full h-2 overflow-hidden">
                  <div className="bg-indigo-500 h-2" style={{ width: `${Math.round((stats?.[key]?.completionRate || 0) * 100)}%` }} />
                </div>
              </div>
              <div className="space-y-3">
                {(tasks?.[key]||[]).map((t) => (
                  <TaskItem key={t.id} t={t} disabled={t.status==='completed'} onLog={(payload)=>logHandler(key, t.id)(payload)} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TryoutsSummary;
