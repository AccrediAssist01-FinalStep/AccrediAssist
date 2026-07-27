import type { AggregationModuleKey } from '../../aggregation/interfaces/aggregation.interface';
import type { ReportAggregationResult } from '../../aggregation/interfaces/aggregation.interface';
import type { ChartType, StandardChart } from './chart.interface';

/** Canonical chart identifiers for the analytics engine */
export const CHART_DEFINITION_IDS = [
  'monthly-placements',
  'monthly-internships',
  'student-achievement-trends',
  'faculty-achievement-trends',
  'publication-trends',
  'patent-trends',
  'completed-event-statistics',
  'department-wise-distribution',
  'category-wise-distribution',
  'pending-vs-approved-records',
  'yearly-growth-analysis',
] as const;

export type ChartDefinitionId = (typeof CHART_DEFINITION_IDS)[number];

export interface ChartDefinition {
  id: ChartDefinitionId;
  title: string;
  chartType: ChartType;
  module?: AggregationModuleKey;
  scope: 'module' | 'institutional';
  /** Modules required for this chart to be included in report-scoped generation */
  requiredModules?: AggregationModuleKey[];
  build: (aggregation: ReportAggregationResult) => StandardChart | null;
}
