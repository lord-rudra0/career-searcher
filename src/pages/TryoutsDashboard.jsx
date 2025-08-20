import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '@/services/api';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import { TrendingUp, Target, Sparkles } from 'lucide-react';

const TryoutsDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [pathA, setPathA] = useState('Frontend Developer');
  const [pathB, setPathB] = useState('Data Analyst');
  const [durationDays, setDurationDays] = useState(7);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState('');
  const [items, setItems] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [lastFocused, setLastFocused] = useState('A');

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

  // Personalize default paths using user's recent top careers
  useEffect(() => {
    let cancelled = false;
    const primeSuggestions = async () => {
      try {
        const res = await api.getTopCareers(5);
        const tops = (res?.careers || []).map(c => c.title).filter(Boolean);
        // Fallbacks by groupType
        const g = (user?.groupType || '').toLowerCase();
        const fallbacks = g.includes('9') || g.includes('10')
          ? ['Software Developer', 'Designer', 'Marketing Analyst']
          : g.includes('11') || g.includes('12')
          ? ['Computer Science', 'Business Analyst', 'UI/UX Designer']
          : g.includes('post') || g.includes('pg')
          ? ['Data Scientist', 'Product Manager', 'Cloud Engineer']
          : ['Frontend Developer', 'Data Analyst', 'Cybersecurity Analyst'];
        const uniq = Array.from(new Set([...(tops || []), ...fallbacks]));
        if (!cancelled) {
          setSuggestions(uniq);
          if (uniq[0] && uniq[1]) {
            setPathA(uniq[0]);
            setPathB(uniq[1]);
          }
        }
      } catch {}
    };
    primeSuggestions();
    return () => { cancelled = true; };
  }, [user]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-28 pb-20 max-w-4xl">
        <div className="mb-2 inline-flex items-center gap-2 text-indigo-600 text-sm font-medium">
          <Sparkles className="w-4 h-4" /> Personalized
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Career A/B Tryouts</h1>
        <p className="text-muted-foreground mb-8">Pick two career paths and run a short experiment. Log small daily tasks, then compare fit and completion.</p>

        <form onSubmit={handleCreate} className="bg-card rounded-2xl shadow-xl p-6 mb-8 border">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Path A</label>
              <input className="w-full bg-background border rounded-lg px-3 py-2" value={pathA} onChange={(e) => setPathA(e.target.value)} onFocus={()=>setLastFocused('A')} placeholder="e.g., Frontend Developer" list="tryout-suggestions" />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Path B</label>
              <input className="w-full bg-background border rounded-lg px-3 py-2" value={pathB} onChange={(e) => setPathB(e.target.value)} onFocus={()=>setLastFocused('B')} placeholder="e.g., Data Analyst" list="tryout-suggestions" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-muted-foreground mb-1">Duration (days)</label>
              <input type="number" min="3" max="14" className="w-40 bg-background border rounded-lg px-3 py-2" value={durationDays} onChange={(e) => setDurationDays(e.target.value)} />
            </div>
          </div>
          <div className="mt-2">
            <button type="button" className="text-xs px-3 py-1 rounded-lg border bg-background hover:bg-muted" onClick={()=>{ const a=pathA; setPathA(pathB); setPathB(a); }}>Swap A/B</button>
          </div>
          {suggestions?.length > 0 && (
            <>
              <datalist id="tryout-suggestions">
                {suggestions.map((s) => (<option key={s} value={s} />))}
              </datalist>
              <div className="mt-3 text-xs text-muted-foreground">Suggestions based on your profile</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {suggestions.slice(0,6).map(s => (
                  <button key={s} type="button" onClick={()=>{
                    if (lastFocused === 'A') setPathA(s); else setPathB(s);
                  }} className="px-3 py-1 rounded-full border bg-background hover:bg-muted text-foreground text-xs">
                    {s}
                  </button>
                ))}
              </div>
            </>
          )}
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
            <div className="grid gap-4">
              {items.map(t => {
                const aFit = Math.round(t.summary?.A?.fitScore || 0);
                const bFit = Math.round(t.summary?.B?.fitScore || 0);
                const aComp = Math.round((t.summary?.A?.completionRate || 0) * 100);
                const bComp = Math.round((t.summary?.B?.completionRate || 0) * 100);
                return (
                  <div key={t.id} className="bg-card border rounded-2xl p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="font-semibold text-foreground text-lg flex items-center gap-2">
                          <Target className="w-4 h-4 text-indigo-500" /> {t.pathA} <span className="text-muted-foreground">vs</span> {t.pathB}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">Duration: {t.durationDays} days • Created: {new Date(t.createdAt).toLocaleString()}</div>
                      </div>
                      <Link to={`/tryouts/${t.id}/summary`} className="px-4 py-2 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground">Open</Link>
                    </div>
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[{k:'A', name:t.pathA, fit:aFit, comp:aComp}, {k:'B', name:t.pathB, fit:bFit, comp:bComp}].map(row => (
                        <div key={row.k} className="p-3 rounded-xl bg-muted/40 border">
                          <div className="flex items-center justify-between text-sm">
                            <div className="font-medium text-foreground">{row.name}</div>
                            <div className="inline-flex items-center gap-1 text-emerald-600 text-xs">
                              <TrendingUp className="w-3 h-3" /> Fit {row.fit}
                            </div>
                          </div>
                          <div className="mt-2 text-xs text-muted-foreground">Completion</div>
                          <div className="w-full bg-background rounded-full h-2 overflow-hidden">
                            <div className="bg-indigo-500 h-2" style={{ width: `${Math.min(100, Math.max(0, row.comp))}%` }} />
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">{row.comp}% completed</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default TryoutsDashboard;
