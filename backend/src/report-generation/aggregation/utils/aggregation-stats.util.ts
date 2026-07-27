import type {
  CountBucket,
  ModuleChartData,
  ModuleStatistics,
  MonthlyCountBucket,
  PerformerBucket,
  YearlyCountBucket,
} from '../interfaces/aggregation.interface';
import { formatMonthPeriod } from './aggregation-date.util';

export const extractFacetCount = (rows: Array<{ count?: number }>): number => rows[0]?.count ?? 0;

export const calculateGrowthPercentage = (
  current: number,
  previous: number,
): number | null => {
  if (previous === 0) {
    return current > 0 ? 100 : null;
  }
  return Number((((current - previous) / previous) * 100).toFixed(2));
};

export const mapMonthlyBuckets = (
  rows: Array<{ _id: { year: number; month: number }; count: number }>,
): MonthlyCountBucket[] =>
  rows.map((row) => ({
    year: row._id.year,
    month: row._id.month,
    period: formatMonthPeriod(row._id.year, row._id.month),
    count: row.count,
  }));

export const mapYearlyBuckets = (
  rows: Array<{ _id: number; count: number }>,
): YearlyCountBucket[] =>
  rows.map((row) => ({
    year: row._id,
    count: row.count,
  }));

export const mapLabelCountBuckets = (
  rows: Array<{ _id: string | null; count: number }>,
  unknownLabel = 'Unknown',
): CountBucket[] =>
  rows
    .map((row) => ({
      label: row._id?.trim() || unknownLabel,
      count: row.count,
    }))
    .sort((a, b) => b.count - a.count);

export const mapPerformerBuckets = (
  rows: Array<{ _id: string | null; count: number }>,
): PerformerBucket[] =>
  rows
    .map((row) => ({
      name: row._id?.trim() || 'Unknown',
      count: row.count,
    }))
    .filter((row) => row.name !== 'Unknown' || row.count > 0);

export const toModuleChartData = (stats: ModuleStatistics): ModuleChartData => ({
  monthlyTrend: {
    labels: stats.monthlyCount.map((item) => item.period),
    data: stats.monthlyCount.map((item) => item.count),
  },
  yearlyTrend: {
    labels: stats.yearlyCount.map((item) => String(item.year)),
    data: stats.yearlyCount.map((item) => item.count),
  },
  departmentBreakdown: {
    labels: stats.departmentWiseCount.map((item) => item.label),
    data: stats.departmentWiseCount.map((item) => item.count),
  },
  categoryBreakdown: {
    labels: stats.categoryWiseCount.map((item) => item.label),
    data: stats.categoryWiseCount.map((item) => item.count),
  },
  topPerformers: {
    labels: stats.topPerformers.map((item) => item.name),
    data: stats.topPerformers.map((item) => item.count),
  },
});

export const mergeTopBuckets = (
  modules: ModuleStatistics[],
  pick: (stats: ModuleStatistics) => CountBucket[],
  limit = 5,
): CountBucket[] => {
  const totals = new Map<string, number>();

  for (const moduleStats of modules) {
    for (const bucket of pick(moduleStats)) {
      totals.set(bucket.label, (totals.get(bucket.label) ?? 0) + bucket.count);
    }
  }

  return [...totals.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
};

export const buildSummaryHighlights = (
  moduleStats: ModuleStatistics[],
  overallTotal: number,
): string[] => {
  const highlights: string[] = [`${overallTotal} total records aggregated across ${moduleStats.length} modules.`];

  const topModule = [...moduleStats].sort((a, b) => b.totalCount - a.totalCount)[0];
  if (topModule && topModule.totalCount > 0) {
    highlights.push(`${topModule.label} leads with ${topModule.totalCount} records.`);
  }

  const growthModules = moduleStats.filter((item) => item.growthPercentage !== null && item.growthPercentage > 0);
  if (growthModules.length > 0) {
    highlights.push(`${growthModules.length} module(s) show positive period-over-period growth.`);
  }

  return highlights;
};
