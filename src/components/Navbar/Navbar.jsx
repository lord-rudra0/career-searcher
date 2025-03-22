import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Navbar.css';

const Navbar = ({ isAuthenticated, setIsAuthenticated }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const navItems = [
    { name: 'About', href: '/about' },
    { name: 'Contact', href: '/contact' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    navigate('/sign-in');
  };

  return (
    <nav className="navbar">
      <div className="container">
        {/* Logo Section */}
        <div className="logo">
          <Link to="/" className="logo-text">
            <span className="logo-gradient">Careerflow.ai</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="nav-links">
          {navItems.map((item) => (
            <Link key={item.name} to={item.href} className="nav-link">
              {item.name}
            </Link>
          ))}
          {!isAuthenticated && (
            <Link to="/sign-up" className="signup-button">Sign Up</Link>
          )}
          {isAuthenticated && (
            <button onClick={handleLogout} className="logout-button">Logout</button>
          )}
        </div>

        {/* Mobile Navigation Toggle */}
        <div className="menu-icon">
          <button
            className="menu-button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            <svg
              className="menu-icon-svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 6h16M4 12h16m-16 6h16"
              />
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="mobile-menu">
            <nav className="sheet-nav">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className="sheet-link"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              {!isAuthenticated && (
                <Link to="/sign-up" className="signup-button" onClick={() => setIsMenuOpen(false)}>
                  Sign Up
                </Link>
              )}
              {isAuthenticated && (
                <button onClick={handleLogout} className="logout-button">Logout</button>
              )}
            </nav>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar; 