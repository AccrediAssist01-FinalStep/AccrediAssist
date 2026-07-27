/** Supported data modules for report aggregation */
export const AGGREGATION_MODULE_KEYS = [
  'studentAchievements',
  'facultyAchievements',
  'placements',
  'internships',
  'publications',
  'patents',
  'completedEventReports',
  'pendingReviews',
] as const;

export type AggregationModuleKey = (typeof AGGREGATION_MODULE_KEYS)[number];

/** Reusable filters applied across all aggregation modules */
export interface AggregationFilters {
  department?: string;
  academicYear?: string;
  semester?: 1 | 2;
  startDate?: Date;
  endDate?: Date;
  category?: string;
  faculty?: string;
  student?: string;
  /** Limit aggregation to specific modules (defaults to all) */
  modules?: AggregationModuleKey[];
}

export interface ResolvedDateRange {
  start?: Date;
  end?: Date;
  previousStart?: Date;
  previousEnd?: Date;
  label?: string;
}

export interface CountBucket {
  label: string;
  count: number;
}

export interface MonthlyCountBucket {
  year: number;
  month: number;
  period: string;
  count: number;
}

export interface YearlyCountBucket {
  year: number;
  count: number;
}

export interface PerformerBucket {
  name: string;
  count: number;
}

export interface ModuleStatistics {
  module: AggregationModuleKey;
  label: string;
  totalCount: number;
  monthlyCount: MonthlyCountBucket[];
  yearlyCount: YearlyCountBucket[];
  departmentWiseCount: CountBucket[];
  categoryWiseCount: CountBucket[];
  topPerformers: PerformerBucket[];
  latestRecords: Record<string, unknown>[];
  growthPercentage: number | null;
  previousPeriodCount: number;
}

export interface ModuleChartData {
  monthlyTrend: { labels: string[]; data: number[] };
  yearlyTrend: { labels: string[]; data: number[] };
  departmentBreakdown: { labels: string[]; data: number[] };
  categoryBreakdown: { labels: string[]; data: number[] };
  topPerformers: { labels: string[]; data: number[] };
}

export interface ReportAggregationMetadata {
  generatedAt: string;
  filters: AggregationFilters;
  resolvedDateRange: ResolvedDateRange;
  modules: AggregationModuleKey[];
  queryDurationMs: number;
}

export interface ReportAggregationStatistics {
  overall: {
    totalRecords: number;
    moduleTotals: Record<AggregationModuleKey, number>;
    growthPercentage: number | null;
  };
  byModule: Partial<Record<AggregationModuleKey, ModuleStatistics>>;
}

export interface ReportAggregationCharts {
  byModule: Partial<Record<AggregationModuleKey, ModuleChartData>>;
}

export interface ReportAggregationRecords {
  byModule: Partial<Record<AggregationModuleKey, Record<string, unknown>[]>>;
}

export interface ReportAggregationSummary {
  highlights: string[];
  topDepartments: CountBucket[];
  topCategories: CountBucket[];
  moduleCount: number;
}

/** Standardized aggregation output consumed by report generation pipeline */
export interface ReportAggregationResult {
  metadata: ReportAggregationMetadata;
  statistics: ReportAggregationStatistics;
  charts: ReportAggregationCharts;
  records: ReportAggregationRecords;
  summary: ReportAggregationSummary;
}

export interface ModuleAggregationConfig {
  key: AggregationModuleKey;
  label: string;
  collection: string;
  dateField: string;
  departmentField?: string;
  categoryField?: string;
  facultyField?: string;
  studentField?: string;
  performerField?: string;
  performerLabel: string;
  statsOnly: boolean;
  latestLimit: number;
  topLimit: number;
  latestFields: Record<string, 1 | 0 | string>;
}
