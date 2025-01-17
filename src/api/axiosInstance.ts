import axios from 'axios';

const API_URL = 'https://staging-jansahas.credissuer.com';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor
api.interceptors.request.use(
  (config) => {
    const tokensStr = localStorage.getItem('tokens');
    if (tokensStr) {
      const tokens = JSON.parse(tokensStr);
      config.headers.Authorization = `Bearer ${tokens.access}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If the error status is 401 and there hasn't been a retry yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const tokensStr = localStorage.getItem('tokens');
        if (tokensStr) {
          const tokens = JSON.parse(tokensStr);
          const response = await axios.post(`${API_URL}/token/refresh/`, {
            refresh: tokens.refresh,
          });
          
          const newTokens = response.data;
          localStorage.setItem('tokens', JSON.stringify(newTokens));
          
          // Retry the original request with the new token
          originalRequest.headers.Authorization = `Bearer ${newTokens.access}`;
          return axios(originalRequest);
        }
      } catch (refreshError) {
        // If refresh token fails, logout the user
        localStorage.removeItem('tokens');
        window.location.href = '/';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;