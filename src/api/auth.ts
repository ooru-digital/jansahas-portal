import api from './axiosInstance';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
  is_jansathi: boolean;
  name: string;
  email: string;
}

export const login = async (credentials: LoginCredentials): Promise<AuthTokens> => {
  const response = await api.post('/login/', credentials);
  return response.data;
};

export const refreshToken = async (refresh: string): Promise<AuthTokens> => {
  const response = await api.post('/token/refresh/', { refresh });
  return response.data;
};