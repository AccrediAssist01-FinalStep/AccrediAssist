import apiClient from '@/lib/api-client';
import type { ApiResponse } from '@/types';
import type {
  DashboardMonthlyStatistics,
  DashboardRecentActivity,
  DashboardSummary,
  DashboardYearlyStatistics,
} from '@/types/api-models';

export interface DashboardTotalResponse {
  total: number;
}

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

  getYearlyStatistics: async (year: number): Promise<DashboardYearlyStatistics> => {
    const { data } = await apiClient.get<ApiResponse<DashboardYearlyStatistics>>(
      '/dashboard/statistics/yearly',
      { params: { year } },
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

  getTotalPendingReviews: async (): Promise<number> => {
    const { data } = await apiClient.get<ApiResponse<DashboardTotalResponse>>(
      '/dashboard/totals/pending-reviews',
    );
    return data.data!.total;
  },
};

export const getMonthRange = (offset: number): { year: number; month: number } => {
  const date = new Date();
  date.setDate(1);
  date.setMonth(date.getMonth() + offset);
  return { year: date.getFullYear(), month: date.getMonth() + 1 };
};

export const fetchMonthlyTrend = async (months = 6): Promise<DashboardMonthlyStatistics[]> => {
  const ranges = Array.from({ length: months }, (_, index) => getMonthRange(index - (months - 1)));
  return Promise.all(
    ranges.map(({ year, month }) => dashboardService.getMonthlyStatistics(year, month)),
  );
};
