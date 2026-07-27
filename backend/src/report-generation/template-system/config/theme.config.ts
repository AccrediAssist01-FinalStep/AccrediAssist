import type { ReportTemplateSection, ReportTemplateSectionKey, ReportTemplateTheme } from '../interfaces/report-template.interface';

/** Institutional theme — suitable for accreditation and management review printing */
export const INSTITUTIONAL_THEME: ReportTemplateTheme = {
  primaryColor: '#1F3864',
  secondaryColor: '#666666',
  accentColor: '#2E75B6',
  textColor: '#333333',
  fontFamily: 'Calibri',
  headingFontFamily: 'Calibri',
  bodyFontSize: 11,
  headingFontSize: 16,
  subheadingFontSize: 13,
  lineSpacing: 1.25,
  marginInches: 1,
};

export const DEFAULT_SECTIONS: Array<{ key: ReportTemplateSectionKey; title: string }> = [
  { key: 'cover', title: 'Cover Page' },
  { key: 'table-of-contents', title: 'Table of Contents' },
  { key: 'executive-summary', title: 'Executive Summary' },
  { key: 'statistics', title: 'Statistics' },
  { key: 'charts', title: 'Charts' },
  { key: 'tables', title: 'Detailed Tables' },
  { key: 'images', title: 'Event Images' },
  { key: 'recommendations', title: 'Recommendations' },
  { key: 'appendix', title: 'Appendix' },
];

export const buildDefaultSections = (
  disabled: ReportTemplateSectionKey[] = [],
): ReportTemplateSection[] =>
  DEFAULT_SECTIONS.map((section, index) => ({
    key: section.key,
    title: section.title,
    enabled: !disabled.includes(section.key),
    order: index + 1,
  }));

export const DEFAULT_HEADER_TEXT = 'AccrediAssist Institutional Report';
export const DEFAULT_FOOTER_TEXT = 'Confidential — For Institutional Use Only';
