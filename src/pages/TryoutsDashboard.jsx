import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '@/services/api';

const TryoutsDashboard = () => {
  const navigate = useNavigate();
  const [pathA, setPathA] = useState('Frontend Developer');
  const [pathB, setPathB] = useState('Data Analyst');
  const [durationDays, setDurationDays] = useState(7);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState('');
  const [items, setItems] = useState([]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!pathA || !pathB) {
      setError('Please provide both paths.');
      return;
    }
    if (pathA === pathB) {
      setError('Paths must be different.');
      return;
    }
    setError('');
    setCreating(true);
    try {
      const res = await api.createTryout({ pathA, pathB, durationDays: Number(durationDays) || 7 });
      const id = res?.tryoutId;
      if (id) {
        navigate(`/tryouts/${id}/summary`);
      }
    } catch (err) {
      setError(err.message || 'Failed to create tryout');
    } finally {
      setCreating(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      setListLoading(true);
      setListError('');
      try {
        const res = await api.listTryouts();
        setItems(res?.tryouts || []);
      } catch (err) {
        setListError(err.message || 'Failed to load your tryouts');
      } finally {
        setListLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 pt-28 pb-20 max-w-3xl">
        <h1 className="text-3xl font-bold text-foreground mb-6">Career A/B Tryouts</h1>
        <p className="text-muted-foreground mb-8">Trial two career paths for a week with daily micro-tasks and compare fit.</p>

        <form onSubmit={handleCreate} className="bg-card rounded-2xl shadow-xl p-6 mb-8 border">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Path A</label>
              <input className="w-full bg-background border rounded-lg px-3 py-2" value={pathA} onChange={(e) => setPathA(e.target.value)} placeholder="e.g., Frontend Developer" />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Path B</label>
              <input className="w-full bg-background border rounded-lg px-3 py-2" value={pathB} onChange={(e) => setPathB(e.target.value)} placeholder="e.g., Data Analyst" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-muted-foreground mb-1">Duration (days)</label>
              <input type="number" min="3" max="14" className="w-40 bg-background border rounded-lg px-3 py-2" value={durationDays} onChange={(e) => setDurationDays(e.target.value)} />
            </div>
          </div>
          {error && <div className="mt-4 text-sm text-destructive">{error}</div>}
          <div className="mt-6 flex gap-3">
            <button type="submit" disabled={creating} className={`px-5 py-2 rounded-lg text-white bg-primary hover:bg-primary/90 ${creating ? 'opacity-60' : ''}`}>{creating ? 'Creating...' : 'Start Tryout'}</button>
            <Link to="/" className="px-5 py-2 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground">Cancel</Link>
          </div>
        </form>

        <div className="text-sm text-muted-foreground mb-10">
          After creation, you'll be redirected to the summary page where you can see tasks and log progress.
        </div>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">Your Tryouts</h2>
          {listLoading ? (
            <div className="text-muted-foreground">Loading...</div>
          ) : listError ? (
            <div className="text-destructive text-sm">{listError}</div>
          ) : items.length === 0 ? (
            <div className="text-muted-foreground text-sm">No tryouts yet. Create your first above.</div>
          ) : (
            <div className="grid gap-3">
              {items.map(t => (
                <div key={t.id} className="bg-card border rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-foreground">{t.pathA} vs {t.pathB}</div>
                    <div className="text-xs text-muted-foreground">Duration: {t.durationDays} days • Created: {new Date(t.createdAt).toLocaleString()}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="hidden md:flex text-xs text-muted-foreground gap-2">
                      <span>A fit: {Math.round(t.summary?.A?.fitScore || 0)}</span>
                      <span>B fit: {Math.round(t.summary?.B?.fitScore || 0)}</span>
                    </div>
                    <Link to={`/tryouts/${t.id}/summary`} className="px-4 py-2 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground">Open</Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default TryoutsDashboard;
