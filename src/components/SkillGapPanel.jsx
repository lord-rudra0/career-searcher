import React from 'react';
import { CheckCircle2, XCircle, Target, Award, BookOpen, Rocket } from 'lucide-react';

const Pill = ({ children, type = 'default' }) => {
  const colors = {
    default: 'bg-gray-100 text-gray-800',
    missing: 'bg-red-100 text-red-700',
    strengthen: 'bg-yellow-100 text-yellow-800',
    have: 'bg-green-100 text-green-700',
  };
  return (
    <span className={`inline-block px-2 py-1 rounded-full text-xs mr-2 mb-2 ${colors[type]}`}>
      {children}
    </span>
  );
};

const Section = ({ title, icon: Icon, children }) => (
  <div className="mb-8">
    <div className="flex items-center mb-3">
      {Icon && <Icon className="w-5 h-5 mr-2 text-indigo-600" />}
      <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
    </div>
    <div className="bg-white rounded-lg shadow p-4">{children}</div>
  </div>
);

const SkillList = ({ title, items = [], type = 'default' }) => (
  <div className="mb-3">
    <div className="text-sm font-medium text-gray-700 mb-2">{title}</div>
    <div>
      {(items || []).slice(0, 20).map((s, i) => (
        <Pill key={`${title}-${i}`} type={type}>{s}</Pill>
      ))}
      {!items?.length && <div className="text-xs text-gray-500">No items</div>}
    </div>
  </div>
);

const LinkList = ({ items = [] }) => (
  <ul className="list-disc list-inside space-y-2">
    {(items || []).slice(0, 8).map((c, i) => (
      <li key={i} className="text-sm text-gray-700">
        {c.title || c.name}
        {c.provider ? ` — ${c.provider}` : ''}
        {c.platform ? ` — ${c.platform}` : ''}
        {c.link && (
          <a href={c.link} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline ml-1">
            Visit
          </a>
        )}
      </li>
    ))}
  </ul>
);

export default function SkillGapPanel({ data }) {
  if (!data) return null;
  const { userSkills = {}, careers = [] } = data;

  return (
    <div className="max-w-5xl mx-auto mt-10 animate-fade-in">
      <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent flex items-center">
        <Rocket className="w-7 h-7 mr-2" /> Personalized Skill Gap Analysis
      </h2>

      {/* User skills summary */}
      <Section title="Your Current Skills" icon={Award}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SkillList title="Core" items={userSkills.core} type="have" />
          <SkillList title="Technical" items={userSkills.technical} type="have" />
          <SkillList title="Soft" items={userSkills.soft} type="have" />
          <SkillList title="Tools" items={userSkills.tools} type="have" />
          <SkillList title="Certifications" items={userSkills.certifications} type="have" />
        </div>
      </Section>

      {/* Careers */}
      {careers.map((c, idx) => (
        <div key={idx} className="mb-10">
          <div className="flex items-center justify-between mb-3">
            <div className="text-2xl font-semibold text-blue-700">{c.title}</div>
            {typeof c.match === 'number' && (
              <div className="text-sm px-2 py-1 rounded bg-blue-50 text-blue-700">{c.match}% match</div>
            )}
          </div>

          <Section title="Required Skills" icon={Target}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SkillList title="Core" items={c.requiredSkills?.core} />
              <SkillList title="Technical" items={c.requiredSkills?.technical} />
              <SkillList title="Soft" items={c.requiredSkills?.soft} />
              <SkillList title="Tools" items={c.requiredSkills?.tools} />
              <SkillList title="Certifications" items={c.requiredSkills?.certifications} />
            </div>
          </Section>

          <Section title="Skill Gaps">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SkillList title="Missing" items={c.gaps?.missing} type="missing" />
              <SkillList title="To Strengthen" items={c.gaps?.toStrengthen} type="strengthen" />
            </div>
          </Section>

          <Section title="Recommended Courses" icon={BookOpen}>
            <LinkList items={c.recommendations?.courses} />
          </Section>

          <Section title="Recommended Projects">
            <ul className="list-disc list-inside space-y-2">
              {(c.recommendations?.projects || []).slice(0, 6).map((p, i) => (
                <li key={i} className="text-sm text-gray-700">
                  {p.title || p.name}
                  {p.description ? ` — ${p.description}` : ''}
                </li>
              ))}
              {!c.recommendations?.projects?.length && (
                <div className="text-xs text-gray-500">No projects listed</div>
              )}
            </ul>
          </Section>

          <Section title="Next 90 Days Plan">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-700">
              <div>
                <div className="font-medium mb-1">Days 0-30</div>
                <div>{c.next90DaysPlan?.days0_30 || c.next90DaysPlan?.days0to30 || '—'}</div>
              </div>
              <div>
                <div className="font-medium mb-1">Days 31-60</div>
                <div>{c.next90DaysPlan?.days31_60 || c.next90DaysPlan?.days31to60 || '—'}</div>
              </div>
              <div>
                <div className="font-medium mb-1">Days 61-90</div>
                <div>{c.next90DaysPlan?.days61_90 || c.next90DaysPlan?.days61to90 || '—'}</div>
              </div>
            </div>
          </Section>

          {Array.isArray(c.metrics) && c.metrics.length > 0 && (
            <Section title="Metrics to Track">
              <ul className="space-y-1">
                {c.metrics.slice(0, 8).map((m, i) => (
                  <li key={i} className="text-sm text-gray-700 flex items-center">
                    <CheckCircle2 className="w-4 h-4 text-green-600 mr-2" /> {m}
                  </li>
                ))}
              </ul>
            </Section>
          )}
        </div>
      ))}
    </div>
  );
}
