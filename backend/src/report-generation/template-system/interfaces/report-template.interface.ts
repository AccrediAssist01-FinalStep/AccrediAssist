import type { GenerationReportType } from '../../config/report-types.config';

/** Canonical section keys shared across PDF, DOCX, and preview renderers */
export const REPORT_TEMPLATE_SECTION_KEYS = [
  'cover',
  'table-of-contents',
  'executive-summary',
  'statistics',
  'charts',
  'tables',
  'images',
  'recommendations',
  'appendix',
] as const;

export type ReportTemplateSectionKey = (typeof REPORT_TEMPLATE_SECTION_KEYS)[number];

export interface ReportTemplateBranding {
  collegeLogoPath?: string;
  accrediassistLogoPath?: string;
  collegeName: string;
  department: string;
  academicYear: string;
  address?: string;
  reportTitle: string;
}

export interface ReportTemplateLayout {
  header: string;
  footer: string;
  watermark?: string;
  showWatermark: boolean;
}

export interface ReportTemplateTheme {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  textColor: string;
  fontFamily: string;
  headingFontFamily: string;
  bodyFontSize: number;
  headingFontSize: number;
  subheadingFontSize: number;
  lineSpacing: number;
  marginInches: number;
}

export interface ReportTemplateSection {
  key: ReportTemplateSectionKey;
  title: string;
  enabled: boolean;
  order: number;
}

export interface ReportTemplateDefinition {
  templateId: string;
  reportType: GenerationReportType;
  label: string;
  category: 'accreditation' | 'operational' | 'achievement' | 'research';
  version: string;
  description: string;
  sections: ReportTemplateSection[];
  theme: ReportTemplateTheme;
  defaultLayout: ReportTemplateLayout;
}

export interface ReportTemplateOverrides {
  branding?: Partial<ReportTemplateBranding>;
  layout?: Partial<ReportTemplateLayout>;
  theme?: Partial<ReportTemplateTheme>;
  disabledSections?: ReportTemplateSectionKey[];
  reportTitle?: string;
}

export interface ReportTemplateBuildInput {
  reportType: GenerationReportType;
  overrides?: ReportTemplateOverrides;
  academicYear?: string;
  department?: string;
  reportTitle?: string;
}

/** Fully resolved template ready for document renderers */
export interface ResolvedReportTemplate {
  templateId: string;
  reportType: GenerationReportType;
  label: string;
  category: ReportTemplateDefinition['category'];
  version: string;
  description: string;
  branding: ReportTemplateBranding;
  layout: ReportTemplateLayout;
  theme: ReportTemplateTheme;
  sections: ReportTemplateSection[];
  enabledSectionKeys: ReportTemplateSectionKey[];
  generatedAt: Date;
}

export interface ReportTemplateListItem {
  templateId: string;
  reportType: GenerationReportType;
  label: string;
  category: ReportTemplateDefinition['category'];
  version: string;
  sectionCount: number;
}
