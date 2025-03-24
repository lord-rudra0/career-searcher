import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

const Hero = () => {
  const blobRefs = useRef([]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      const { clientX, clientY } = e;
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;

      blobRefs.current.forEach((blob, index) => {
        if (blob) {
          const factor = (index + 1) * 0.01;
          const xPos = (clientX / windowWidth - 0.5) * factor * 60;
          const yPos = (clientY / windowHeight - 0.5) * factor * 60;
          blob.style.transform = `translate(${xPos}px, ${yPos}px)`;
        }
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const addToRefs = (el) => {
    if (el && !blobRefs.current.includes(el)) {
      blobRefs.current.push(el);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden pt-24 pb-16">
      {/* Background blobs */}
      <div ref={addToRefs} className="blob w-[600px] h-[600px] top-[-200px] right-[-100px] bg-primary/10 animate-blob"></div>
      <div ref={addToRefs} className="blob w-[500px] h-[500px] bottom-[-150px] left-[-100px] bg-accent/10 animate-blob animation-delay-2000"></div>
      <div ref={addToRefs} className="blob w-[300px] h-[300px] bottom-[100px] right-[300px] bg-foreground/5 animate-blob animation-delay-4000"></div>

      <div className="container px-6 md:px-8 mx-auto flex flex-col lg:flex-row items-center justify-between gap-12 z-10">
        <div className="w-full lg:w-1/2 text-center lg:text-left">
          <span className="inline-block px-3 py-1 mb-6 rounded-full bg-primary/10 text-primary text-sm font-medium animate-fade-in">
            Discover Your Perfect Career Path
          </span>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-6 animate-fade-in text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">
            Unleash Your Potential with Our <span className="text-shadow">AI-Driven</span> Career Assessment
          </h1>

          <p className="text-lg text-foreground/80 mb-8 max-w-lg mx-auto lg:mx-0 animate-fade-in">
            Uncover your true potential with our innovative career assessment tool. In just a few minutes, get personalized career recommendations based on your unique skills and preferences.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start space-y-4 sm:space-y-0 sm:space-x-4 animate-fade-in">
            <Link to="/test" className="px-8 py-3.5 rounded-full bg-primary text-white font-medium text-lg shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:translate-y-[-2px] active:translate-y-0 transition-all duration-300 button-shine w-full sm:w-auto text-center">
              Start Assessment
            </Link>

            <a href="#how-it-works" className="px-8 py-3.5 rounded-full border border-border bg-background hover:bg-secondary transition-colors duration-300 font-medium text-lg w-full sm:w-auto text-center">
              Learn More
            </a>
          </div>
        </div>

        <div className="w-full lg:w-1/2 perspective">
          <div className="relative mx-auto w-full max-w-md animate-float">
            <div className="absolute inset-0 border border-white/20 bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl transform rotate-[-6deg] scale-[0.9] transition-all duration-500"></div>
            <div className="absolute inset-0 border border-white/20 bg-white/5 backdrop-blur-xl rounded-3xl shadow-xl transform rotate-[3deg] scale-[0.95] transition-all duration-500"></div>
            <div className="card-3d relative p-8 backdrop-blur-sm bg-white/80 rounded-3xl shadow-lg border border-white/40 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10 opacity-30"></div>
              <div className="relative">
                <h3 className="text-xl font-semibold mb-6 text-center">Career Fit Analyzer</h3>
                <div className="flex items-center mb-8">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                      <circle cx="9" cy="7" r="4"></circle>
                      <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h4 className="font-medium">Personalized Analysis</h4>
                    <p className="text-sm text-foreground/70">Based on your unique profile</p>
                  </div>
                </div>
                <Link to={"/test"} >
                  <button className="w-full py-3 rounded-lg bg-gradient-primary text-white font-medium transition-all hover:shadow-lg">
                    Start Assessment
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 animate-bounce">
        <a href="#how-it-works" className="inline-block text-foreground/50">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 13l5 5 5-5"></path>
            <path d="M7 6l5 5 5-5"></path>
          </svg>
        </a>
      </div>
    </div>
  );
};

export default Hero;