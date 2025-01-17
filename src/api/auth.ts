import api from './axiosInstance';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export const login = async (credentials: LoginCredentials): Promise<AuthTokens> => {
  const response = await api.post('/login/', credentials);
  return response.data;
};