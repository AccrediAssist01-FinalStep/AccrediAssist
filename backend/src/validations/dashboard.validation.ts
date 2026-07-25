import { z } from 'zod';

const currentYear = new Date().getUTCFullYear();

export const dashboardMonthlyStatisticsQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100).optional().default(currentYear),
  month: z.coerce.number().int().min(1).max(12).optional().default(new Date().getUTCMonth() + 1),
});

export const dashboardYearlyStatisticsQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100).optional().default(currentYear),
});

export const dashboardRecentActivitiesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).optional().default(10),
});

export type DashboardMonthlyStatisticsQuery = z.infer<typeof dashboardMonthlyStatisticsQuerySchema>;
export type DashboardYearlyStatisticsQuery = z.infer<typeof dashboardYearlyStatisticsQuerySchema>;
export type DashboardRecentActivitiesQuery = z.infer<typeof dashboardRecentActivitiesQuerySchema>;
