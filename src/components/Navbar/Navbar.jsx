import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();

  const navItems = [
    { name: 'Home', href: '/' },
    { name: 'About', href: '/about' },
    { name: 'Contact', href: '/contact' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/sign-in');
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="container">
        {/* Logo Section */}
        <div className="logo">
          <Link to="/" className="logo-text" onClick={closeMenu}>
            <span className="logo-gradient">Careerflow.ai</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="nav-links">
          {navItems.map((item) => (
            <Link 
              key={item.name} 
              to={item.href} 
              className="nav-link"
              onClick={closeMenu}
            >
              {item.name}
            </Link>
          ))}
          {!isAuthenticated ? (
            <>
              <Link 
                to="/sign-in" 
                className="nav-link"
                onClick={closeMenu}
              >
                Sign In
              </Link>
              <Link 
                to="/sign-up" 
                className="signup-button"
                onClick={closeMenu}
              >
                Sign Up
              </Link>
            </>
          ) : (
            <button 
              onClick={() => {
                handleLogout();
                closeMenu();
              }} 
              className="logout-button"
            >
              Logout
            </button>
          )}
        </div>

        {/* Mobile Menu Button */}
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
                  onClick={closeMenu}
                >
                  {item.name}
                </Link>
              ))}
              {!isAuthenticated ? (
                <>
                  <Link 
                    to="/sign-in" 
                    className="sheet-link"
                    onClick={closeMenu}
                  >
                    Sign In
                  </Link>
                  <Link 
                    to="/sign-up" 
                    className="signup-button"
                    onClick={closeMenu}
                  >
                    Sign Up
                  </Link>
                </>
              ) : (
                <button 
                  onClick={() => {
                    handleLogout();
                    closeMenu();
                  }} 
                  className="logout-button"
                >
                  Logout
                </button>
              )}
            </nav>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar; 