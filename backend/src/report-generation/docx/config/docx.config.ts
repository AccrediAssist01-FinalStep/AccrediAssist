import fs from 'fs';
import path from 'path';
import type {
  DocxInstitutionConfig,
  DocxPageConfig,
  DocxTypographyConfig,
} from '../interfaces/docx-report.interface';

const TWIPS_PER_INCH = 1440;

export const DOCX_TYPOGRAPHY: DocxTypographyConfig = {
  fontFamily: 'Calibri',
  titleSize: 32,
  heading1Size: 28,
  heading2Size: 24,
  bodySize: 22,
  lineSpacing: 276,
};

export const DOCX_PAGE: DocxPageConfig = {
  marginTopTwips: Math.round(TWIPS_PER_INCH * 1),
  marginBottomTwips: Math.round(TWIPS_PER_INCH * 1),
  marginLeftTwips: Math.round(TWIPS_PER_INCH * 1),
  marginRightTwips: Math.round(TWIPS_PER_INCH * 1),
};

export const getDocxInstitutionConfig = (): DocxInstitutionConfig => {
  const exportsDirectory =
    process.env.REPORT_EXPORTS_PATH ??
    path.join(process.cwd(), 'exports', 'reports');

  const defaultLogo = path.join(__dirname, '..', 'assets', 'accrediassist-logo.png');
  const logoPath = process.env.INSTITUTION_LOGO_PATH ?? (fs.existsSync(defaultLogo) ? defaultLogo : undefined);

  return {
    collegeName: process.env.INSTITUTION_COLLEGE_NAME ?? 'AccrediAssist Institution',
    departmentName: process.env.INSTITUTION_DEPARTMENT_NAME ?? 'All Departments',
    logoPath,
    exportsDirectory,
  };
};

export const REPORT_SECTION_ORDER = [
  'cover',
  'table-of-contents',
  'executive-summary',
  'key-highlights',
  'statistics',
  'charts',
  'detailed-tables',
  'images',
  'recommendations',
  'appendix',
] as const;

export type ReportSectionKey = (typeof REPORT_SECTION_ORDER)[number];
