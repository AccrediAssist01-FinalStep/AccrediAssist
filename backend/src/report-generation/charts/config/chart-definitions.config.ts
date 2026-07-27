import type { AggregationModuleKey } from '../../aggregation/interfaces/aggregation.interface';
import type { ReportAggregationResult } from '../../aggregation/interfaces/aggregation.interface';
import type { ChartDefinition, ChartDefinitionId } from '../interfaces/chart-definition.interface';
import {
  buildCategoryDistributionChart,
  buildCompletedEventStatisticsChart,
  buildDepartmentDistributionChart,
  buildMonthlyTrendChart,
  buildPendingVsApprovedChart,
  buildYearlyGrowthChart,
} from '../utils/chart-builder.util';

const resolveModules = (aggregation: ReportAggregationResult): AggregationModuleKey[] =>
  aggregation.metadata.modules.filter((key) => key !== 'pendingReviews');

export const CHART_DEFINITIONS: Record<ChartDefinitionId, ChartDefinition> = {
  'monthly-placements': {
    id: 'monthly-placements',
    title: 'Monthly Placements',
    chartType: 'bar',
    module: 'placements',
    scope: 'module',
    requiredModules: ['placements'],
    build: (aggregation) =>
      buildMonthlyTrendChart(
        'monthly-placements',
        'Monthly Placements',
        'placements',
        'bar',
        aggregation,
      ),
  },
  'monthly-internships': {
    id: 'monthly-internships',
    title: 'Monthly Internships',
    chartType: 'bar',
    module: 'internships',
    scope: 'module',
    requiredModules: ['internships'],
    build: (aggregation) =>
      buildMonthlyTrendChart(
        'monthly-internships',
        'Monthly Internships',
        'internships',
        'bar',
        aggregation,
      ),
  },
  'student-achievement-trends': {
    id: 'student-achievement-trends',
    title: 'Student Achievement Trends',
    chartType: 'line',
    module: 'studentAchievements',
    scope: 'module',
    requiredModules: ['studentAchievements'],
    build: (aggregation) =>
      buildMonthlyTrendChart(
        'student-achievement-trends',
        'Student Achievement Trends',
        'studentAchievements',
        'line',
        aggregation,
      ),
  },
  'faculty-achievement-trends': {
    id: 'faculty-achievement-trends',
    title: 'Faculty Achievement Trends',
    chartType: 'area',
    module: 'facultyAchievements',
    scope: 'module',
    requiredModules: ['facultyAchievements'],
    build: (aggregation) =>
      buildMonthlyTrendChart(
        'faculty-achievement-trends',
        'Faculty Achievement Trends',
        'facultyAchievements',
        'area',
        aggregation,
      ),
  },
  'publication-trends': {
    id: 'publication-trends',
    title: 'Publication Trends',
    chartType: 'line',
    module: 'publications',
    scope: 'module',
    requiredModules: ['publications'],
    build: (aggregation) =>
      buildMonthlyTrendChart(
        'publication-trends',
        'Publication Trends',
        'publications',
        'line',
        aggregation,
      ),
  },
  'patent-trends': {
    id: 'patent-trends',
    title: 'Patent Trends',
    chartType: 'line',
    module: 'patents',
    scope: 'module',
    requiredModules: ['patents'],
    build: (aggregation) =>
      buildMonthlyTrendChart('patent-trends', 'Patent Trends', 'patents', 'line', aggregation),
  },
  'completed-event-statistics': {
    id: 'completed-event-statistics',
    title: 'Completed Event Statistics',
    chartType: 'bar',
    module: 'completedEventReports',
    scope: 'module',
    requiredModules: ['completedEventReports'],
    build: buildCompletedEventStatisticsChart,
  },
  'department-wise-distribution': {
    id: 'department-wise-distribution',
    title: 'Department-wise Distribution',
    chartType: 'bar',
    scope: 'institutional',
    build: (aggregation) => buildDepartmentDistributionChart(aggregation, resolveModules(aggregation)),
  },
  'category-wise-distribution': {
    id: 'category-wise-distribution',
    title: 'Category-wise Distribution',
    chartType: 'doughnut',
    scope: 'institutional',
    build: (aggregation) => buildCategoryDistributionChart(aggregation, resolveModules(aggregation)),
  },
  'pending-vs-approved-records': {
    id: 'pending-vs-approved-records',
    title: 'Pending vs Approved Records',
    chartType: 'pie',
    scope: 'institutional',
    build: buildPendingVsApprovedChart,
  },
  'yearly-growth-analysis': {
    id: 'yearly-growth-analysis',
    title: 'Yearly Growth Analysis',
    chartType: 'bar',
    scope: 'institutional',
    build: (aggregation) => buildYearlyGrowthChart(aggregation, resolveModules(aggregation)),
  },
};

export const listChartDefinitions = (): ChartDefinition[] => Object.values(CHART_DEFINITIONS);
