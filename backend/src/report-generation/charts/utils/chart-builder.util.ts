import type {
  AggregationModuleKey,
  ModuleStatistics,
  ReportAggregationResult,
} from '../../aggregation/interfaces/aggregation.interface';
import { mergeTopBuckets } from '../../aggregation/utils/aggregation-stats.util';
import type { ChartDataset, ChartExportFormat, ChartType, StandardChart } from '../interfaces/chart.interface';

const EXPORT_FORMATS: ChartExportFormat[] = ['pdf', 'docx', 'frontend'];

const buildMetadata = (
  id: string,
  title: string,
  aggregation: ReportAggregationResult,
  options: {
    module?: AggregationModuleKey | 'institutional';
    totalRecords?: number;
  } = {},
): StandardChart['metadata'] => ({
  id,
  title,
  module: options.module,
  source: 'aggregation',
  filters: aggregation.metadata.filters as Record<string, unknown>,
  period: aggregation.metadata.resolvedDateRange.label,
  exportFormats: EXPORT_FORMATS,
  generatedAt: aggregation.metadata.generatedAt,
  totalRecords: options.totalRecords,
});

const toSeries = (
  labels: string[],
  data: number[],
  label: string,
): ChartDataset[] => [{ label, data: labels.map((_, index) => data[index] ?? 0) }];

export const buildMonthlyTrendChart = (
  id: string,
  title: string,
  module: AggregationModuleKey,
  chartType: ChartType,
  aggregation: ReportAggregationResult,
): StandardChart | null => {
  const moduleChart = aggregation.charts.byModule[module];
  const stats = aggregation.statistics.byModule[module];
  if (!moduleChart || !stats) return null;

  const { labels, data } = moduleChart.monthlyTrend;

  return {
    chartType,
    labels,
    datasets: toSeries(labels, data, stats.label),
    metadata: buildMetadata(id, title, aggregation, {
      module,
      totalRecords: stats.totalCount,
    }),
  };
};

export const buildDepartmentDistributionChart = (
  aggregation: ReportAggregationResult,
  modules: AggregationModuleKey[],
): StandardChart | null => {
  const moduleStats = modules
    .map((key) => aggregation.statistics.byModule[key])
    .filter((stats): stats is ModuleStatistics => !!stats && stats.totalCount > 0);

  if (moduleStats.length === 0) return null;

  const buckets = mergeTopBuckets(moduleStats, (stats) => stats.departmentWiseCount, 15);
  if (buckets.length === 0) return null;

  return {
    chartType: 'bar',
    labels: buckets.map((item) => item.label),
    datasets: [{ label: 'Records by Department', data: buckets.map((item) => item.count) }],
    metadata: buildMetadata('department-wise-distribution', 'Department-wise Distribution', aggregation, {
      module: 'institutional',
      totalRecords: aggregation.statistics.overall.totalRecords,
    }),
  };
};

export const buildCategoryDistributionChart = (
  aggregation: ReportAggregationResult,
  modules: AggregationModuleKey[],
): StandardChart | null => {
  const moduleStats = modules
    .map((key) => aggregation.statistics.byModule[key])
    .filter((stats): stats is ModuleStatistics => !!stats && stats.totalCount > 0);

  if (moduleStats.length === 0) return null;

  const buckets = mergeTopBuckets(moduleStats, (stats) => stats.categoryWiseCount, 12);
  if (buckets.length === 0) return null;

  return {
    chartType: 'doughnut',
    labels: buckets.map((item) => item.label),
    datasets: [{ label: 'Records by Category', data: buckets.map((item) => item.count) }],
    metadata: buildMetadata('category-wise-distribution', 'Category-wise Distribution', aggregation, {
      module: 'institutional',
      totalRecords: aggregation.statistics.overall.totalRecords,
    }),
  };
};

export const buildPendingVsApprovedChart = (
  aggregation: ReportAggregationResult,
): StandardChart | null => {
  const pendingCount = aggregation.statistics.byModule.pendingReviews?.totalCount ?? 0;
  const approvedCount = Object.entries(aggregation.statistics.byModule).reduce((sum, [key, stats]) => {
    if (key === 'pendingReviews' || !stats) return sum;
    return sum + stats.totalCount;
  }, 0);

  if (pendingCount === 0 && approvedCount === 0) return null;

  return {
    chartType: 'pie',
    labels: ['Pending Review Records', 'Approved Institutional Records'],
    datasets: [{ label: 'Record Status', data: [pendingCount, approvedCount] }],
    metadata: buildMetadata('pending-vs-approved-records', 'Pending vs Approved Records', aggregation, {
      module: 'institutional',
      totalRecords: pendingCount + approvedCount,
    }),
  };
};

export const buildYearlyGrowthChart = (
  aggregation: ReportAggregationResult,
  modules: AggregationModuleKey[],
): StandardChart | null => {
  const entries = modules
    .map((key) => aggregation.statistics.byModule[key])
    .filter((stats): stats is ModuleStatistics => !!stats);

  if (entries.length === 0) return null;

  const labels = entries.map((stats) => stats.label);
  const growthData = entries.map((stats) => stats.growthPercentage ?? 0);
  const yearlyTotals = entries.map((stats) =>
    stats.yearlyCount.reduce((sum, bucket) => sum + bucket.count, 0),
  );

  return {
    chartType: 'bar',
    labels,
    datasets: [
      { label: 'Growth (%)', data: growthData },
      { label: 'Yearly Total', data: yearlyTotals },
    ],
    metadata: buildMetadata('yearly-growth-analysis', 'Yearly Growth Analysis', aggregation, {
      module: 'institutional',
      totalRecords: aggregation.statistics.overall.totalRecords,
    }),
  };
};

export const buildCompletedEventStatisticsChart = (
  aggregation: ReportAggregationResult,
): StandardChart | null => {
  const stats = aggregation.statistics.byModule.completedEventReports;
  const moduleChart = aggregation.charts.byModule.completedEventReports;
  if (!stats || !moduleChart) return null;

  const categoryLabels = moduleChart.categoryBreakdown.labels;
  const categoryData = moduleChart.categoryBreakdown.data;

  if (categoryLabels.length > 0) {
    return {
      chartType: 'bar',
      labels: categoryLabels,
      datasets: [{ label: 'Events by Type', data: categoryData }],
      metadata: buildMetadata(
        'completed-event-statistics',
        'Completed Event Statistics',
        aggregation,
        { module: 'completedEventReports', totalRecords: stats.totalCount },
      ),
    };
  }

  const { labels, data } = moduleChart.monthlyTrend;
  if (labels.length === 0) return null;

  return {
    chartType: 'bar',
    labels,
    datasets: [{ label: 'Completed Events', data }],
    metadata: buildMetadata(
      'completed-event-statistics',
      'Completed Event Statistics',
      aggregation,
      { module: 'completedEventReports', totalRecords: stats.totalCount },
    ),
  };
};
