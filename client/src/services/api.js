import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
});

// Attach the JWT (if present) to every outgoing request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('fraudshield_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Centralize "session expired" handling: on any 401, clear the stored
// session and let the app redirect to /login via ProtectedRoute.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('fraudshield_token');
      localStorage.removeItem('fraudshield_user');
    }
    return Promise.reject(error);
  }
);

export default api;
