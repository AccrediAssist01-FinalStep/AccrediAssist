import { GenerationReportType } from '../config/report-types.config';

/** Shared filter options for institutional report generation */
export interface ReportGenerationFilters {
  startDate?: Date;
  endDate?: Date;
  academicYear?: string;
  department?: string;
  semester?: 1 | 2;
  category?: string;
  status?: string;
  faculty?: string;
  student?: string;
  keyword?: string;
  month?: string;
  year?: number;
}

/** Lifecycle status for the generation pipeline (architecture only) */
export type ReportGenerationPipelineStatus =
  | 'idle'
  | 'collecting_data'
  | 'summarizing'
  | 'preparing_charts'
  | 'composing_document'
  | 'ready_for_export'
  | 'failed';

/** Request shape for future generation endpoints */
export interface ReportGenerationRequest {
  reportType: GenerationReportType;
  title?: string;
  filters?: ReportGenerationFilters;
  requestedBy: string;
}

/** High-level module status exposed via API */
export interface ReportGenerationModuleStatus {
  module: 'report-generation';
  version: string;
  ready: boolean;
  geminiConfigured: boolean;
  supportedReportTypes: GenerationReportType[];
  pipelineStages: ReportGenerationPipelineStage[];
  exportFormatsPlanned: ReportExportFormat[];
}

export type ReportGenerationPipelineStage =
  | 'data_collection'
  | 'ai_summary'
  | 'chart_preparation'
  | 'document_generation'
  | 'export';

export type ReportExportFormat = 'pdf' | 'docx';

/** Metadata returned for each supported report type */
export interface ReportTypeDefinition {
  id: GenerationReportType;
  label: string;
  description: string;
  category: 'accreditation' | 'operational' | 'achievement' | 'research';
  dataSources: string[];
  templateId: string;
  chartsIncluded: boolean;
  aiSummaryRequired: boolean;
}

/** Placeholder result from orchestrator — no file output yet */
export interface ReportGenerationPlan {
  reportType: GenerationReportType;
  title: string;
  filters: ReportGenerationFilters;
  pipeline: ReportGenerationPipelineStage[];
  status: 'architecture_only';
  message: string;
}
