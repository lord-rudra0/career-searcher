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

const SkillList = ({ title, items = [], type = 'default', enableToggle = false, completed = [], onToggle }) => (
  <div className="mb-3">
    <div className="text-sm font-medium text-gray-700 mb-2">{title}</div>
    <div>
      {(items || []).slice(0, 50).map((s, i) => {
        const checked = completed.includes(s);
        if (!enableToggle) {
          return (
            <Pill key={`${title}-${i}`} type={type}>{s}</Pill>
          );
        }
        return (
          <label
            key={`${title}-${i}`}
            className={`inline-flex items-center px-2 py-1 rounded-full text-xs mr-2 mb-2 border ${checked ? 'bg-green-50 border-green-300 text-green-700' : 'bg-red-50 border-red-300 text-red-700'}`}
          >
            <input
              type="checkbox"
              className="mr-1"
              checked={checked}
              onChange={(e) => onToggle?.('skill', s, e.target.checked)}
            />
            {s}
          </label>
        );
      })}
      {!items?.length && <div className="text-xs text-gray-500">No items</div>}
    </div>
  </div>
);

const LinkList = ({ items = [], completed = [], onToggle, onGeneratePlan, careerIndex, planLoading = {}, plans = {}, activePlanCourse = {}, onSelectPlanCourse }) => (
  <ul className="list-disc list-inside space-y-2">
    {(items || []).slice(0, 20).map((c, i) => {
      const label = c.title || c.name || c.link || `course-${i}`;
      const courseKey = label;
      const hasPlan = !!plans?.[careerIndex]?.[courseKey];
      const isActive = activePlanCourse?.[careerIndex] === courseKey;
      const checked = completed.includes(label);
      return (
        <li key={i} className="text-sm text-gray-700 flex items-center flex-wrap gap-2">
          <input
            type="checkbox"
            className="mr-2"
            checked={checked}
            onChange={(e) => onToggle?.('course', label, e.target.checked)}
          />
          <span className={checked ? 'line-through text-gray-500' : ''}>
            {c.title || c.name}
            {c.provider ? ` — ${c.provider}` : ''}
            {c.platform ? ` — ${c.platform}` : ''}
          </span>
          {c.link && (
            <a href={c.link} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline ml-2">
              Visit
            </a>
          )}
          {onGeneratePlan && (
            <button
              className="ml-2 px-2 py-0.5 text-xs rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
              onClick={() => onGeneratePlan(careerIndex, c)}
              disabled={!!planLoading[careerIndex]}
              title="Generate a personalized 90-day plan for this course"
            >
              {planLoading[careerIndex] ? 'Generating…' : 'Generate Plan'}
            </button>
          )}
          {hasPlan && (
            <button
              className={`ml-1 px-2 py-0.5 text-xs rounded border ${isActive ? 'bg-green-50 border-green-300 text-green-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
              onClick={() => onSelectPlanCourse?.(careerIndex, courseKey)}
              title="View generated plan for this course"
            >
              {isActive ? 'Viewing Plan' : 'View Plan'}
            </button>
          )}
        </li>
      );
    })}
  </ul>
);

export default function SkillGapPanel({ data, completedSkills = [], completedCourses = [], onToggle, plans = {}, activePlanCourse = {}, onSelectPlanCourse, onGeneratePlan, planLoading = {}, onClosePlan }) {
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
              <SkillList
                title="Missing"
                items={c.gaps?.missing}
                type="missing"
                enableToggle
                completed={completedSkills}
                onToggle={onToggle}
              />
              <SkillList
                title="To Strengthen"
                items={c.gaps?.toStrengthen}
                type="strengthen"
                enableToggle
                completed={completedSkills}
                onToggle={onToggle}
              />
            </div>
          </Section>

          <Section title="Recommended Courses" icon={BookOpen}>
            <LinkList
              items={c.recommendations?.courses}
              completed={completedCourses}
              onToggle={onToggle}
              onGeneratePlan={onGeneratePlan}
              careerIndex={idx}
              planLoading={planLoading}
              plans={plans}
              activePlanCourse={activePlanCourse}
              onSelectPlanCourse={onSelectPlanCourse}
            />
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
            {(() => {
              const careerPlans = plans?.[idx] || {};
              const selectedKey = activePlanCourse?.[idx];
              const plan = selectedKey ? careerPlans[selectedKey] : null;
              const renderBlock = (title, val) => (
                <div>
                  <div className="font-medium mb-1">{title}</div>
                  {Array.isArray(val) ? (
                    <ul className="list-disc list-inside space-y-1">
                      {val.map((t, i) => (
                        <li key={i}>{t}</li>
                      ))}
                    </ul>
                  ) : (
                    <div>{val || '—'}</div>
                  )}
                </div>
              );
              if (plan) {
                return (
                  <div>
                    <div className="flex justify-end mb-2">
                      {onClosePlan && (
                        <button
                          className="px-2 py-1 text-xs rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
                          onClick={() => onClosePlan(idx)}
                          title="Hide generated plan"
                        >
                          Close Plan
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-700">
                      {renderBlock('Days 0-30', plan.day0_30)}
                      {renderBlock('Days 31-60', plan.day31_60)}
                      {renderBlock('Days 61-90', plan.day61_90)}
                    </div>
                  </div>
                );
              }
              return (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-700">
                  {renderBlock('Days 0-30', c.next90DaysPlan?.days0_30 || c.next90DaysPlan?.days0to30)}
                  {renderBlock('Days 31-60', c.next90DaysPlan?.days31_60 || c.next90DaysPlan?.days31to60)}
                  {renderBlock('Days 61-90', c.next90DaysPlan?.days61_90 || c.next90DaysPlan?.days61to90)}
                </div>
              );
            })()}
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
