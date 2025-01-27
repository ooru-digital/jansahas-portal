import api from './axiosInstance';

export interface Worker {
  id: number;
  name: string;
  phone_number: string;
  present_address: string;
  permanent_address: string;
  organization_id: string;
  age: number;
  gender: string;
  photograph: string | null;
  total_approved_work_days?: number;
}

export interface CreateWorkerData {
  name: string;
  phone_number: string;
  present_address: string;
  permanent_address: string;
  organization_id: string;
  age: string | number;
  gender: string;
  photograph: string | File | null;
}

export interface UpdateWorkerData {
  name?: string;
  phone_number?: string;
  present_address?: string;
  permanent_address?: string;
  organization_id?: string;
  age?: number;
  gender?: string;
}

interface ApiWorkerResponse {
  id: number;
  name: string;
  phone_number: string;
  present_address: string;
  permanent_address: string;
  organization_id: string;
  age: number;
  sex: string;
  photograph: string | null;
}

export interface WorkersResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Worker[];
}

interface ApiWorkersResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: ApiWorkerResponse[];
}

export interface WorkersQueryParams {
  limit?: number;
  offset?: number;
  search?: string;
  gender?: 'male' | 'female';
  approved_worker_days?: 'lt_90' | 'gt_90';
  vc_generated?: boolean;
}

const convertFileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert file to base64'));
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

const mapApiWorkerToClient = (apiWorker: ApiWorkerResponse): Worker => {
  const { sex, ...rest } = apiWorker;
  return {
    ...rest,
    gender: sex
  };
};

export const createWorker = async (data: CreateWorkerData): Promise<Worker> => {
  try {
    let requestData = { ...data };

    // Convert age to number if it's a string
    if (typeof data.age === 'string') {
      requestData.age = parseInt(data.age, 10);
    }

    // Convert photograph to base64 if it exists and is a File
    if (data.photograph instanceof File) {
      try {
        const base64Image = await convertFileToBase64(data.photograph);
        requestData = {
          ...requestData,
          photograph: base64Image,
        };
      } catch (error) {
        throw new Error('Failed to process photograph. Please try again.');
      }
    }

    // Map gender to sex for API compatibility
    const apiData = {
      ...requestData,
      sex: data.gender,
    };
    delete (apiData as any).gender;

    // Remove the original File object to prevent serialization issues
    delete (apiData as any).photograph_file;

    const response = await api.post<ApiWorkerResponse>('/worker/create/', apiData);
    return mapApiWorkerToClient(response.data);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to create worker: ${error.message}`);
    }
    throw new Error('Failed to create worker');
  }
};

export const updateWorker = async (id: number, data: UpdateWorkerData): Promise<Worker> => {
  try {
    // Map gender to sex for API compatibility if gender is being updated
    const apiData: Record<string, any> = { ...data };
    if (data.gender) {
      apiData.sex = data.gender;
      delete apiData.gender;
    }

    const response = await api.patch<ApiWorkerResponse>(`/worker/${id}/update/`, apiData);
    return mapApiWorkerToClient(response.data);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to update worker: ${error.message}`);
    }
    throw new Error('Failed to update worker');
  }
};

export const getWorkers = async (params?: WorkersQueryParams): Promise<WorkersResponse> => {
  try {
    const queryParams = new URLSearchParams();
    
    if (params) {
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.offset) queryParams.append('offset', params.offset.toString());
      if (params.search) queryParams.append('search', params.search);
      if (params.gender) queryParams.append('gender', params.gender);
      if (params.approved_worker_days) queryParams.append('approved_worker_days', params.approved_worker_days);
      if (params.vc_generated !== undefined) queryParams.append('vc_generated', params.vc_generated.toString());
    }

    const endpoint = `/workers/?${queryParams.toString()}`;
    const response = await api.get<ApiWorkersResponse>(endpoint);
    
    return {
      ...response.data,
      results: response.data.results.map(mapApiWorkerToClient)
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to fetch workers: ${error.message}`);
    }
    throw new Error('Failed to fetch workers');
  }
};

export const getWorker = async (id: number): Promise<Worker> => {
  try {
    const response = await api.get<ApiWorkerResponse>(`/worker/${id}/`);
    return mapApiWorkerToClient(response.data);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to fetch worker: ${error.message}`);
    }
    throw new Error('Failed to fetch worker');
  }
};

export const deleteWorker = async (id: number): Promise<void> => {
  try {
    await api.delete(`/worker/${id}/delete/`);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to delete worker: ${error.message}`);
    }
    throw new Error('Failed to delete worker');
  }
};