import React, { useMemo } from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer
} from 'recharts';

// Utility to clamp 0-100
const clamp = (n) => Math.max(0, Math.min(100, Number.isFinite(n) ? n : 0));

// Try to extract the 4-dim scores from a career item
// Supported shapes:
// - career.scores: { logic, creativity, social, organization }
// - career.matchBreakdown: { logic, creativity, social, organization }
// - fallback: evenly distributed/neutral 50
const getScores = (career) => {
  const src = career?.scores || career?.matchBreakdown || {};
  const logic = clamp(src.logic ?? src.Logic ?? 50);
  const creativity = clamp(src.creativity ?? src.Creativity ?? 50);
  const social = clamp(src.social ?? src.Social ?? 50);
  const organization = clamp(src.organization ?? src.Organization ?? 50);
  return { logic, creativity, social, organization };
};

// Aggregate strengths across careers (simple average of top K)
const aggregateStrengths = (careers, topK = 4) => {
  if (!Array.isArray(careers) || careers.length === 0) {
    return { logic: 50, creativity: 50, social: 50, organization: 50 };
  }
  const list = careers.slice(0, topK).map(getScores);
  const sum = list.reduce((acc, s) => ({
    logic: acc.logic + s.logic,
    creativity: acc.creativity + s.creativity,
    social: acc.social + s.social,
    organization: acc.organization + s.organization,
  }), { logic: 0, creativity: 0, social: 0, organization: 0 });
  const n = list.length || 1;
  return {
    logic: Math.round(sum.logic / n),
    creativity: Math.round(sum.creativity / n),
    social: Math.round(sum.social / n),
    organization: Math.round(sum.organization / n),
  };
};

export default function ResultsSnapshot({ careers }) {
  const strengths = useMemo(() => aggregateStrengths(careers, 4), [careers]);

  const radarData = useMemo(() => ([
    { trait: 'Logic', value: strengths.logic },
    { trait: 'Creativity', value: strengths.creativity },
    { trait: 'Social', value: strengths.social },
    { trait: 'Organization', value: strengths.organization },
  ]), [strengths]);

  const topCareers = useMemo(() => (Array.isArray(careers) ? careers.slice(0, 4) : []), [careers]);

  const heatCellClass = (v) => {
    const val = clamp(v);
    if (val >= 70) return 'bg-emerald-100 text-emerald-700';
    if (val >= 40) return 'bg-amber-100 text-amber-700';
    return 'bg-gray-100 text-gray-600';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-card rounded-2xl shadow-xl p-6 border">
        <h3 className="text-lg font-semibold text-foreground mb-1">Your Career Snapshot</h3>
        <p className="text-sm text-muted-foreground mb-4">Here is your strengths snapshot based on your results.</p>
        <div className="flex gap-2 mb-4 text-xs">
          <span className="px-2 py-1 rounded-full bg-muted text-foreground/80">Social</span>
          <span className="px-2 py-1 rounded-full bg-muted text-foreground/80">Creativity</span>
          <span className="px-2 py-1 rounded-full bg-muted text-foreground/80">Logic</span>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="trait" tick={{ fill: 'currentColor' }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} />
              <Radar name="You" dataKey="value" stroke="#22c55e" fill="#22c55e" fillOpacity={0.3} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-card rounded-2xl shadow-xl p-6 border">
        <h3 className="text-lg font-semibold text-foreground mb-1">Career Fit Heatmap</h3>
        <p className="text-sm text-muted-foreground mb-4">How your strengths align with roles</p>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground">
                <th className="py-2 pr-3 font-medium">Career</th>
                <th className="py-2 px-2 font-medium">Logic</th>
                <th className="py-2 px-2 font-medium">Creativity</th>
                <th className="py-2 px-2 font-medium">Social</th>
                <th className="py-2 px-2 font-medium">Organization</th>
              </tr>
            </thead>
            <tbody>
              {topCareers.map((c, i) => {
                const s = getScores(c);
                return (
                  <tr key={i} className="border-t">
                    <td className="py-2 pr-3 text-foreground">{c.title || c.name || 'Career'}</td>
                    <td className={`py-1 px-2 rounded ${heatCellClass(s.logic)}`}>{s.logic}</td>
                    <td className={`py-1 px-2 rounded ${heatCellClass(s.creativity)}`}>{s.creativity}</td>
                    <td className={`py-1 px-2 rounded ${heatCellClass(s.social)}`}>{s.social}</td>
                    <td className={`py-1 px-2 rounded ${heatCellClass(s.organization)}`}>{s.organization}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
