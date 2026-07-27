import { ReportExportFormat } from './report-generation.interface';
import { ReportDocumentDraft } from './report-data.interface';

/** Future export request — no binary generation implemented */
export interface ReportExportRequest {
  document: ReportDocumentDraft;
  format: ReportExportFormat;
  fileName?: string;
}

/** Placeholder export result */
export interface ReportExportResult {
  format: ReportExportFormat;
  status: 'not_implemented';
  message: string;
  plannedFileName?: string;
}
