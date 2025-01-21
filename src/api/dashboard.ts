import api from './axiosInstance';

export interface DashboardCounts {
  pending_approval_count: number;
  approved_work_count: number;
  total_authorized_signatories: number;
  total_workers: number;
  total_sites: number;
  total_organizations: number;
  rejected_work_count?: number;
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
  worker_name?: string;
  site_name?: string;
  organization_name?: string;
  photograph?: string;
}

export interface WorkHistoryDetail extends WorkDetail {
  approved_date?: string;
  rejected_date?: string;
  organization_id: string;
  site_id: string;
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
  const response = await api.get(`/workdetails/status/${status}?count=5`);
  return response.data.work_details || [];
};

export const getWorkHistoryDetail = async (id: number): Promise<WorkHistoryDetail> => {
  const response = await api.get(`/work-history/${id}/get/`);
  return response.data;
};

export const getPendingApprovals = async (): Promise<WorkDetail[]> => {
  const response = await api.get('/approvals/');
  return response.data;
};

export const bulkUpdateApprovalStatus = async (updates: BulkUpdateItem[]): Promise<BulkUpdateResponse> => {
  const response = await api.post('/workdetails/bulk-status-update', updates);
  return response.data;
};