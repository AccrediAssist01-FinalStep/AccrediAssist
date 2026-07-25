import { logger } from '../../utils/logger';
import {
  DashboardMonthlyStatistics,
  DashboardRecentActivity,
  DashboardSummary,
  DashboardTotalResponse,
  DashboardYearlyStatistics,
} from '../interfaces/dashboard.interface';
import { dashboardRepository, DashboardRepository } from '../repositories/dashboard.repository';

export class DashboardService {
  constructor(private readonly repository: DashboardRepository = dashboardRepository) {}

  async getTotalStudents(): Promise<DashboardTotalResponse> {
    logger.info('Fetching dashboard total students');
    return { total: await this.repository.countUniqueStudents() };
  }

  async getTotalFacultyAchievements(): Promise<DashboardTotalResponse> {
    logger.info('Fetching dashboard total faculty achievements');
    return { total: await this.repository.countFacultyAchievements() };
  }

  async getTotalPlacements(): Promise<DashboardTotalResponse> {
    logger.info('Fetching dashboard total placements');
    return { total: await this.repository.countPlacements() };
  }

  async getTotalInternships(): Promise<DashboardTotalResponse> {
    logger.info('Fetching dashboard total internships');
    return { total: await this.repository.countInternships() };
  }

  async getTotalPublications(): Promise<DashboardTotalResponse> {
    logger.info('Fetching dashboard total publications');
    return { total: await this.repository.countPublications() };
  }

  async getTotalPatents(): Promise<DashboardTotalResponse> {
    logger.info('Fetching dashboard total patents');
    return { total: await this.repository.countPatents() };
  }

  async getPendingReviews(): Promise<DashboardTotalResponse> {
    logger.info('Fetching dashboard pending reviews');
    return { total: await this.repository.countPendingReviews() };
  }

  async getMonthlyStatistics(year: number, month: number): Promise<DashboardMonthlyStatistics> {
    logger.info('Fetching dashboard monthly statistics', { year, month });
    return this.repository.getMonthlyStatistics(year, month);
  }

  async getYearlyStatistics(year: number): Promise<DashboardYearlyStatistics> {
    logger.info('Fetching dashboard yearly statistics', { year });
    return this.repository.getYearlyStatistics(year);
  }

  async getRecentActivities(limit: number): Promise<DashboardRecentActivity[]> {
    logger.info('Fetching dashboard recent activities', { limit });
    return this.repository.getRecentActivities(limit);
  }

  async getSummary(): Promise<DashboardSummary> {
    logger.info('Fetching dashboard summary');

    const [
      totalStudents,
      totalFacultyAchievements,
      totalPlacements,
      totalInternships,
      totalPublications,
      totalPatents,
      pendingReviews,
    ] = await Promise.all([
      this.repository.countUniqueStudents(),
      this.repository.countFacultyAchievements(),
      this.repository.countPlacements(),
      this.repository.countInternships(),
      this.repository.countPublications(),
      this.repository.countPatents(),
      this.repository.countPendingReviews(),
    ]);

    return {
      totalStudents,
      totalFacultyAchievements,
      totalPlacements,
      totalInternships,
      totalPublications,
      totalPatents,
      pendingReviews,
    };
  }
}

export const dashboardService = new DashboardService();
