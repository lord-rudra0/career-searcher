import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://career-searcher-g9gz.vercel.app';

const auth = {
    register: async (username, email, password) => {
        try {
            const response = await axios.post(
                `${API_BASE_URL}/auth/register`,
                { username, email, password },
                {}
            );
            return response.data;
        } catch (error) {
            throw new Error(
                error.response?.data?.error || 
                'Registration failed'
            );
        }
    },

    login: async (email, password) => {
        try {
            const response = await axios.post(
                `${API_BASE_URL}/auth/login`,
                { email, password },
                {}
            );
            return response.data;
        } catch (error) {
            throw new Error(
                error.response?.data?.error || 
                'Login failed'
            );
        }
    },

    logout: async () => {
        try {
            // No server logout endpoint; caller should clear local token
            return { ok: true };
        } catch (error) {
            throw new Error(
                error.response?.data?.error || 
                'Logout failed'
            );
        }
    }
};

export default auth; 