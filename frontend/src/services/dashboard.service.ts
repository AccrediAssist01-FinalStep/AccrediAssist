import apiClient from '@/lib/api-client';
import type { ApiResponse } from '@/types';
import type {
  DashboardMonthlyStatistics,
  DashboardRecentActivity,
  DashboardSummary,
} from '@/types/api-models';

export const dashboardService = {
  getSummary: async (): Promise<DashboardSummary> => {
    const { data } = await apiClient.get<ApiResponse<DashboardSummary>>('/dashboard/summary');
    return data.data!;
  },

  getMonthlyStatistics: async (year: number, month: number): Promise<DashboardMonthlyStatistics> => {
    const { data } = await apiClient.get<ApiResponse<DashboardMonthlyStatistics>>(
      '/dashboard/statistics/monthly',
      { params: { year, month } },
    );
    return data.data!;
  },

  getRecentActivities: async (limit = 10): Promise<{ activities: DashboardRecentActivity[] }> => {
    const { data } = await apiClient.get<ApiResponse<{ activities: DashboardRecentActivity[] }>>(
      '/dashboard/activities/recent',
      { params: { limit } },
    );
    return data.data!;
  },
};
