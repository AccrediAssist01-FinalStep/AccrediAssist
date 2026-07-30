import fs from 'fs';
import path from 'path';
import { getGenerationReportTypeDefinition } from '../../config/report-types.config';
import type { GenerationReportType } from '../../config/report-types.config';
import type { ReportTemplateDefinition } from '../interfaces/report-template.interface';
import {
  DEFAULT_FOOTER_TEXT,
  DEFAULT_HEADER_TEXT,
  INSTITUTIONAL_THEME,
  buildDefaultSections,
} from './theme.config';

const createTemplate = (
  reportType: GenerationReportType,
  options: {
    description: string;
    header?: string;
    footer?: string;
    watermark?: string;
    showWatermark?: boolean;
    disabledSections?: ReportTemplateDefinition['sections'][number]['key'][];
  },
): ReportTemplateDefinition => {
  const definition = getGenerationReportTypeDefinition(reportType);

  return {
    templateId: definition.templateId,
    reportType,
    label: definition.label,
    category: definition.category,
    version: 'v1',
    description: options.description,
    sections: buildDefaultSections(options.disabledSections),
    theme: { ...INSTITUTIONAL_THEME },
    defaultLayout: {
      header: options.header ?? DEFAULT_HEADER_TEXT,
      footer: options.footer ?? DEFAULT_FOOTER_TEXT,
      watermark: options.watermark,
      showWatermark: options.showWatermark ?? false,
    },
  };
};

export const REPORT_TEMPLATE_DEFINITIONS: Record<GenerationReportType, ReportTemplateDefinition> = {
  'Student Activities': createTemplate('Student Activities', {
    description: 'Student activity repository with sectioned tables, charts, and executive summary.',
    header: 'Student Activities Report',
  }),
  'Faculty Activities': createTemplate('Faculty Activities', {
    description: 'Faculty professional activity report with modular tables and analytics.',
    header: 'Faculty Activities Report',
  }),
  'Department Activities': createTemplate('Department Activities', {
    description: 'Department-wide events, achievements, and accreditation activity report.',
    header: 'Department Activities Report',
  }),
  NBA: createTemplate('NBA', {
    description: 'NBA accreditation report template with outcomes, placements, and research sections.',
    header: 'NBA Accreditation Report',
    watermark: 'NBA',
    showWatermark: false,
  }),
  NAAC: createTemplate('NAAC', {
    description: 'NAAC accreditation criteria and institutional performance report template.',
    header: 'NAAC Accreditation Report',
    watermark: 'NAAC',
    showWatermark: false,
  }),
  AICTE: createTemplate('AICTE', {
    description: 'AICTE regulatory compliance and academic quality documentation template.',
    header: 'AICTE Documentation Report',
    watermark: 'AICTE',
    showWatermark: false,
  }),
  'AI Generated Workshop': createTemplate('AI Generated Workshop', {
    description: 'AI-assisted workshop report with event analytics and executive summary.',
    header: 'AI Generated Workshop Report',
  }),
  'AI Generated Industrial Visit': createTemplate('AI Generated Industrial Visit', {
    description: 'AI-assisted industrial visit report with participation metrics and summary.',
    header: 'AI Generated Industrial Visit Report',
  }),
};

export const getReportTemplateDefinition = (
  reportType: GenerationReportType,
): ReportTemplateDefinition => REPORT_TEMPLATE_DEFINITIONS[reportType];

export const listReportTemplateDefinitions = (): ReportTemplateDefinition[] =>
  Object.values(REPORT_TEMPLATE_DEFINITIONS);

export const getInstitutionDefaultsFromEnv = () => {
  const exportsDirectory =
    process.env.REPORT_EXPORTS_PATH ??
    path.join(process.cwd(), 'exports', 'reports');

  const defaultAccrediLogo = path.join(
    __dirname,
    '..',
    '..',
    'docx',
    'assets',
    'accrediassist-logo.png',
  );

  const collegeLogoPath = process.env.INSTITUTION_COLLEGE_LOGO_PATH ?? process.env.INSTITUTION_LOGO_PATH;
  const departmentLogoPath = process.env.INSTITUTION_DEPARTMENT_LOGO_PATH;
  const accrediassistLogoPath =
    process.env.ACCREDIASSIST_LOGO_PATH ??
    (fs.existsSync(defaultAccrediLogo) ? defaultAccrediLogo : undefined);

  return {
    collegeName: process.env.INSTITUTION_COLLEGE_NAME ?? 'AccrediAssist Institution',
    department: process.env.INSTITUTION_DEPARTMENT_NAME ?? 'All Departments',
    address: process.env.INSTITUTION_ADDRESS ?? '',
    collegeLogoPath: collegeLogoPath && fs.existsSync(collegeLogoPath) ? collegeLogoPath : undefined,
    departmentLogoPath:
      departmentLogoPath && fs.existsSync(departmentLogoPath) ? departmentLogoPath : undefined,
    accrediassistLogoPath,
    exportsDirectory,
  };
};
