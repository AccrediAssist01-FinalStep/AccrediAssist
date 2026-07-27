import type { AggregationModuleKey } from '../../aggregation/interfaces/aggregation.interface';

/** Supported chart visualization types */
export type ChartType = 'bar' | 'line' | 'pie' | 'doughnut' | 'area';

export type ChartExportFormat = 'pdf' | 'docx' | 'frontend';

export interface ChartDataset {
  label: string;
  data: number[];
}

export interface ChartMetadata {
  id: string;
  title: string;
  module?: AggregationModuleKey | 'institutional';
  source: 'aggregation';
  filters?: Record<string, unknown>;
  period?: string;
  exportFormats: ChartExportFormat[];
  generatedAt: string;
  totalRecords?: number;
}

/** Standardized chart JSON consumed by dashboard, PDF, DOCX, and report preview */
export interface StandardChart {
  chartType: ChartType;
  labels: string[];
  datasets: ChartDataset[];
  metadata: ChartMetadata;
}

export interface ChartGenerationResult {
  charts: StandardChart[];
  generatedAt: Date;
  fromCache: boolean;
}
