import apiClient from '@/lib/api-client';
import type { ApiResponse } from '@/types';
import type {
  FeatureRecord,
  FeatureRecordFilters,
  FeatureRecordListResponse,
} from '@/features/feature-records/types';
import { yearToDateRange } from '@/features/feature-records/utils/feature-list-profile';

export const featureRecordsService = {
  list: async (
    apiPath: string,
    params: Partial<FeatureRecordFilters> & { listFilters?: Record<string, string> } = {},
  ): Promise<FeatureRecordListResponse> => {
    const { listFilters, year = 'all', ...filters } = params;
    const dateRange = yearToDateRange(year);

    const { data } = await apiClient.get<ApiResponse<FeatureRecordListResponse>>(apiPath, {
      params: {
        page: filters.page,
        limit: filters.limit,
        search: filters.search || undefined,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        fromDate: dateRange.fromDate,
        toDate: dateRange.toDate,
        ...listFilters,
      },
    });
    return data.data!;
  },

  getById: async (apiPath: string, id: string): Promise<FeatureRecord> => {
    const { data } = await apiClient.get<ApiResponse<FeatureRecord>>(`${apiPath}/${id}`);
    return data.data!;
  },
};
