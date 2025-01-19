import api from './axiosInstance';

export interface DashboardCounts {
  pending_approval_count: number;
  approved_work_count: number;
  total_authorized_signatories: number;
  total_workers: number;
  total_sites: number;
}

export interface WorkDetail {
  id: number;
  work_name: string;
  work_type: string;
  location: string;
  start_date: string;
  end_date: string;
  status: string;
  worker: string;
  site: string;
  created_at: string;
  updated_at: string;
  number_of_working_days: number;
  isJansathi: boolean;
}

interface WorkDetailsResponse {
  count: number;
  work_details: WorkDetail[];
}

interface BulkUpdateItem {
  id: number;
  status: 'approved' | 'rejected';
}

interface BulkUpdateResponse {
  success: BulkUpdateItem[];
  failures: BulkUpdateItem[];
}

export const getDashboardCounts = async (): Promise<DashboardCounts> => {
  const response = await api.get('/dashboard/count/');
  return response.data;
};

export const getRecentWorkDetails = async (status: 'pending' | 'approved' | 'rejected'): Promise<WorkDetail[]> => {
  const response = await api.get<WorkDetailsResponse>(`/workdetails/status/${status}?count=5`);
  return response.data.work_details || [];
};

export const getPendingApprovals = async (): Promise<WorkDetail[]> => {
  const response = await api.get('/approvals/');
  return response.data;
};

export const updateApprovalStatus = async (id: number, status: 'approved' | 'rejected'): Promise<void> => {
  await api.patch(`/work-history/${id}/approve/`, { status });
};

export const bulkUpdateApprovalStatus = async (updates: BulkUpdateItem[]): Promise<BulkUpdateResponse> => {
  const response = await api.post('/workdetails/bulk-status-update', updates);
  return response.data;
};