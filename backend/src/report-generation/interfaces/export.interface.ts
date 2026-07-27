import { ReportExportFormat } from './report-generation.interface';
import { ReportDocumentDraft, ReportPipelineContext } from './report-data.interface';

export type ReportExportStatus = 'not_implemented' | 'completed' | 'failed';

/** Export request — DOCX generation uses pipelineContext when provided */
export interface ReportExportRequest {
  document: ReportDocumentDraft;
  format: ReportExportFormat;
  fileName?: string;
  pipelineContext?: ReportPipelineContext;
}

export interface ReportExportResult {
  format: ReportExportFormat;
  status: ReportExportStatus;
  message: string;
  plannedFileName?: string;
  fileName?: string;
  downloadUrl?: string;
  filePath?: string;
  fileSizeBytes?: number;
  sectionsIncluded?: string[];
}
