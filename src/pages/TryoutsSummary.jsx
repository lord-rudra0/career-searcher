import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '@/services/api';

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

  return (
    <div className={`p-4 rounded-xl border ${t.status === 'completed' ? 'bg-green-50' : 'bg-card'}`}>
      <div className="font-medium text-foreground">{t.title}</div>
      <div className="text-sm text-muted-foreground mb-2">Skill: {t.skillTag} • Day {t.day + 1}</div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 items-end">
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Time (min)</label>
          <input className="w-full bg-background border rounded-lg px-2 py-1" value={timeMin} onChange={(e)=>setTimeMin(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Interest</label>
          <input type="number" min="1" max="5" className="w-full bg-background border rounded-lg px-2 py-1" value={interest} onChange={(e)=>setInterest(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Difficulty</label>
          <input type="number" min="1" max="5" className="w-full bg-background border rounded-lg px-2 py-1" value={difficulty} onChange={(e)=>setDifficulty(e.target.value)} />
        </div>
        <div className="md:col-span-1 col-span-2">
          <label className="block text-xs text-muted-foreground mb-1">Evidence (link)</label>
          <input className="w-full bg-background border rounded-lg px-2 py-1" value={evidence} onChange={(e)=>setEvidence(e.target.value)} placeholder="https://..." />
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <button disabled={saving || disabled} onClick={submit} className={`px-4 py-1.5 rounded-lg text-white bg-primary hover:bg-primary/90 ${saving||disabled?'opacity-60':''}`}>{saving?'Saving...':'Log Progress'}</button>
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

  const logHandler = (key, taskId) => async (payload) => {
    await api.logTask({ id, key, taskId, payload });
    await refresh();
  };

  if (loading) return <div className="min-h-screen grid place-items-center"><div className="text-muted-foreground">Loading...</div></div>;
  if (error) return <div className="min-h-screen grid place-items-center"><div className="text-destructive">{error}</div></div>;
  if (!data) return <div className="min-h-screen grid place-items-center"><div className="text-muted-foreground">Not found</div></div>;

  const { pathA, pathB, durationDays, tasks } = data;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 pt-28 pb-20 max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-foreground">Tryouts Summary</h1>
          <Link to="/tryouts" className="px-4 py-2 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground">New Tryout</Link>
        </div>
        <p className="text-muted-foreground mb-6">Paths: <span className="font-medium text-foreground">{pathA}</span> vs <span className="font-medium text-foreground">{pathB}</span> • Duration: {durationDays} days</p>

        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Metric label={`Fit Score (${pathA})`} value={Math.round((summary?.A?.fitScore || 0))} />
            <Metric label={`Fit Score (${pathB})`} value={Math.round((summary?.B?.fitScore || 0))} />
            <Metric label={`Completion (${pathA})`} value={`${Math.round((summary?.A?.completionRate || 0) * 100)}%`} />
            <Metric label={`Completion (${pathB})`} value={`${Math.round((summary?.B?.completionRate || 0) * 100)}%`} />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {['A','B'].map((key) => (
            <div key={key} className="bg-card rounded-2xl shadow-xl p-6 border">
              <h2 className="text-xl font-semibold mb-4">Path {key}: {key==='A'?pathA:pathB}</h2>
              <div className="space-y-3">
                {(tasks?.[key]||[]).map((t) => (
                  <TaskItem key={t.id} t={t} onLog={(payload)=>logHandler(key, t.id)(payload)} />
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
