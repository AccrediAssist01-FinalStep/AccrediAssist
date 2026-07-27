import type { GenerationReportType } from '../../config/report-types.config';
import type { ReportGenerationFilters } from '../../interfaces/report-generation.interface';
import type {
  CollectedReportData,
  PreparedChart,
  ReportAiSummary,
} from '../../interfaces/report-data.interface';

export interface DocxInstitutionConfig {
  collegeName: string;
  departmentName: string;
  logoPath?: string;
  exportsDirectory: string;
}

export interface DocxTypographyConfig {
  fontFamily: string;
  titleSize: number;
  heading1Size: number;
  heading2Size: number;
  bodySize: number;
  lineSpacing: number;
}

export interface DocxPageConfig {
  marginTopTwips: number;
  marginBottomTwips: number;
  marginLeftTwips: number;
  marginRightTwips: number;
}

export interface DocxReportInput {
  reportType: GenerationReportType;
  title: string;
  filters: ReportGenerationFilters;
  aiSummary?: ReportAiSummary;
  charts?: PreparedChart[];
  collectedData?: CollectedReportData;
  generatedAt: Date;
}

export interface DocxGenerationResult {
  buffer: Buffer;
  fileName: string;
  filePath: string;
  downloadUrl: string;
  fileSizeBytes: number;
  sectionsIncluded: string[];
  generatedAt: Date;
}

export interface EventImageAsset {
  eventTitle: string;
  url: string;
  buffer?: Buffer;
  imageType?: 'png' | 'jpg' | 'gif' | 'bmp';
  width?: number;
  height?: number;
}

export interface DocxTableSpec {
  headers: string[];
  rows: string[][];
}
