import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { refreshToken } from './auth';
import { toast } from 'react-hot-toast';

declare module 'axios' {
  interface InternalAxiosRequestConfig {
    _retry?: boolean;
  }
}

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
    
    // Check for nested error objects first
    if (typeof data === 'object' && !Array.isArray(data)) {
      // Look for common error fields
      const errorFields = ['error', 'message', 'detail', 'errors'];
      for (const field of errorFields) {
        if (data[field]) {
          if (typeof data[field] === 'string') return data[field];
          if (Array.isArray(data[field])) return data[field][0];
          if (typeof data[field] === 'object') {
            const firstError = Object.values(data[field])[0];
            if (Array.isArray(firstError)) return firstError[0] as string;
            if (typeof firstError === 'string') return firstError;
          }
        }
      }

      // If no common error fields found, check all object values
      const firstValue = Object.values(data)[0];
      if (Array.isArray(firstValue)) return firstValue[0] as string;
      if (typeof firstValue === 'string') return firstValue;
    }

    // Handle array responses
    if (Array.isArray(data) && data.length > 0) {
      return typeof data[0] === 'string' ? data[0] : JSON.stringify(data[0]);
    }

    // Handle string responses
    if (typeof data === 'string') return data;
  }

  // Network error
  if (!error.response) {
    return 'Network error. Please check your connection.';
  }

  // Default error messages based on status code if no message found in response
  switch (error.response.status) {
    case 400:
      return 'Invalid request. Please check your input.';
    case 401:
      return 'Authentication failed. Please login again.';
    case 403:
      return 'You do not have permission to perform this action.';
    case 404:
      return 'The requested resource was not found.';
    case 422:
      return 'Validation error. Please check your input.';
    case 500:
      return 'Server error. Please try again later.';
    default:
      return error.message || 'An unexpected error occurred';
  }
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
    const errorMessage = getErrorMessage(error as AxiosError);
    toast.error(errorMessage);
    return Promise.reject(error);
  }
);

// Add a response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig;
    
    if (!originalRequest) {
      const errorMessage = getErrorMessage(error);
      toast.error(errorMessage);
      return Promise.reject(error);
    }

    // If the error status is 401 and there hasn't been a retry yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If token refresh is in progress, add request to queue
        try {
          const token = await new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          });
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        } catch (err) {
          const errorMessage = getErrorMessage(err as AxiosError);
          toast.error(errorMessage);
          return Promise.reject(err);
        }
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
        
        localStorage.setItem('tokens', JSON.stringify(newTokens));
        api.defaults.headers.common['Authorization'] = `Bearer ${newTokens.access}`;
        originalRequest.headers.Authorization = `Bearer ${newTokens.access}`;
        
        processQueue(null, newTokens.access);
        
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as Error, null);
        localStorage.removeItem('tokens');
        window.location.href = '/';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Show error message from API response or fallback to default
    const errorMessage = getErrorMessage(error);
    toast.error(errorMessage);
    return Promise.reject(error);
  }
);

export default api;