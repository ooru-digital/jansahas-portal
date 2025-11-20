import api from './axiosInstance';

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  galleryId: string;
  bioType: string;
  similarityScore: number;
  attendanceType: 'entry' | 'exit';
  timestamp: string;
  date: string;
  synced: boolean;
}

export interface AttendanceResponse {
  success: boolean;
  total: number;
  data: AttendanceRecord[];
}

export interface AttendanceQueryParams {
  limit?: number;
  offset?: number;
  date?: string;
  employeeId?: string;
  attendanceType?: 'entry' | 'exit';
}

export const getAttendance = async (params?: AttendanceQueryParams): Promise<AttendanceResponse> => {
  try {
    const queryParams = new URLSearchParams();

    if (params) {
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.offset) queryParams.append('offset', params.offset.toString());
      if (params.date) queryParams.append('date', params.date);
      if (params.employeeId) queryParams.append('employeeId', params.employeeId);
      if (params.attendanceType) queryParams.append('attendanceType', params.attendanceType);
    }

    const endpoint = `/attendance?${queryParams.toString()}`;
    const response = await api.get<AttendanceResponse>(endpoint);

    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to fetch attendance records: ${error.message}`);
    }
    throw new Error('Failed to fetch attendance records');
  }
};
