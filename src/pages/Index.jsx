import React, { useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import HowItWorks from '@/components/HowItWorks';
import CareerCards from '@/components/CareerCards';
import { Link } from 'react-router-dom';

const Index = () => {
  useEffect(() => {
    // Intersection Observer for fade-in elements
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

    const fadeElements = document.querySelectorAll('.fade-in-section');
    fadeElements.forEach((element) => {
      fadeInObserver.observe(element);
    });

    return () => {
      fadeInObserver.disconnect();
    };
  }, []);

  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero />
      <HowItWorks />
      <CareerCards />
      
      <section className="py-24 fade-in-section bg-gradient-to-br from-primary/10 to-accent/10">
        <div className="container px-6 md:px-8 mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Discover Your Ideal Career?</h2>
          <p className="text-foreground/70 max-w-2xl mx-auto mb-10">
            Take our comprehensive assessment and unlock personalized insights into your perfect career path.
          </p>
          <Link 
            to="/test" 
            className="px-8 py-3.5 rounded-full bg-primary text-white font-medium text-lg shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:translate-y-[-2px] active:translate-y-0 transition-all duration-300 button-shine inline-block"
          >
            Start Assessment Now
          </Link>
        </div>
      </section>
      
      <footer className="py-12 bg-secondary/80">
        <div className="container px-6 md:px-8 mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="text-2xl font-semibold text-foreground mb-6 md:mb-0">
              career<span className="text-primary">glimpse</span>
            </div>
            <div className="text-sm text-foreground/60">
              © {new Date().getFullYear()} CareerGlimpse. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
