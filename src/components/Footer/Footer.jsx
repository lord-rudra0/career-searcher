import React from "react";
import { Link } from "react-router-dom";
import { Heart, Mail, Linkedin } from 'lucide-react';
import "./Footer.css";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-main">
          <div className="footer-brand">
            <h3 className="footer-title">Careerflow.ai</h3>
            <p className="footer-description">
              Empowering your career journey with AI-driven guidance
            </p>
          </div>

          <div className="footer-links-container">
            <div className="footer-section">
              <h4>Navigation</h4>
              <ul className="footer-links">
                <li><Link to="/">Home</Link></li>
                <li><Link to="/about">About</Link></li>
                <li><Link to="/contact">Contact</Link></li>
              </ul>
            </div>

            <div className="footer-section">
              <h4>Legal</h4>
              <ul className="footer-links">
                <li><Link to="/privacy">Privacy Policy</Link></li>
                <li><Link to="/terms">Terms of Service</Link></li>
                <li><Link to="/cookies">Cookie Policy</Link></li>
              </ul>
            </div>

            <div className="footer-section">
              <h4>Connect</h4>
              <div className="social-links">
                <a href="mailto:contact@careerflow.ai" aria-label="Email">
                  <Mail className="social-icon" />
                </a>
                {/* <a href="https://github.com" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
                  <GitHub className="social-icon" />
                </a> */}
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                  <Linkedin className="social-icon" />
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>
            © {currentYear} Careerflow.ai. All rights reserved.
          </p>
          <p className="made-with">
            Made with <Heart className="heart-icon" /> by Team Careerflow
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 