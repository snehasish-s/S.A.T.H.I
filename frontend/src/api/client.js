import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

const client = axios.create({
  baseURL,
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const createCase = (data) => client.post('/cases', data).then(res => res.data);
export const getCase = (id) => client.get(`/cases/${id}`).then(res => res.data);
export const getQueue = (facility) => client.get('/queue', { params: { facility } }).then(res => res.data);
export const reviewCase = (id, data) => client.post(`/cases/${id}/review`, data).then(res => res.data);
export const createReferral = (id, data) => client.post(`/cases/${id}/referral`, data).then(res => res.data);
export const getAuditTrail = (id) => client.get(`/cases/${id}/audit`).then(res => res.data);
export const recordConsent = (data) => client.post('/consent', data).then(res => res.data);

export const uploadReport = (id, file) => {
  const formData = new FormData();
  formData.append('file', file);
  return client.post(`/cases/${id}/report`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(res => res.data);
};

export const uploadVoice = (id, blob) => {
  const formData = new FormData();
  formData.append('file', blob, 'voice.webm');
  return client.post(`/cases/${id}/voice`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(res => res.data);
};

export const login = (credentials) => client.post('/auth/login', credentials).then(res => res.data);
export const register = (data) => client.post('/auth/register', data).then(res => res.data);

export default client;
