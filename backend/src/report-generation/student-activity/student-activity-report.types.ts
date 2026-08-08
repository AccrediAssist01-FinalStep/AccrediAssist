import type { ReportGenerationFilters } from '../interfaces/report-generation.interface';

export interface StudentActivityModuleRow {
  studentName: string;
  type: string;
  title: string;
  organization: string;
  date: string;
  sortDate: number;
}

export interface StudentActivityModuleTable {
  moduleNumber: number;
  heading: string;
  sectionKey: string;
  rows: StudentActivityModuleRow[];
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
