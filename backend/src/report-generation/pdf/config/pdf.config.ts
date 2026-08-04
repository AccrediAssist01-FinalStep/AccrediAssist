import fs from 'fs';
import path from 'path';
import type { PdfInstitutionConfig, PdfLayoutConfig } from '../interfaces/pdf-report.interface';

export const PDF_LAYOUT: PdfLayoutConfig = {
  pageWidth: 595.28,
  pageHeight: 841.89,
  margin: 50,
  headerHeight: 30,
  footerHeight: 30,
};

export const PDF_COLORS = {
  primary: '#1F3864',
  secondary: '#666666',
  border: '#CCCCCC',
  headerBg: '#1F3864',
  headerText: '#FFFFFF',
  chartBar: '#2E75B6',
  chartLine: '#1F3864',
  chartGrid: '#E8E8E8',
};

export const PDF_SECTION_ORDER = [
  'cover',
  'table-of-contents',
  'executive-summary',
  'key-highlights',
  'charts',
  'statistics',
  'tables',
  'images',
  'recommendations',
  'appendix',
] as const;

export const getPdfInstitutionConfig = (): PdfInstitutionConfig => {
  const exportsDirectory =
    process.env.REPORT_EXPORTS_PATH ??
    path.join(process.cwd(), 'exports', 'reports');

  const defaultAccrediLogo = path.join(__dirname, '..', 'assets', 'accrediassist-logo.png');
  const accrediassistLogoPath =
    process.env.ACCREDIASSIST_LOGO_PATH ??
    (fs.existsSync(defaultAccrediLogo) ? defaultAccrediLogo : undefined);

  const collegeLogoPath = process.env.INSTITUTION_COLLEGE_LOGO_PATH ?? process.env.INSTITUTION_LOGO_PATH;

  return {
    collegeName: process.env.INSTITUTION_COLLEGE_NAME ?? 'AccrediAssist Institution',
    departmentName: process.env.INSTITUTION_DEPARTMENT_NAME ?? 'All Departments',
    accrediassistLogoPath,
    collegeLogoPath: collegeLogoPath && fs.existsSync(collegeLogoPath) ? collegeLogoPath : undefined,
    exportsDirectory,
  };
};

export const getContentWidth = (): number =>
  PDF_LAYOUT.pageWidth - PDF_LAYOUT.margin * 2;

export const getLandscapeContentWidth = (): number =>
  PDF_LAYOUT.pageHeight - PDF_LAYOUT.margin * 2;

export const formatReportDate = (value: Date): string =>
  value.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
