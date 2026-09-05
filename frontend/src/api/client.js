import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

const client = axios.create({
  baseURL,
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('sahayak_token') || localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !window.location.pathname.startsWith('/login')) {
      localStorage.removeItem('sahayak_token');
      localStorage.removeItem('sahayak_role');
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Cases API
export const createCase = (data) => client.post('/cases/', data);
export const getCase = (id) => client.get(`/cases/${id}`);
export const uploadReport = (id, file) => {
  const formData = new FormData();
  formData.append('file', file);
  return client.post(`/cases/${id}/report`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};
export const uploadVoice = (id, blob) => {
  const formData = new FormData();
  formData.append('file', blob, 'voice.webm');
  return client.post(`/cases/${id}/voice`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

// Queue & Review API
export const getQueue = (facility) => client.get('/queue/', { params: { facility_id: facility } });
export const reviewCase = (id, data) => client.post(`/review/${id}`, data);
export const createReferral = (id) => client.post(`/referral/${id}`);
export const getAuditTrail = (id) => client.get(`/audit/${id}`);
export const getAggregateAnalytics = () => client.get('/audit/analytics/aggregate');

// Consent & Auth API
export const recordConsent = (data) => client.post('/consent/', data);
export const login = (credentials) => client.post('/consent/auth/login', credentials);
export const register = (data) => client.post('/consent/auth/register', data);

export default client;
