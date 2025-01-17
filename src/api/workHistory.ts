import api from './axiosInstance';

export interface WorkHistory {
  id: number;
  worker_id: number;
  work_name: string;
  work_type: string;
  location: string;
  start_date: string;
  end_date: string;
  site_id: string;
  organization_id: string;
}

export interface CreateWorkHistoryData {
  worker_id: number;
  work_name: string;
  work_type: string;
  location: string;
  start_date: string;
  end_date: string;
  site_id: string;
  organization_id: string;
}

export interface UpdateWorkHistoryData {
  work_name?: string;
  work_type?: string;
  location?: string;
  start_date?: string;
  end_date?: string;
}

export const createWorkHistory = async (data: CreateWorkHistoryData): Promise<WorkHistory> => {
  const response = await api.post('/work-history/create/', data);
  return response.data;
};

export const updateWorkHistory = async (id: number, data: UpdateWorkHistoryData): Promise<WorkHistory> => {
  const response = await api.patch(`/work-history/${id}/update/`, data);
  return response.data;
};

export const deleteWorkHistory = async (id: number): Promise<void> => {
  await api.delete(`/work-history/${id}/delete/`);
};

export const getWorkHistories = async (): Promise<WorkHistory[]> => {
  const response = await api.get('/work-history/');
  return response.data;
};

export const getWorkerWorkHistory = async (workerId: number): Promise<WorkHistory[]> => {
  const response = await api.get(`/worker/${workerId}/work-history/`);
  return response.data;
};

export const generateVC = async (workerId: number): Promise<void> => {
  await api.post(`/worker/${workerId}/generate-vc/`);
};