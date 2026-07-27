'use client';

import { useQuery } from '@tanstack/react-query';
import {
  dashboardService,
  fetchMonthlyTrend,
  getMonthRange,
} from '@/services/dashboard.service';
import {
  buildDashboardStats,
  type DashboardData,
  type MonthlyTrendPoint,
} from '../types';
import { toMonthlyTrendPoints } from '../utils/dashboard.utils';

export const useDashboardData = () => {
  const now = new Date();
  const year = now.getFullYear();
  const { year: currentYear, month: currentMonth } = getMonthRange(0);
  const { year: previousYear, month: previousMonth } = getMonthRange(-1);

  const query = useQuery<DashboardData>({
    queryKey: ['dashboard-enterprise', year, currentMonth],
    queryFn: async () => {
      const [summary, yearly, currentMonthStats, previousMonthStats, monthlyRecords, activitiesResult] =
        await Promise.all([
          dashboardService.getSummary(),
          dashboardService.getYearlyStatistics(year),
          dashboardService.getMonthlyStatistics(currentYear, currentMonth),
          dashboardService.getMonthlyStatistics(previousYear, previousMonth),
          fetchMonthlyTrend(6),
          dashboardService.getRecentActivities(12),
        ]);

      const monthlyTrend: MonthlyTrendPoint[] = toMonthlyTrendPoints(monthlyRecords);

      return {
        summary,
        yearly,
        currentMonth: currentMonthStats,
        previousMonth: previousMonthStats,
        monthlyTrend,
        activities: activitiesResult.activities,
        stats: buildDashboardStats(summary, currentMonthStats, previousMonthStats, yearly),
      };
    },
    staleTime: 60_000,
  });

  return query;
};
