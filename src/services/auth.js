import axios from 'axios';

const API_BASE_URL = 'http://localhost:5001';

const auth = {
    register: async (username, email, password) => {
        try {
            const response = await axios.post(
                `${API_BASE_URL}/api/register`,
                { username, email, password },
                { withCredentials: true }
            );
            return response.data;
        } catch (error) {
            throw new Error(
                error.response?.data?.error || 
                'Registration failed'
            );
        }
    },

    login: async (username, password) => {
        try {
            const response = await axios.post(
                `${API_BASE_URL}/api/login`,
                { username, password },
                { withCredentials: true }
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
            const response = await axios.get(
                `${API_BASE_URL}/api/logout`,
                { withCredentials: true }
            );
            return response.data;
        } catch (error) {
            throw new Error(
                error.response?.data?.error || 
                'Logout failed'
            );
        }
    }
};

export default auth; 