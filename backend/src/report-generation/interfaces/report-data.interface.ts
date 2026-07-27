import { GenerationReportType } from '../config/report-types.config';
import { ReportGenerationFilters } from './report-generation.interface';

/** Normalized dataset collected from MongoDB collections */
export interface CollectedReportData {
  reportType: GenerationReportType;
  filters: ReportGenerationFilters;
  collectedAt: Date;
  sections: ReportDataSection[];
  totals: ReportDataTotals;
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
  keyHighlights: string[];
  recommendations: string[];
  model?: string;
  generatedAt: Date;
}

export interface PreparedChart {
  id: string;
  title: string;
  chartType: 'bar' | 'line' | 'pie' | 'area' | 'table';
  labels: string[];
  datasets: Array<{ label: string; data: number[] }>;
}

/** In-memory document structure — not persisted as PDF/DOCX yet */
export interface ReportDocumentDraft {
  title: string;
  sections: Array<{ heading: string; body: string; chartIds?: string[] }>;
  metadata: Record<string, string | number>;
}
