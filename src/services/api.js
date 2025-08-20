import axios from 'axios';

// Update port to match Express server
const API_BASE_URL = 'http://localhost:5001';

// Create axios instance with timeout
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 130000,
  headers: { 'Content-Type': 'application/json' },
});

// Interceptors for auth and logging
axiosInstance.interceptors.request.use((request) => {
  const token = localStorage.getItem('token');
  if (token) request.headers['x-auth-token'] = token;
  return request;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    if (status === 401) {
      try { localStorage.removeItem('token'); } catch {}
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/signin')) {
        window.location.replace('/signin');
      }
    }
    return Promise.reject(error);
  }
);

const api = {
  // Questions
  generateQuestion: async (previousQA) => {
    const response = await axiosInstance.post('/generate-question', { previousQA });
    if (response.data?.error) throw new Error(response.data.error);
    return response.data;
  },

  // Skill Gap Analysis
  skillGapAnalysis: async (payload, options = {}) => {
    const { retries = 2, backoffMs = 2000, signal, timeoutMs } = options;
    let attempt = 0;
    const isRetryable = (error) => {
      const status = error.response?.status;
      return error.code === 'ECONNABORTED' || !status || (status >= 500 && status < 600);
    };
    while (true) {
      try {
        const response = await axiosInstance.post('/skill-gap-analysis', payload, { signal, timeout: timeoutMs || axiosInstance.defaults.timeout });
        if (!response.data) throw new Error('No data received from server');
        return response.data;
      } catch (error) {
        if (axios.isCancel?.(error) || error.name === 'CanceledError') throw error;
        if (attempt < retries && isRetryable(error)) {
          attempt += 1;
          const delay = backoffMs * Math.pow(2, attempt - 1);
          await new Promise((res) => setTimeout(res, delay));
          continue;
        }
        if (error.code === 'ECONNABORTED') throw new Error('Skill gap request timed out. Please try again.');
        throw new Error(error.response?.data?.error || error.response?.data?.details || 'Failed to generate skill gap analysis');
      }
    }
  },

  // Saved Skill Gap results
  getUserSkillGapResults: async (limit = 10) => {
    const res = await axiosInstance.get('/user/skill-gap-results', { params: { limit } });
    return res.data;
  },
  getSkillGapResultById: async (id) => {
    const res = await axiosInstance.get(`/skill-gap-results/${id}`);
    return res.data;
  },
  deleteSkillGapResult: async (id) => {
    const res = await axiosInstance.delete(`/skill-gap-results/${id}`);
    return res.data;
  },
  updateSkillGapProgress: async (id, { type, item, completed }) => {
    const res = await axiosInstance.put(`/skill-gap-results/${id}/progress`, { type, item, completed });
    return res.data; // { ok, completedSkills, completedCourses }
  },

  // Analyze answers
  analyzeAnswers: async (answers, groupName, preferences, options = {}) => {
    const { retries = 2, backoffMs = 2000, signal, timeoutMs } = options;
    let attempt = 0;
    const payload = { final_answers: answers, group_name: groupName };
    if (preferences) payload.preferences = preferences;
    const isRetryable = (error) => {
      const status = error.response?.status;
      return error.code === 'ECONNABORTED' || !status || (status >= 500 && status < 600);
    };
    while (true) {
      try {
        const response = await axiosInstance.post('/analyze-answers', payload, { signal, timeout: timeoutMs || axiosInstance.defaults.timeout });
        if (!response.data) throw new Error('No data received from server');
        return response.data;
      } catch (error) {
        if (axios.isCancel?.(error) || error.name === 'CanceledError') throw error;
        if (attempt < retries && isRetryable(error)) {
          attempt += 1;
          const delay = backoffMs * Math.pow(2, attempt - 1);
          await new Promise((res) => setTimeout(res, delay));
          continue;
        }
        if (error.code === 'ECONNABORTED') throw new Error('Analysis request timed out. Please try again.');
        throw new Error(error.response?.data?.error || error.response?.data?.details || 'Failed to analyze answers');
      }
    }
  },

  // Utilities
  testApi: async () => {
    const response = await axiosInstance.get('/test-api');
    return response.data;
  },
  listModels: async () => {
    const response = await axiosInstance.get('/list-models');
    return response.data;
  },
  webSearch: async (careers) => {
    const response = await axiosInstance.post('/web-search', { careers });
    return response.data;
  },
  searchWebCareers: async (analysis) => {
    const response = await axiosInstance.post('/search-web-careers', { analysis });
    return response.data;
  },

  // User profile
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
  },
  // Full analysis (new)
  getUserFullAnalysisResults: async (limit = 10) => {
    const res = await axiosInstance.get('/user/full-analysis-results', { params: { limit } });
    return res.data; // { results: [{ _id, groupName, answersCount, durationMs, createdAt }] }
  },
  getFullAnalysisById: async (id) => {
    const res = await axiosInstance.get(`/full-analysis-results/${id}`);
    return res.data; // full document including response payload
  },
  getJourneyProgress: async () => {
    const res = await axiosInstance.get('/user/journey-progress');
    return res.data; // { progress }
  },
  updateJourneyProgress: async (progress, merge = true) => {
    const res = await axiosInstance.put('/user/journey-progress', { progress, merge });
    return res.data; // { progress }
  },

  // Careers and plans
  getTopCareers: async (limit = 3) => {
    const res = await axiosInstance.get('/user/top-careers', { params: { limit } });
    return res.data; // { careers, groupName, createdAt }
  },
  generateCoursePlan: async ({ careerTitle, course, userSkills, gaps }) => {
    const res = await axiosInstance.post('/api/course-plan', { careerTitle, course, userSkills, gaps });
    return res.data; // { plan: { day0_30, day31_60, day61_90 } }
  },

  // Tryouts (A/B career trials)
  listTryouts: async () => {
    const res = await axiosInstance.get('/tryouts');
    return res.data; // { tryouts }
  },
  createTryout: async ({ pathA, pathB, durationDays = 7 }) => {
    const res = await axiosInstance.post('/tryouts', { pathA, pathB, durationDays });
    return res.data; // { tryoutId }
  },
  getTryout: async (id) => {
    const res = await axiosInstance.get(`/tryouts/${id}`);
    return res.data; // { tryout }
  },
  logTask: async ({ id, key, taskId, payload }) => {
    const res = await axiosInstance.post(`/tryouts/${id}/tasks/${key}/${taskId}/log`, payload);
    return res.data; // { ok }
  },
  getTryoutSummary: async (id) => {
    const res = await axiosInstance.get(`/tryouts/${id}/summary`);
    return res.data; // { summary }
  },
};

export default api;