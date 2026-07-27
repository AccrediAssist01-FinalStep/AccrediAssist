import { GenerationReportType } from '../config/report-types.config';
import type { ReportAggregationResult } from '../aggregation/interfaces/aggregation.interface';
import { ReportGenerationFilters } from './report-generation.interface';

/** Normalized dataset collected from MongoDB collections */
export interface CollectedReportData {
  reportType: GenerationReportType;
  filters: ReportGenerationFilters;
  collectedAt: Date;
  sections: ReportDataSection[];
  totals: ReportDataTotals;
  /** Full aggregation payload from the data aggregation engine */
  aggregation?: ReportAggregationResult;
}

export interface ReportDataSection {
  key: string;
  label: string;
  collection: string;
  recordCount: number;
  records: Record<string, unknown>[];
}

export interface ReportDataTotals {
  placements?: number;
  internships?: number;
  studentAchievements?: number;
  facultyAchievements?: number;
  publications?: number;
  patents?: number;
  completedEvents?: number;
  pendingReviews?: number;
}

/** Input passed between pipeline stages */
export interface ReportPipelineContext {
  reportType: GenerationReportType;
  filters: ReportGenerationFilters;
  collectedData?: CollectedReportData;
  aiSummary?: ReportAiSummary;
  charts?: PreparedChart[];
  documentDraft?: ReportDocumentDraft;
}

export interface ReportAiSummary {
  executiveSummary: string;
  strengths: string[];
  observations: string[];
  recommendations: string[];
  keyHighlights: string[];
  model?: string;
  generatedAt: Date;
  source: 'gemini' | 'fallback';
}

export interface PreparedChart {
  id: string;
  title: string;
  chartType: 'bar' | 'line' | 'pie' | 'doughnut' | 'area' | 'table';
  labels: string[];
  datasets: Array<{ label: string; data: number[] }>;
  metadata?: {
    id: string;
    title: string;
    module?: string;
    source: 'aggregation';
    filters?: Record<string, unknown>;
    period?: string;
    exportFormats: Array<'pdf' | 'docx' | 'frontend'>;
    generatedAt: string;
    totalRecords?: number;
  };
}

/** In-memory document structure — not persisted as PDF/DOCX yet */
export interface ReportDocumentDraft {
  title: string;
  sections: Array<{ heading: string; body: string; chartIds?: string[] }>;
  metadata: Record<string, string | number>;
}
