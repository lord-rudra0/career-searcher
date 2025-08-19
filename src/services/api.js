import axios from 'axios';

// Update port to match Express server
const API_BASE_URL = 'http://localhost:5001';  // Changed from 5000 to 5001

// Add timeout and retry logic
const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 130000,  // Match backend 120s with a small buffer
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add request interceptor for logging and auth
axiosInstance.interceptors.request.use(request => {
    const token = localStorage.getItem('token');
    if (token) {
        request.headers['x-auth-token'] = token;
    }
    console.log('Starting Request:', request.method, request.url);
    return request;
});

// Add response interceptor for logging
axiosInstance.interceptors.response.use(
    response => {
        console.log('Response:', response.status, response.data);
        return response;
    },
    error => {
        console.error('Response Error:', error.message);
        const status = error.response?.status;
        if (status === 401) {
            // Clear invalid/expired token and redirect to signin
            try { localStorage.removeItem('token'); } catch {}
            // Avoid infinite redirects if already on signin
            if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/signin')) {
                window.location.replace('/signin');
            }
        }
        if (error.code === 'ECONNREFUSED') {
            console.error('Server is not running or not accessible');
        }
        return Promise.reject(error);
    }
);

const api = {
    generateQuestion: async (previousQA) => {
        try {
            const response = await axiosInstance.post('/generate-question', { previousQA });
            
            if (response.data.error) {
                throw new Error(response.data.error);
            }
            
            return response.data;
        } catch (error) {
            console.error('API Error:', error);
            throw new Error(
                error.response?.data?.error || 
                error.response?.data?.details || 
                'Failed to generate question'
            );
        }
    },

    // New: Skill Gap Analysis
    skillGapAnalysis: async (payload, options = {}) => {
        const { retries = 2, backoffMs = 2000, signal, timeoutMs } = options;
        let attempt = 0;

        const isRetryable = (error) => {
            const status = error.response?.status;
            return (
                error.code === 'ECONNABORTED' || // timeout
                !status || // network error
                (status >= 500 && status < 600)
            );
        };

        while (true) {
            try {
                const response = await axiosInstance.post('/skill-gap-analysis', payload, {
                    signal,
                    timeout: timeoutMs || axiosInstance.defaults.timeout,
                });

                if (!response.data) {
                    throw new Error('No data received from server');
                }
                return response.data; // may include savedId
            } catch (error) {
                if (axios.isCancel?.(error) || error.name === 'CanceledError') {
                    throw error;
                }

                console.error('Skill gap error details:', {
                    message: error.message,
                    code: error.code,
                    status: error.response?.status,
                    response: error.response?.data
                });

                if (attempt < retries && isRetryable(error)) {
                    attempt += 1;
                    const delay = backoffMs * Math.pow(2, attempt - 1);
                    await new Promise(res => setTimeout(res, delay));
                    continue;
                }

                if (error.code === 'ECONNABORTED') {
                    throw new Error('Skill gap request timed out. Please try again.');
                }

                throw new Error(
                    error.response?.data?.error ||
                    error.response?.data?.details ||
                    'Failed to generate skill gap analysis'
                );
            }
        }
    },

    // Fetch saved skill gap results for current user (requires auth)
    getUserSkillGapResults: async (limit = 10) => {
        const res = await axiosInstance.get('/user/skill-gap-results', { params: { limit } });
        return res.data;
    },

    // Fetch a specific saved skill gap result by id
    getSkillGapResultById: async (id) => {
        const res = await axiosInstance.get(`/skill-gap-results/${id}`);
        return res.data;
    },

    // Delete a saved skill gap result (auth required)
    deleteSkillGapResult: async (id) => {
        const res = await axiosInstance.delete(`/skill-gap-results/${id}`);
        return res.data;
    },

    analyzeAnswers: async (answers, groupName, preferences, options = {}) => {
        const { retries = 2, backoffMs = 2000, signal, timeoutMs } = options;
        let attempt = 0;
        const payload = {
            final_answers: answers,
            group_name: groupName
        };
        if (preferences) payload.preferences = preferences;

        // Helper to decide retryable
        const isRetryable = (error) => {
            const status = error.response?.status;
            return (
                error.code === 'ECONNABORTED' || // timeout
                !status || // network error
                (status >= 500 && status < 600)
            );
        };

        while (true) {
            try {
                const response = await axiosInstance.post('/analyze-answers', payload, {
                    signal,
                    timeout: timeoutMs || axiosInstance.defaults.timeout,
                });

                if (!response.data) {
                    throw new Error('No data received from server');
                }
                return response.data;
            } catch (error) {
                // Surface cancellation immediately
                if (axios.isCancel?.(error) || error.name === 'CanceledError') {
                    throw error; // Let caller handle cancellation message
                }

                console.error('Analysis error details:', {
                    message: error.message,
                    code: error.code,
                    status: error.response?.status,
                    response: error.response?.data
                });

                if (attempt < retries && isRetryable(error)) {
                    attempt += 1;
                    const delay = backoffMs * Math.pow(2, attempt - 1);
                    await new Promise(res => setTimeout(res, delay));
                    continue; // retry
                }

                if (error.code === 'ECONNABORTED') {
                    throw new Error('Analysis request timed out. Please try again.');
                }

                throw new Error(
                    error.response?.data?.error || 
                    error.response?.data?.details || 
                    'Failed to analyze answers'
                );
            }
        }
    },

    testApi: async () => {
        try {
            const response = await axiosInstance.get('/test-api');
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.error || 'Failed to test API');
        }
    },

    listModels: async () => {
        try {
            const response = await axiosInstance.get('/list-models');
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.error || 'Failed to list models');
        }
    },

    webSearch: async (careers) => {
        try {
            const response = await axiosInstance.post('/web-search', { careers });
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.error || 'Failed to perform web search');
        }
    },

    searchWebCareers: async (analysis) => {
        try {
            const response = await axiosInstance.post('/search-web-careers', { analysis });
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.error || 'Failed to search web careers');
        }
    },

    getCurrentUser: async () => {
        const res = await axiosInstance.get('/auth/user');
        return res.data;
    },

    updateUserProfile: async (payload) => {
        const res = await axiosInstance.put('/user/profile', payload);
        return res.data;
    },

    getUserAnalysisResults: async (limit = 10) => {
        const res = await axiosInstance.get('/user/analysis-results', { params: { limit } });
        return res.data;
    }
};

export default api;