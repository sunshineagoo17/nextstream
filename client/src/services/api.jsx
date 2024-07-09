import axios from 'axios';
import Cookies from 'js-cookie';

// Set up an axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_BASE_URL,
  withCredentials: true, // Include cookies in requests
});

// Add a request interceptor to include the token in all requests
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;