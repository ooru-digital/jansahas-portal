import api from './axiosInstance';

export interface Organization {
  id: string;
  name: string;
}

export interface Site {
  id: string;
  name: string;
  organization_id: string;
}

export const getOrganizations = async (): Promise<Organization[]> => {
  const response = await api.get('/organization/all/');
  return response.data;
};

export const getSitesByOrganization = async (): Promise<Site[]> => {
  const response = await api.get('/site/all/');
  return response.data;
};