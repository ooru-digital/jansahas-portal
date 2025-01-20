import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { refreshToken } from './auth';
import { toast } from 'react-hot-toast';

const API_URL = 'https://staging-jansahas.credissuer.com';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach(promise => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token);
    }
  });
  failedQueue = [];
};

// Helper function to extract error message from response
const getErrorMessage = (error: AxiosError): string => {
  if (error.response?.data) {
    const data = error.response.data as any;
    // Check common error message patterns
    if (typeof data === 'string') return data;
    if (data.message) return data.message;
    if (data.error) return data.error;
    if (data.detail) return data.detail;
    if (Array.isArray(data)) return data[0];
    
    // Handle nested error objects
    if (typeof data === 'object') {
      const firstError = Object.values(data)[0];
      if (Array.isArray(firstError)) return firstError[0] as string;
      if (typeof firstError === 'string') return firstError;
    }
  }
  return error.message || 'An error occurred';
};

// Add a request interceptor
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const tokensStr = localStorage.getItem('tokens');
    if (tokensStr) {
      const tokens = JSON.parse(tokensStr);
      config.headers.Authorization = `Bearer ${tokens.access}`;
    }
    return config;
  },
  (error) => {
    const errorMessage = getErrorMessage(error);
    toast.error(errorMessage);
    return Promise.reject(error);
  }
);

// Add a response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config;
    
    if (!originalRequest) {
      const errorMessage = getErrorMessage(error);
      toast.error(errorMessage);
      return Promise.reject(error);
    }

    // If the error status is 401 and there hasn't been a retry yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If token refresh is in progress, add request to queue
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => {
            const errorMessage = getErrorMessage(err as AxiosError);
            toast.error(errorMessage);
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const tokensStr = localStorage.getItem('tokens');
        if (!tokensStr) {
          throw new Error('No refresh token available');
        }

        const tokens = JSON.parse(tokensStr);
        const response = await refreshToken(tokens.refresh);
        const newTokens = response;
        
        // Store new tokens
        localStorage.setItem('tokens', JSON.stringify(newTokens));
        
        // Update authorization header
        api.defaults.headers.common['Authorization'] = `Bearer ${newTokens.access}`;
        originalRequest.headers.Authorization = `Bearer ${newTokens.access}`;
        
        // Process queued requests
        processQueue(null, newTokens.access);
        
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh token fails, clear tokens and redirect to login
        const errorMessage = getErrorMessage(refreshError as AxiosError);
        toast.error(errorMessage);
        processQueue(refreshError as Error, null);
        localStorage.removeItem('tokens');
        window.location.href = '/';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // For all other errors, show the error message
    const errorMessage = getErrorMessage(error);
    toast.error(errorMessage);
    return Promise.reject(error);
  }
);

export default api;