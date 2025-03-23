import React, { useEffect, useRef } from 'react';

// SVG Icons (Ensure they're defined before being used)
const TechIcon = () => (
  <svg className="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="14" x="2" y="3" rx="2"></rect>
    <line x1="8" x2="16" y1="21" y2="21"></line>
    <line x1="12" x2="12" y1="17" y2="21"></line>
  </svg>
);

const HealthcareIcon = () => (
  <svg className="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 9h-5a2 2 0 0 0-2 2v1a2 2 0 0 0 2 2h5"></path>
    <path d="M12 14v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8c0-2.2 1.8-4 4-4h6c1.1 0 2 .9 2 2v2"></path>
  </svg>
);

const BusinessIcon = () => (
  <svg className="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect width="16" height="16" x="4" y="2" rx="2"></rect>
    <rect width="8" height="8" x="8" y="6" rx="1"></rect>
    <path d="M18 18v4"></path>
    <path d="M9 22h9a3 3 0 0 0 3-3v-3"></path>
    <path d="M10 22V8"></path>
  </svg>
);

const ArrowIcon = () => (
  <svg className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m9 18 6-6-6-6"></path>
  </svg>
);

// Careers Data
const careers = [
  { title: 'Technology', description: 'Explore careers in software development, data science, cybersecurity, and more.', icon: <TechIcon />, color: 'from-blue-500/20 to-cyan-400/20' },
  { title: 'Healthcare', description: 'Discover roles in medicine, nursing, healthcare administration, and research.', icon: <HealthcareIcon />, color: 'from-red-500/20 to-pink-400/20' },
  { title: 'Business', description: 'Explore opportunities in management, marketing, finance, and entrepreneurship.', icon: <BusinessIcon />, color: 'from-amber-500/20 to-yellow-400/20' }
];

const CareerCard = ({ title, description, icon, color }) => {
  return (
    <div className="fade-in-section card-3d perspective group cursor-pointer">
      <div className={`h-full p-8 rounded-2xl border border-border shadow-sm bg-gradient-to-br ${color} backdrop-blur-sm`}>
        <div className="mb-6 inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/80 text-primary group-hover:text-accent transition-colors duration-300">
          {icon}
        </div>
        <h3 className="text-xl font-semibold mb-3">{title}</h3>
        <p className="text-foreground/70 mb-6">{description}</p>
        <div className="flex items-center text-primary font-medium group-hover:text-accent transition-colors duration-300">
          <span className="mr-2">Learn more</span>
          <ArrowIcon />
        </div>
      </div>
    </div>
  );
};

const CareerCards = () => {
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
          }
        });
      },
      { root: null, rootMargin: '0px', threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="py-24 fade-in-section">
      <div className="container px-6 md:px-8 mx-auto">
        <div className="text-center mb-16">
          <span className="inline-block px-3 py-1 mb-4 rounded-full bg-primary/10 text-primary text-sm font-medium">
            Explore Possibilities
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Discover Career Paths</h2>
          <p className="text-foreground/70 max-w-2xl mx-auto">
            Our assessment helps match you with career fields that align with your skills, interests, and values.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {careers.map((career, index) => (
            <CareerCard key={index} {...career} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default CareerCards;