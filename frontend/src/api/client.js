import axios from 'axios';

const client = axios.create({
  baseURL: '/api'
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('campushire_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('campushire_token');
      const path = window.location.pathname;
      const publicPath = path === '/' || path.startsWith('/login') || path.startsWith('/register');
      if (!publicPath) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default client;
