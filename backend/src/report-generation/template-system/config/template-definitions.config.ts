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
  Placement: createTemplate('Placement', {
    description: 'Department placement statistics and company-wise outcomes report template.',
    header: 'Placement Report',
  }),
  Internship: createTemplate('Internship', {
    description: 'Internship participation and organization-wise summary report template.',
    header: 'Internship Report',
  }),
  'Student Achievement': createTemplate('Student Achievement', {
    description: 'Student awards, competitions, and extracurricular achievement report template.',
    header: 'Student Achievement Report',
  }),
  'Faculty Achievement': createTemplate('Faculty Achievement', {
    description: 'Faculty awards, certifications, and professional milestone report template.',
    header: 'Faculty Achievement Report',
  }),
  Publication: createTemplate('Publication', {
    description: 'Faculty and student publication index report template.',
    header: 'Publication Report',
  }),
  Patent: createTemplate('Patent', {
    description: 'Patent filings, grants, and intellectual property portfolio report template.',
    header: 'Patent Report',
  }),
  'Completed Event': createTemplate('Completed Event', {
    description: 'Workshops, seminars, FDPs, and institutional event outcomes report template.',
    header: 'Completed Event Report',
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
  const accrediassistLogoPath =
    process.env.ACCREDIASSIST_LOGO_PATH ??
    (fs.existsSync(defaultAccrediLogo) ? defaultAccrediLogo : undefined);

  return {
    collegeName: process.env.INSTITUTION_COLLEGE_NAME ?? 'AccrediAssist Institution',
    department: process.env.INSTITUTION_DEPARTMENT_NAME ?? 'All Departments',
    address: process.env.INSTITUTION_ADDRESS ?? '',
    collegeLogoPath: collegeLogoPath && fs.existsSync(collegeLogoPath) ? collegeLogoPath : undefined,
    accrediassistLogoPath,
    exportsDirectory,
  };
};
