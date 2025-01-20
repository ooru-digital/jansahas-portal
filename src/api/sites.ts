import api from './axiosInstance';

export interface Site {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  organization_id: string;
}

export const getAllSites = async (): Promise<Site[]> => {
  const response = await api.get('/sites/');
  return response.data;
};

export const getSitesByOrganization = async (organizationId: string): Promise<Site[]> => {
  const response = await api.get(`/organization/${organizationId}/sites/`);
  return response.data;
};