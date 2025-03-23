import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { User, LogOut, LogIn, UserPlus } from 'lucide-react';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const { user, isAuthenticated, logout, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className={cn(
        'fixed top-0 w-full z-50 transition-all duration-300',
        scrolled ? 'bg-white/80 backdrop-blur-md shadow-sm py-4' : 'bg-transparent py-6'
      )}
    >
      <div className="container mx-auto px-6 md:px-8 flex items-center justify-between">
        <Link 
          to="/" 
          className="text-2xl font-semibold text-foreground transition-all hover:opacity-80"
        >
          career<span className="text-primary">finder</span>
        </Link>
        
        <nav className="hidden md:flex items-center space-x-8">
          <Link 
            to="/" 
            className="text-foreground/80 hover:text-primary transition-colors relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 hover:after:w-full after:bg-primary after:transition-all after:duration-300"
          >
            Home
          </Link>
          <Link 
            to="/test" 
            className="text-foreground/80 hover:text-primary transition-colors relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 hover:after:w-full after:bg-primary after:transition-all after:duration-300"
          >
            Take Test
          </Link>
        </nav>
        
        <div className="flex items-center space-x-4">
          {isLoading ? (
            <div className="w-4 h-4 border-t-2 border-primary rounded-full animate-spin"></div>
          ) : isAuthenticated ? (
            <>
              <Link 
                to="/profile" 
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
              >
                <User />
                <span className="hidden md:inline">Profile</span>
              </Link>
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-primary text-white font-medium shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:translate-y-[-2px] active:translate-y-0 transition-all duration-300 button-shine"
              >
                <LogOut />
                <span className="hidden md:inline">Sign Out</span>
              </button>
            </>
          ) : (
            <>
              <Link 
                to="/signin" 
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
              >
                <LogIn />
                <span className="hidden md:inline">Sign In</span>
              </Link>
              <Link 
                to="/signup" 
                className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-primary text-white font-medium shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:translate-y-[-2px] active:translate-y-0 transition-all duration-300 button-shine"
              >
                <UserPlus className="hidden md:block" />
                <span>Sign Up</span>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;