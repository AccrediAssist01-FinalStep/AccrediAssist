import apiClient from '@/lib/api-client';
import type { ApiResponse } from '@/types';
import type {
  GlobalSearchResponse,
  PaginatedMeta,
  SearchCollectionsResponse,
  SearchHistoryItem,
  SearchStatusResponse,
} from '@/types/api-models';

export interface SearchRequest {
  query: string;
  page?: number;
  limit?: number;
  collection?: string;
  filters?: Record<string, unknown>;
  sort?: 'latest' | 'oldest' | '';
  department?: string;
  fields?: string[];
}

export interface ExecuteSearchRequest {
  collection: string;
  filters?: Record<string, unknown>;
  sort?: 'latest' | 'oldest' | '';
  department?: string;
  fields?: string[];
  page?: number;
  limit?: number;
}

export interface SearchHistoryResponse {
  items: SearchHistoryItem[];
  meta: PaginatedMeta;
}

export const searchService = {
  globalSearch: async (payload: SearchRequest): Promise<GlobalSearchResponse> => {
    const { data } = await apiClient.post<ApiResponse<GlobalSearchResponse>>('/search', payload);
    return data.data!;
  },

  executeSearch: async (payload: ExecuteSearchRequest): Promise<GlobalSearchResponse> => {
    const { data } = await apiClient.post<
      ApiResponse<{
        query: string | null;
        understanding: GlobalSearchResponse['understanding'];
        results: { items: GlobalSearchResponse['results']; meta: PaginatedMeta };
      }>
    >('/search/execute', payload);

    const payloadData = data.data!;
    return {
      query: payloadData.query ?? '',
      understanding: payloadData.understanding,
      filters: payloadData.understanding.filters ?? {},
      results: payloadData.results.items,
      meta: payloadData.results.meta,
    };
  },

  getStatus: async (): Promise<SearchStatusResponse> => {
    const { data } = await apiClient.get<ApiResponse<SearchStatusResponse>>('/search/status');
    return data.data!;
  },

  getCollections: async (): Promise<string[]> => {
    const { data } = await apiClient.get<ApiResponse<SearchCollectionsResponse>>('/search/collections');
    return data.data!.collections;
  },

  getHistory: async (page = 1, limit = 10): Promise<SearchHistoryResponse> => {
    const { data } = await apiClient.get<ApiResponse<SearchHistoryResponse>>('/search/history', {
      params: { page, limit },
    });
    return data.data!;
  },

  clearHistory: async (): Promise<number> => {
    const { data } = await apiClient.delete<ApiResponse<{ deletedCount: number }>>('/search/history');
    return data.data?.deletedCount ?? 0;
  },
};
