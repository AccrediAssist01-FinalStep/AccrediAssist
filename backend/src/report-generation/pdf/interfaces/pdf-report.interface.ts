import type { GenerationReportType } from '../../config/report-types.config';
import type { ReportGenerationFilters } from '../../interfaces/report-generation.interface';
import type {
  CollectedReportData,
  PreparedChart,
  ReportAiSummary,
} from '../../interfaces/report-data.interface';

export interface PdfInstitutionConfig {
  collegeName: string;
  departmentName: string;
  accrediassistLogoPath?: string;
  collegeLogoPath?: string;
  exportsDirectory: string;
}

export interface PdfLayoutConfig {
  pageWidth: number;
  pageHeight: number;
  margin: number;
  headerHeight: number;
  footerHeight: number;
}

export interface PdfReportInput {
  reportType: GenerationReportType;
  title: string;
  filters: ReportGenerationFilters;
  aiSummary?: ReportAiSummary;
  charts?: PreparedChart[];
  collectedData?: CollectedReportData;
  generatedAt: Date;
}

export interface PdfGenerationResult {
  buffer: Buffer;
  fileName: string;
  filePath: string;
  downloadUrl: string;
  fileSizeBytes: number;
  sectionsIncluded: string[];
  pageCount: number;
  generatedAt: Date;
}

export interface PdfEventImage {
  eventTitle: string;
  url: string;
  buffer: Buffer;
  width: number;
  height: number;
}

export interface PdfLayoutState {
  y: number;
  pageNumber: number;
}

export interface TocEntry {
  title: string;
  page: number;
}
