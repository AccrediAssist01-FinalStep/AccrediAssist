import apiClient from '@/lib/api-client';
import type { ApiResponse } from '@/types';
import type {
  EditPendingRecordPayload,
  PendingRecord,
  PendingRecordListResponse,
  PendingRecordQueryParams,
  RejectPendingRecordPayload,
} from '@/types/api-models';

export const pendingReviewService = {
  list: async (params: PendingRecordQueryParams = {}): Promise<PendingRecordListResponse> => {
    const { data } = await apiClient.get<ApiResponse<PendingRecordListResponse>>('/pending', {
      params,
    });
    return data.data!;
  },

  getById: async (id: string): Promise<PendingRecord> => {
    const { data } = await apiClient.get<ApiResponse<PendingRecord>>(`/pending/${id}`);
    return data.data!;
  },

  edit: async (id: string, payload: EditPendingRecordPayload): Promise<PendingRecord> => {
    const { data } = await apiClient.patch<ApiResponse<PendingRecord>>(`/pending/${id}`, payload);
    return data.data!;
  },

  approve: async (id: string): Promise<PendingRecord> => {
    const { data } = await apiClient.put<ApiResponse<PendingRecord>>(`/pending/${id}/approve`);
    return data.data!;
  },

  reject: async (id: string, payload: RejectPendingRecordPayload): Promise<PendingRecord> => {
    const { data } = await apiClient.put<ApiResponse<PendingRecord>>(
      `/pending/${id}/reject`,
      payload,
    );
    return data.data!;
  },

  regenerate: async (id: string): Promise<PendingRecord> => {
    const { data } = await apiClient.post<ApiResponse<PendingRecord>>(`/pending/${id}/regenerate`);
    return data.data!;
  },

  downloadAttachment: async (id: string): Promise<Blob> => {
    const { data } = await apiClient.get<Blob>(`/pending/${id}/attachment`, {
      responseType: 'blob',
    });
    return data;
  },
};
