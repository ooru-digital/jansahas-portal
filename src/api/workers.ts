import api from './axiosInstance';

export interface Worker {
  id: number;
  name: string;
  aadhar_number: string;
  phone_number: string;
  present_address: string;
  permanent_address: string;
  organization_id: string;
}

export interface CreateWorkerData {
  name: string;
  aadhar_number: string;
  phone_number: string;
  present_address: string;
  permanent_address: string;
  organization_id: string;
}

export interface UpdateWorkerData {
  name?: string;
  phone_number?: string;
  present_address?: string;
  permanent_address?: string;
  organization_id?: string;
}

export const createWorker = async (data: CreateWorkerData): Promise<Worker> => {
  const response = await api.post('/worker/create/', data);
  return response.data;
};

export const updateWorker = async (id: number, data: UpdateWorkerData): Promise<Worker> => {
  const response = await api.patch(`/worker/${id}/update/`, data);
  return response.data;
};

export const getWorkers = async (): Promise<Worker[]> => {
  const response = await api.get('/workers/');
  return response.data;
};

export const getWorker = async (id: number): Promise<Worker> => {
  const response = await api.get(`/worker/${id}/`);
  return response.data;
};

export const deleteWorker = async (id: number): Promise<void> => {
  await api.delete(`/worker/${id}/delete/`);
};