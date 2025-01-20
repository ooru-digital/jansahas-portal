import api from './axiosInstance';

export interface Worker {
  id: number;
  name: string;
  phone_number: string;
  present_address: string;
  permanent_address: string;
  organization_id: string;
  age: string;
  gender: string;
  photograph: string | null;
}

export interface CreateWorkerData {
  name: string;
  phone_number: string;
  present_address: string;
  permanent_address: string;
  organization_id: string;
  age: string;
  gender: string;
  photograph: File | null;
}

export interface UpdateWorkerData {
  name?: string;
  phone_number?: string;
  present_address?: string;
  permanent_address?: string;
  organization_id?: string;
  age?: string;
  gender?: string;
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

export const createWorker = async (data: CreateWorkerData): Promise<Worker> => {
  try {
    let requestData = { ...data };

    // Convert photograph to base64 if it exists
    if (data.photograph instanceof File) {
      const base64Image = await convertFileToBase64(data.photograph);
      requestData = {
        ...requestData,
        photograph: base64Image,
      };
    }

    // Map gender to sex for API compatibility
    const apiData = {
      ...requestData,
      sex: data.gender,
    };
    delete apiData.gender;

    // Remove the original File object to prevent serialization issues
    delete (apiData as any).photograph_file;

    const response = await api.post('/worker/create/', apiData);
    
    // Map sex back to gender in the response
    const responseData = {
      ...response.data,
      gender: response.data.sex,
    };
    delete responseData.sex;

    return responseData;
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
    const apiData = { ...data };
    if (data.gender) {
      apiData.sex = data.gender;
      delete apiData.gender;
    }

    const response = await api.patch(`/worker/${id}/update/`, apiData);
    
    // Map sex back to gender in the response
    const responseData = {
      ...response.data,
      gender: response.data.sex,
    };
    delete responseData.sex;

    return responseData;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to update worker: ${error.message}`);
    }
    throw new Error('Failed to update worker');
  }
};

export const getWorkers = async (): Promise<Worker[]> => {
  try {
    const response = await api.get('/workers/');
    
    // Map sex to gender in each worker object
    const workers = response.data.map((worker: any) => ({
      ...worker,
      gender: worker.sex,
    }));

    return workers;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to fetch workers: ${error.message}`);
    }
    throw new Error('Failed to fetch workers');
  }
};

export const getWorker = async (id: number): Promise<Worker> => {
  try {
    const response = await api.get(`/worker/${id}/`);
    
    // Map sex to gender in the response
    const worker = {
      ...response.data,
      gender: response.data.sex,
    };
    delete worker.sex;

    return worker;
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