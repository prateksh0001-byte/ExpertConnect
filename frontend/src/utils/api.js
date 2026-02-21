import axios from 'axios';

const backendUrl = import.meta.env.VITE_BACKEND_URL || '';
const api = axios.create({
  baseURL: backendUrl ? `${backendUrl.replace(/\/$/, '')}/api` : '/api',
  timeout: 10000,
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message =
      err.response?.data?.message ||
      err.response?.data?.errors?.[0]?.msg ||
      'Something went wrong';
    return Promise.reject(new Error(message));
  }
);

export default api;
