import React, { createContext, useContext, useState, useEffect } from "react";
import { toast } from "sonner";

const AuthContext = createContext(null);

const API_URL = import.meta.env.VITE_API_BASE_URL || 'https://career-searcher-g9gz.vercel.app';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      
      if (!token) {
        setIsLoading(false);
        return;
      }
      
      try {
        const response = await fetch(`${API_URL}/auth/user`, {
          headers: {
            'x-auth-token': token
          }
        });
        
        if (response.ok) {
          const userData = await response.json();
          setUser({
            id: userData.id || userData._id,
            // /auth/user returns: { username, email, groupType, preferences, journeyProgress? }
            name: userData.username,
            email: userData.email,
            groupType: userData.groupType,
            preferences: userData.preferences,
            journeyProgress: userData.journeyProgress || {}
          });
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem("token");
        }
      } catch (error) {
        console.error("Error verifying authentication:", error);
        localStorage.removeItem("token");
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  const refreshUser = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const response = await fetch(`${API_URL}/auth/user`, {
        headers: { 'x-auth-token': token }
      });
      if (response.ok) {
        const userData = await response.json();
        setUser({
          id: userData.id || userData._id,
          name: userData.username,
          email: userData.email,
          groupType: userData.groupType,
          preferences: userData.preferences,
          journeyProgress: userData.journeyProgress || {}
        });
        setIsAuthenticated(true);
      }
    } catch (e) {
      console.error('Failed to refresh user:', e);
    }
  };

  const login = async (email, password) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      // Robust parsing: prefer JSON, fallback to text
      const contentType = response.headers.get('content-type') || '';
      let data;
      try {
        data = contentType.includes('application/json')
          ? await response.json()
          : await response.text();
      } catch (e) {
        // If parsing fails, attempt text; if that also fails, keep undefined
        try { data = await response.text(); } catch (_) { /* noop */ }
      }

      if (!response.ok) {
        const message = (data && data.message)
          || (typeof data === 'string' && data)
          || 'Login failed';
        throw new Error(message);
      }
      
      const { token, user: userData } = typeof data === 'string' ? {} : data;
      if (!token || !userData) {
        throw new Error('Unexpected response from server during login');
      }
      localStorage.setItem("token", token);

      setUser({
        id: userData.id || userData._id,
        name: userData.username,
        email: userData.email,
        groupType: userData.groupType,
        preferences: userData.preferences,
        journeyProgress: userData.journeyProgress || {}
      });
      setIsAuthenticated(true);
      
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (username, email, password, groupType, preferences) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password, groupType, preferences })
      });

      // Robust parsing: prefer JSON, fallback to text
      const contentType = response.headers.get('content-type') || '';
      let data;
      try {
        data = contentType.includes('application/json')
          ? await response.json()
          : await response.text();
      } catch (e) {
        try { data = await response.text(); } catch (_) { /* noop */ }
      }

      if (!response.ok) {
        const message = (data && data.message)
          || (typeof data === 'string' && data)
          || 'Registration failed';
        throw new Error(message);
      }
      
      const { token, user: userData } = typeof data === 'string' ? {} : data;
      if (!token || !userData) {
        throw new Error('Unexpected response from server during registration');
      }
      localStorage.setItem("token", token);

      setUser({
        id: userData.id || userData._id,
        name: userData.username,
        email: userData.email,
        groupType: userData.groupType,
        preferences: userData.preferences,
        journeyProgress: userData.journeyProgress || {}
      });
      setIsAuthenticated(true);
      
    } catch (error) {
      console.error("Registration error:", error);
      throw new Error(error.message || 'An unknown error occurred during registration');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setIsAuthenticated(false);
    toast.success("Logged out successfully");
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, signup, logout, isLoading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};