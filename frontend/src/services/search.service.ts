import apiClient from '@/lib/api-client';
import type { ApiResponse } from '@/types';
import type { GlobalSearchResponse, SearchHistoryItem } from '@/types/api-models';

export interface SearchRequest {
  query: string;
  page?: number;
  limit?: number;
  collection?: string;
  filters?: Record<string, unknown>;
  sort?: string;
  department?: string;
}

export const searchService = {
  globalSearch: async (payload: SearchRequest): Promise<GlobalSearchResponse> => {
    const { data } = await apiClient.post<ApiResponse<GlobalSearchResponse>>('/search', payload);
    return data.data!;
  },

  getHistory: async (page = 1, limit = 10): Promise<{ items: SearchHistoryItem[]; meta: { total: number; totalPages: number; page: number; limit: number } }> => {
    const { data } = await apiClient.get<ApiResponse<{ items: SearchHistoryItem[]; meta: { total: number; totalPages: number; page: number; limit: number } }>>(
      '/search/history',
      { params: { page, limit } },
    );
    return data.data!;
  },

  clearHistory: async (): Promise<void> => {
    await apiClient.delete('/search/history');
  },
};
