import type { ReportGenerationFilters } from '../interfaces/report-generation.interface';

export interface TemplateModuleTable {
  moduleNumber: number;
  heading: string;
  sectionKey: string;
  rows: string[][];
}

export interface TemplateActivityReportContent {
  reportTitle: string;
  department: string;
  academicYear: string;
  tableHeaders: readonly string[];
  columnWeights: readonly number[];
  introduction: string[];
  conclusion: string[];
  modules: TemplateModuleTable[];
  totalRecords: number;
  narrativeSource: 'gemini' | 'fallback';
}

export interface TemplateActivityReportInput {
  content: TemplateActivityReportContent;
  filters: ReportGenerationFilters;
  generatedAt: Date;
}

export interface TemplateActivityReportExportResult {
  pdfBuffer?: Buffer;
  pdfFileName: string;
  pdfFilePath?: string;
  pdfUrl?: string;
  docxBuffer?: Buffer;
  docxFileName: string;
  docxFilePath?: string;
  docxUrl?: string;
}

export interface TemplateNarrativeConfig {
  promptsDir: string;
  fallbackIntroduction: readonly string[];
  fallbackConclusion: readonly string[];
  introTailoring: (params: {
    modules: TemplateModuleTable[];
    academicYear: string;
    department: string;
    totalRecords: number;
    activeModules: number;
  }) => string;
}

export interface TemplateReportConfig {
  reportTitle: string;
  sectionOrder: readonly string[];
  tableHeaders: readonly string[];
  columnWeights: readonly number[];
  fileNamePrefix: string;
  narrative: TemplateNarrativeConfig;
}
