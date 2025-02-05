import api from './axiosInstance';

export interface WorkerDetails {
  id: number;
  name: string;
  phone_number: string;
  address: string;
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
  age: number;
  sex: string;
  photograph: string;
  total_approved_work_days: number;
  credential_validity_last_90_days?: {
    start_date: string;
    end_date: string;
  };
}

export interface AuditLog {
  log_category: string;
  event_data: {
    data: Record<string, any>;
    info: string;
    log_description: string;
  };
  severity: string;
  error: null | string;
}

export interface VCData {
  credential_id: string;
  recipient_name: string;
  updated_at: string;
  svg_url: string;
  thumbnail_url: string;
  mobile_number: string;
  whatsapp_number: string;
  email_id: string;
  status: string;
  issuer_name: string;
  approved_by: string | null;
  certificate_name: string;
  audit_log: AuditLog;
  public_verify_url: string;
  org_name: string;
  org_linkedin_code: string | null;
  org_linkedin_name: string | null;
  org_code: string;
  transaction_id: string;
  org_logo: string;
  verification_status: 'Valid' | 'Invalid' | 'Revoked' | 'Expired' | 'Failed';
}

export interface VerifyCredentialResponse {
  vc_data: VCData;
  related_vc_data: VCData[];
  worker_details: WorkerDetails;
}

export const verifyCredential = async (certHash: string): Promise<VerifyCredentialResponse> => {
  const response = await api.post(`/credentials/verify/${certHash}`);
  return response.data;
};