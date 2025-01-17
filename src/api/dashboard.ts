import api from './axiosInstance';

export interface DashboardStats {
  siteCount: number;
  signatoryCount: number;
  workerCount: number;
  siteWorkerCount: number;
  daywiseWorkers: {
    date: string;
    count: number;
  }[];
}

export const getDashboardStats = async (organizationId: number, siteId: number): Promise<DashboardStats> => {
  try {
    const [siteCount, workerCount, siteWorkerCount, daywiseWorkers] = await Promise.all([
      api.get(`/organization/${organizationId}/site-count/`),
      api.get(`/organization/${organizationId}/worker-count/`),
      api.get(`/site/${siteId}/worker-count/`),
      api.get(`/site/${siteId}/daywise-workers/`)
    ]);

    return {
      siteCount: siteCount.data.count,
      workerCount: workerCount.data.count,
      siteWorkerCount: siteWorkerCount.data.count,
      daywiseWorkers: daywiseWorkers.data
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || 'Failed to fetch dashboard data');
    }
    throw new Error('An unexpected error occurred');
  }
};