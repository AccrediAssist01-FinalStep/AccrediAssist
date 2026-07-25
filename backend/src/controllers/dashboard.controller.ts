import { Request, Response } from 'express';
import { BaseController } from './base.controller';
import { dashboardService } from '../dashboard/services/dashboard.service';
import { asyncHandler } from '../middleware/asyncHandler';
import {
  DashboardMonthlyStatisticsQuery,
  DashboardRecentActivitiesQuery,
  DashboardYearlyStatisticsQuery,
} from '../validations/dashboard.validation';

class DashboardController extends BaseController {
  totalStudents = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const result = await dashboardService.getTotalStudents();
    this.success(res, 'Total students retrieved successfully', result);
  });

  totalFacultyAchievements = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const result = await dashboardService.getTotalFacultyAchievements();
    this.success(res, 'Total faculty achievements retrieved successfully', result);
  });

  totalPlacements = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const result = await dashboardService.getTotalPlacements();
    this.success(res, 'Total placements retrieved successfully', result);
  });

  totalInternships = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const result = await dashboardService.getTotalInternships();
    this.success(res, 'Total internships retrieved successfully', result);
  });

  totalPublications = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const result = await dashboardService.getTotalPublications();
    this.success(res, 'Total publications retrieved successfully', result);
  });

  totalPatents = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const result = await dashboardService.getTotalPatents();
    this.success(res, 'Total patents retrieved successfully', result);
  });

  pendingReviews = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const result = await dashboardService.getPendingReviews();
    this.success(res, 'Pending reviews count retrieved successfully', result);
  });

  monthlyStatistics = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const query = req.query as unknown as DashboardMonthlyStatisticsQuery;
    const result = await dashboardService.getMonthlyStatistics(query.year, query.month);
    this.success(res, 'Monthly statistics retrieved successfully', result);
  });

  yearlyStatistics = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const query = req.query as unknown as DashboardYearlyStatisticsQuery;
    const result = await dashboardService.getYearlyStatistics(query.year);
    this.success(res, 'Yearly statistics retrieved successfully', result);
  });

  recentActivities = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const query = req.query as unknown as DashboardRecentActivitiesQuery;
    const result = await dashboardService.getRecentActivities(query.limit);
    this.success(res, 'Recent activities retrieved successfully', { activities: result });
  });

  summary = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const result = await dashboardService.getSummary();
    this.success(res, 'Dashboard summary retrieved successfully', result);
  });
}

export const dashboardController = new DashboardController();
