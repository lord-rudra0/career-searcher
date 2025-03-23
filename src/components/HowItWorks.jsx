import React, { useEffect, useRef } from 'react';

const HowItWorks = () => {
  const sectionRef = useRef(null);
  const stepsRef = useRef([]);

  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1,
    };

    const fadeInObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
        }
      });
    }, observerOptions);

    if (sectionRef.current) {
      fadeInObserver.observe(sectionRef.current);
    }

    stepsRef.current.forEach((step) => {
      if (step) {
        fadeInObserver.observe(step);
      }
    });

    return () => fadeInObserver.disconnect();
  }, []);

  const steps = [
    {
      number: '01',
      title: 'Take the Assessment',
      description: 'Answer a series of thoughtfully designed questions about your interests, skills, and preferences.',
      icon: (
        <svg className="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
          <path d="M16 8h-8v8h8V8Z"></path>
        </svg>
      ),
    },
    {
      number: '02',
      title: 'AI Analysis',
      description: 'Our advanced AI analyzes your responses to identify patterns and match them with career paths.',
      icon: (
        <svg className="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2a4 4 0 0 1 4 4 7 7 0 0 1-8 7 4 4 0 0 0-2 7.5 1 1 0 0 1-.5 1.5 9 9 0 0 1-3.5-8.8A8 8 0 0 1 12 2Z"></path>
          <path d="M12 8a2.5 2.5 0 1 0 4.5 2 4 4 0 0 1 2 3.5 1 1 0 0 0 1.5.5 9 9 0 0 0-8.8-9.5"></path>
          <path d="M20 16a2.5 2.5 0 1 0-5 0v1a8 8 0 0 1-16 0v-6"></path>
        </svg>
      ),
    },
    {
      number: '03',
      title: 'Get Personalized Results',
      description: 'Receive detailed insights about your ideal career paths, along with personalized recommendations.',
      icon: (
        <svg className="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 2H3v16h5v4l4-4h4l5-5V2zm-10 9V7m0 4v.01"></path>
        </svg>
      ),
    },
  ];

  return (
    <section id="how-it-works" ref={sectionRef} className="py-24 fade-in-section bg-secondary/50">
      <div className="container px-6 md:px-8 mx-auto">
        <div className="text-center mb-16">
          <span className="inline-block px-3 py-1 mb-4 rounded-full bg-primary/10 text-primary text-sm font-medium">
            The Process
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">How Career Glimpse Works</h2>
          <p className="text-foreground/70 max-w-2xl mx-auto">
            Our innovative approach combines cutting-edge AI with career psychology to deliver accurate and personalized career recommendations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {steps.map((step, index) => (
            <div
              key={index}
              ref={(el) => (stepsRef.current[index] = el)}
              className="fade-in-section relative p-8 rounded-2xl bg-white border border-border shadow-sm hover:shadow-md transition-all duration-300"
            >
              <div className="absolute top-0 right-0 p-4 text-5xl font-bold text-primary/10">
                {step.number}
              </div>
              
              <div className="mb-6 inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary">
                {step.icon}
              </div>
              
              <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
              <p className="text-foreground/70">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;