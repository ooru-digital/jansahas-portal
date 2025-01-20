import api from './axiosInstance';

export interface Site {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

export const getAllSites = async (): Promise<Site[]> => {
  try {
    const response = await api.get('/site/all/');
    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to fetch sites: ${error.message}`);
    }
    throw new Error('Failed to fetch sites');
  }
};