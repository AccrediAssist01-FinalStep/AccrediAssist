import type { ReportGenerationFilters } from '../interfaces/report-generation.interface';

export interface StudentActivityModuleTable {
  moduleNumber: number;
  heading: string;
  sectionKey: string;
  headers: string[];
  rows: string[][];
}

export interface StudentActivityReportContent {
  reportTitle: string;
  department: string;
  academicYear: string;
  introduction: string[];
  conclusion: string[];
  modules: StudentActivityModuleTable[];
  totalRecords: number;
  narrativeSource: 'gemini' | 'fallback';
}

export interface StudentActivityReportGeneratorInput {
  content: StudentActivityReportContent;
  filters: ReportGenerationFilters;
  generatedAt: Date;
}

export interface StudentActivityReportExportResult {
  pdfBuffer?: Buffer;
  pdfFileName: string;
  pdfFilePath?: string;
  pdfUrl?: string;
  docxBuffer?: Buffer;
  docxFileName: string;
  docxFilePath?: string;
  docxUrl?: string;
}
