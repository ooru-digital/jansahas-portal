import api from './axiosInstance';

export interface WorkHistory {
  id: number;
  work_name: string;
  work_type: string;
  location: string;
  start_date: string;
  end_date: string;
  status: string;
  worker: string;
  site: string;
  site_id: string;
  organization_id: string;
  organization_name: string;
  site_name: string;
  created_at: string;
  updated_at: string;
  isJansathi: boolean;
  number_of_working_days: number;
  avg_daily_wages: number;
  approved_date?: string;
  rejected_date?: string;
  approved_by?: string;
  rejected_by?: string;
}

export interface WorkHistoryResponse {
  data: WorkHistory[];
  total_number_of_working_days: number;
  worker_name: string;
  present_address: string;
  permanent_address: string;
  total_no_of_approved_working_days: number;
  age: string;
  sex: string;
  photograph: string | null;
}

export interface CreateWorkHistoryData {
  worker_id: number;
  work_name: string;
  work_type: string;
  start_date: string;
  end_date: string;
  site_id: string;
  organization_id: string;
}

export interface UpdateWorkHistoryData {
  work_name?: string;
  work_type?: string;
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

export const getWorkerWorkHistory = async (workerId: number): Promise<WorkHistoryResponse> => {
  const response = await api.get(`/worker/${workerId}/work-history/`);
  return response.data;
};

export const generateVC = async (workerId: number): Promise<void> => {
  await api.post(`/worker/${workerId}/generate-vc/`);
};