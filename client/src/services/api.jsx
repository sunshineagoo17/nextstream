import axios from 'axios';
import Cookies from 'js-cookie';

// Sets up an axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_BASE_URL,
  withCredentials: true, 
});

// Adds a request interceptor to include the token and ensure the Content-Type header is set
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('token');
    
    // Add Authorization header if token exists
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Ensure Content-Type is set for POST/PUT requests
    if (['post', 'put', 'patch'].includes(config.method) && !config.headers['Content-Type']) {
      config.headers['Content-Type'] = 'application/json';
    }

    console.log('Request config:', config);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Adds a response interceptor to log errors
api.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error.response ? error.response.data : error.message);
    return Promise.reject(error);
  }
);

export default api;