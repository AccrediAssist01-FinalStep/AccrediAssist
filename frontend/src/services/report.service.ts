import apiClient from '@/lib/api-client';
import type { ApiResponse } from '@/types';
import type {
  GenerateReportPayload,
  ReportChartsResponse,
  ReportDownloadInfo,
  ReportExecutiveSummary,
  ReportListResponse,
  ReportQueryParams,
  ReportRecord,
} from '@/types/api-models';

export const reportService = {
  generate: async (payload: GenerateReportPayload): Promise<ReportRecord> => {
    const { data } = await apiClient.post<ApiResponse<ReportRecord>>('/reports/generate', payload, {
      timeout: 120_000,
    });
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

  downloadFile: async (id: string): Promise<Blob> => {
    const response = await apiClient.get<Blob>(`/reports/download/${id}`, {
      responseType: 'blob',
      timeout: 120_000,
    });
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/reports/${id}`);
  },
};

export const reportGenerationService = {
  getSummary: async (
    reportType: string,
    filters: Record<string, unknown> = {},
  ): Promise<ReportExecutiveSummary> => {
    const { data } = await apiClient.post<
      ApiResponse<{ summary: ReportExecutiveSummary }>
    >('/report-generation/summary', { reportType, filters }, { timeout: 120_000 });
    return data.data!.summary;
  },

  getCharts: async (
    reportType: string,
    filters: Record<string, unknown> = {},
  ): Promise<ReportChartsResponse> => {
    const { data } = await apiClient.post<ApiResponse<ReportChartsResponse>>(
      '/report-generation/charts',
      { reportType, filters, exportFormat: 'frontend' },
      { timeout: 120_000 },
    );
    return data.data!;
  },
};
