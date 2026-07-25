import { Router } from 'express';
import { dashboardController } from '../controllers/dashboard.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorizePermission } from '../middleware/authorize.middleware';
import { validateQuery } from '../middleware/validate.middleware';
import {
  dashboardMonthlyStatisticsQuerySchema,
  dashboardRecentActivitiesQuerySchema,
  dashboardYearlyStatisticsQuerySchema,
} from '../validations/dashboard.validation';

const dashboardRouter = Router();

dashboardRouter.use(authenticate, authorizePermission('dashboard'));

dashboardRouter.get('/summary', dashboardController.summary);

dashboardRouter.get('/totals/students', dashboardController.totalStudents);
dashboardRouter.get('/totals/faculty-achievements', dashboardController.totalFacultyAchievements);
dashboardRouter.get('/totals/placements', dashboardController.totalPlacements);
dashboardRouter.get('/totals/internships', dashboardController.totalInternships);
dashboardRouter.get('/totals/publications', dashboardController.totalPublications);
dashboardRouter.get('/totals/patents', dashboardController.totalPatents);
dashboardRouter.get('/totals/pending-reviews', dashboardController.pendingReviews);

dashboardRouter.get(
  '/statistics/monthly',
  validateQuery(dashboardMonthlyStatisticsQuerySchema),
  dashboardController.monthlyStatistics,
);

dashboardRouter.get(
  '/statistics/yearly',
  validateQuery(dashboardYearlyStatisticsQuerySchema),
  dashboardController.yearlyStatistics,
);

dashboardRouter.get(
  '/activities/recent',
  validateQuery(dashboardRecentActivitiesQuerySchema),
  dashboardController.recentActivities,
);

export default dashboardRouter;
