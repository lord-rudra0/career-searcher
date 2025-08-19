import React, { createContext, useContext, useState, useEffect } from "react";
import { toast } from "sonner";

const AuthContext = createContext(null);

const API_URL = "http://localhost:5001";

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
            // /auth/user returns: { username, email, groupType, preferences }
            name: userData.username,
            email: userData.email,
            groupType: userData.groupType,
            preferences: userData.preferences
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
          name: userData.username,
          email: userData.email,
          groupType: userData.groupType,
          preferences: userData.preferences
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
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Login failed');
      
      const { token, user: userData } = data;
      localStorage.setItem("token", token);

      setUser({
        id: userData.id,
        name: userData.username,
        email: userData.email,
        groupType: userData.groupType,
        preferences: userData.preferences
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

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Registration failed');
      
      const { token, user: userData } = data;
      localStorage.setItem("token", token);

      setUser({
        id: userData.id,
        name: userData.username,
        email: userData.email,
        groupType: userData.groupType,
        preferences: userData.preferences
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