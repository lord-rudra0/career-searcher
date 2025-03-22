import React from 'react';
import { Rocket, Users, Target, Award } from 'lucide-react';
import './About.css';

const About = () => {
  const features = [
    {
      icon: <Rocket className="feature-icon" />,
      title: "AI-Powered Career Guidance",
      description: "Using advanced AI algorithms to provide personalized career recommendations based on your unique profile."
    },
    {
      icon: <Users className="feature-icon" />,
      title: "Expert Analysis",
      description: "Combining human expertise with machine learning to deliver accurate and relevant career insights."
    },
    {
      icon: <Target className="feature-icon" />,
      title: "Personalized Roadmaps",
      description: "Custom career development paths tailored to your skills, interests, and professional goals."
    },
    {
      icon: <Award className="feature-icon" />,
      title: "Educational Guidance",
      description: "Comprehensive recommendations for educational paths and professional certifications."
    }
  ];

  return (
    <div className="about-container">
      {/* Hero Section */}
      <div className="hero-section">
        <h1 className="main-title">About Careerflow.ai</h1>
        <p className="subtitle">
          Empowering Your Career Journey with AI-Driven Insights
        </p>
      </div>

      {/* Mission Section */}
      <div className="mission-section">
        <h2 className="section-title">Our Mission</h2>
        <p className="mission-text">
          At Careerflow.ai, we're dedicated to revolutionizing career guidance through
          artificial intelligence. Our platform combines cutting-edge AI technology
          with comprehensive career data to help you make informed decisions about
          your professional future.
        </p>
      </div>

      {/* Features Grid */}
      <div className="features-grid">
        {features.map((feature, index) => (
          <div key={index} className="feature-card">
            <div className="feature-icon-wrapper">
              {feature.icon}
            </div>
            <h3 className="feature-title">{feature.title}</h3>
            <p className="feature-description">{feature.description}</p>
          </div>
        ))}
      </div>

      {/* Values Section */}
      <div className="values-section">
        <h2 className="section-title">Our Values</h2>
        <div className="values-content">
          <div className="value-item">
            <h3>Innovation</h3>
            <p>Constantly evolving our AI technology to provide better career guidance</p>
          </div>
          <div className="value-item">
            <h3>Accuracy</h3>
            <p>Delivering precise and reliable career recommendations</p>
          </div>
          <div className="value-item">
            <h3>Accessibility</h3>
            <p>Making career guidance available to everyone</p>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="cta-section">
        <h2>Ready to Start Your Career Journey?</h2>
        <button className="cta-button">Get Started Now</button>
      </div>
    </div>
  );
};

export default About; 