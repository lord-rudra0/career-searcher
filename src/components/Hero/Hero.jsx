import React from "react";
import { Link } from "react-router-dom";
import { Sparkles, CheckCircle, ArrowRight } from 'lucide-react';
import "./Hero.css";

const Hero = () => {
  const features = [
    "500M+ questions analyzed by AI",
    "1500+ careers and educational paths",
    "140+ personality traits assessed"
  ];

  return (
    <div className="hero">
      <div className="hero-content">
        <div className="hero-left">
          <h1 className="hero-title animate__animated animate__fadeInDown">
            Discover Your <span className="highlight">Perfect Career</span> with AI
          </h1>
          
          <p className="hero-description animate__animated animate__fadeInUp">
            Using advanced machine learning, psychometrics, and career satisfaction data,
            we've created a revolutionary career guidance platform that understands you.
          </p>

          <div className="features">
            {features.map((feature, idx) => (
              <div key={idx} className="feature">
                <CheckCircle className="feature-icon" />
                <span>{feature}</span>
              </div>
            ))}
          </div>

          <div className="hero-button-container">
            <Link to="/assessment" className="hero-button">
              Start Free Assessment
              <ArrowRight className="arrow" />
            </Link>
          </div>
        </div>

        <div className="hero-right">
          <div className="stats-card">
            <div className="stat-item">
              <Sparkles className="stat-icon" />
              <div className="stat-content">
                <h3>AI-Powered</h3>
                <p>Advanced career matching</p>
              </div>
            </div>
            <div className="stat-item">
              <Sparkles className="stat-icon" />
              <div className="stat-content">
                <h3>Personalized</h3>
                <p>Tailored to your profile</p>
              </div>
            </div>
            <div className="stat-item">
              <Sparkles className="stat-icon" />
              <div className="stat-content">
                <h3>Comprehensive</h3>
                <p>Detailed career insights</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero; 