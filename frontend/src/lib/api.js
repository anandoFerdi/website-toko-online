import axios from 'axios';
import Cookies from 'js-cookie';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Request interceptor to add token and handle FormData
api.interceptors.request.use((config) => {
  const token = Cookies.get('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Let the browser set Content-Type for FormData (with correct boundary)
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }

  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response interceptor to dispatch events
api.interceptors.response.use((response) => {
  // Trigger cart update event if the request modified the cart or created an order (which clears the cart)
  if (
    response.config.url.includes('/cart') || 
    (response.config.url.includes('/orders') && response.config.method === 'post')
  ) {
    if (response.config.method !== 'get') {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('cart_updated'));
      }
    }
  }
  return response;
}, (error) => {
  return Promise.reject(error);
});

export default api;
