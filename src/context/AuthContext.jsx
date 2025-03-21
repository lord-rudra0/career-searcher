import React, { createContext, useState, useContext, useEffect } from 'react';
import auth from '../services/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if user is logged in on mount
        const checkAuth = async () => {
            try {
                const storedUser = localStorage.getItem('user');
                if (storedUser) {
                    setUser(JSON.parse(storedUser));
                }
            } catch (error) {
                console.error('Auth check failed:', error);
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, []);

    const login = async (username, password) => {
        const response = await auth.login(username, password);
        setUser(response.user);
        localStorage.setItem('user', JSON.stringify(response.user));
        return response;
    };

    const logout = async () => {
        await auth.logout();
        setUser(null);
        localStorage.removeItem('user');
    };

    const register = async (username, email, password) => {
        const response = await auth.register(username, email, password);
        setUser(response.user);
        localStorage.setItem('user', JSON.stringify(response.user));
        return response;
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, register }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext); 