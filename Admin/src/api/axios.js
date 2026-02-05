import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
  // REMOVE the default Content-Type header!
  withCredentials: true,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Only set Content-Type if it's not FormData
    if (!(config.data instanceof FormData)) {
      config.headers['Content-Type'] = 'application/json';
    }
    // For FormData, let the browser set the content type automatically
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
// Response interceptor
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      window.location.href = '/login';
    }
    
    // Preserve the full error response
    const message = error.response?.data?.error || error.message || 'Something went wrong';
    const err = new Error(message);
    
    // Attach the full response data for better error handling
    err.response = error.response;
    err.status = error.response?.status;
    err.errors = error.response?.data?.errors;
    
    return Promise.reject(err);
  }
);

export default api;