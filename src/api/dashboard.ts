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
  created_by: string;
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
  phone_number?: string;
  age?: string;
  sex?: string;
  present_address_line1: string;
  present_address_line2: string;
  present_city: string;
  present_state: string;
  present_pincode: string;
  permanent_address_line1: string;
  permanent_address_line2: string;
  permanent_city: string;
  permanent_state: string;
  permanent_pincode: string;
  approved_by?: string;
  rejected_by?: string;
  rejection_reason?: string;
}

interface BulkUpdateItem {
  id: number;
  status: 'approved' | 'rejected';
  rejection_reason?: string;
}

interface BulkUpdateResponse {
  success: BulkUpdateItem[];
  failures: BulkUpdateItem[];
}

export interface ApprovalsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: WorkDetail[];
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

export const getPendingApprovals = async (url?: string): Promise<ApprovalsResponse> => {
  const endpoint = url || '/approvals/?limit=10&offset=0';
  const response = await api.get<ApprovalsResponse>(endpoint);
  return response.data;
};

export const bulkUpdateApprovalStatus = async (updates: BulkUpdateItem[]): Promise<BulkUpdateResponse> => {
  const response = await api.post('/workdetails/bulk-status-update', updates);
  return response.data;
};