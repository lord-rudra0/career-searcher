import axios from 'axios';

// Update port to match Express server
const API_BASE_URL = 'http://localhost:5001';  // Changed from 5000 to 5001

// Add timeout and retry logic
const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,  // Increased from 10000 to 30000
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add request interceptor for logging
axiosInstance.interceptors.request.use(request => {
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

    analyzeAnswers: async (answers) => {
        try {
            console.log('Sending answers for analysis:', answers);
            const response = await axiosInstance.post('/analyze-answers', { answers });
            
            if (!response.data) {
                throw new Error('No data received from server');
            }
            
            return response.data;
        } catch (error) {
            console.error('Analysis error details:', {
                message: error.message,
                code: error.code,
                response: error.response?.data
            });
            
            if (error.code === 'ECONNABORTED') {
                throw new Error('Analysis request timed out. Please try again.');
            }
            
            throw new Error(
                error.response?.data?.error || 
                error.response?.data?.details || 
                'Failed to analyze answers'
            );
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
    }
};

export default api; 