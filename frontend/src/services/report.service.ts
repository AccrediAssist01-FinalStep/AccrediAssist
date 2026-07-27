import apiClient from '@/lib/api-client';
import type { ApiResponse } from '@/types';
import type {
  GenerateReportPayload,
  ReportDownloadInfo,
  ReportListResponse,
  ReportQueryParams,
  ReportRecord,
} from '@/types/api-models';

export const reportService = {
  generate: async (payload: GenerateReportPayload): Promise<ReportRecord> => {
    const { data } = await apiClient.post<ApiResponse<ReportRecord>>('/reports/generate', payload);
    return data.data!;
  },

  list: async (params: ReportQueryParams = {}): Promise<ReportListResponse> => {
    const { data } = await apiClient.get<ApiResponse<ReportListResponse>>('/reports', { params });
    return data.data!;
  },

  getById: async (id: string): Promise<ReportRecord> => {
    const { data } = await apiClient.get<ApiResponse<ReportRecord>>(`/reports/${id}`);
    return data.data!;
  },

  getDownloadInfo: async (id: string): Promise<ReportDownloadInfo> => {
    const { data } = await apiClient.get<ApiResponse<ReportDownloadInfo>>(`/reports/${id}/download`);
    return data.data!;
  },

  downloadRedirect: (id: string): string => {
    const base = apiClient.defaults.baseURL ?? '';
    return `${base}/reports/${id}/download?redirect=true`;
  },
};
