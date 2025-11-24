import api from './axiosInstance';

export interface VoucherWorker {
  id: number;
  name: string;
  email: string | null;
  phone: string;
  photograph?: string | null;
}

export interface VoucherDisbursement {
  id: string;
  worker: VoucherWorker;
  category_id: string;
  category_name: string;
  status: 'ISSUED' | 'ISSUANCE_FAILED' | 'REDEEMED' | 'PENDING';
  amount: string;
  issued_at: string;
  redeemed_at: string | null;
}

export interface VoucherSummary {
  total_issued: number;
  total_failed: number;
  total_redeemed: number;
  total_redemption_pending: number;
}

export interface VoucherDisbursementResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: VoucherDisbursement[];
  summary: VoucherSummary;
}

export interface VoucherQueryParams {
  limit?: number;
  offset?: number;
  status?: string;
  category_id?: string;
  worker_id?: number;
  organization_id?: string;
}

export interface RefreshVoucherResponse {
  voucher_id: string;
  credential_id?: string;
  verification_status?: string;
  updated_status?: 'ISSUED' | 'ISSUANCE_FAILED' | 'REDEEMED' | 'PENDING';
  redeemed_at?: string | null;
  current_status?: string;
  message?: string;
}

export const getVoucherDisbursements = async (params?: VoucherQueryParams): Promise<VoucherDisbursementResponse> => {
  try {
    const queryParams = new URLSearchParams();

    if (params) {
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.offset) queryParams.append('offset', params.offset.toString());
      if (params.status) queryParams.append('status', params.status);
      if (params.category_id) queryParams.append('category_id', params.category_id);
      if (params.worker_id) queryParams.append('worker_id', params.worker_id.toString());
      if (params.organization_id) queryParams.append('organization_id', params.organization_id);
    }

    const endpoint = `/vouchers/dashboard?${queryParams.toString()}`;
    const response = await api.get<VoucherDisbursementResponse>(endpoint);

    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to fetch voucher disbursements: ${error.message}`);
    }
    throw new Error('Failed to fetch voucher disbursements');
  }
};

export const refreshVoucherStatus = async (voucherId: string): Promise<RefreshVoucherResponse> => {
  try {
    const endpoint = `/voucher/refresh/${voucherId}`;
    const response = await api.get<RefreshVoucherResponse>(endpoint);

    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to refresh voucher status: ${error.message}`);
    }
    throw new Error('Failed to refresh voucher status');
  }
};
