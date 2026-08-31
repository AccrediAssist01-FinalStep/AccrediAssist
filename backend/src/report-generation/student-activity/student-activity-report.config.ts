import path from 'path';
import type { TemplateReportConfig } from '../template-activity-report/template-activity-report.types';
import { STANDARD_TEMPLATE_COLUMN_WEIGHTS } from '../template-activity-report/utils/template-table.util';
import { TEMPLATE_FALLBACK_CONCLUSION, TEMPLATE_FALLBACK_INTRODUCTION } from './student-activity-report-template.config';
import { getStudentModuleReportDefinition } from './config/student-module-reports.config';

export const STUDENT_ACTIVITY_TABLE_HEADERS = [
  'Student Name',
  'Type',
  'Title',
  'Organization',
  'Date',
] as const;

export const STUDENT_MODULE_NUMBER_BY_KEY: Record<string, number> = {
  sports: 1,
  cultural: 2,
  technical: 3,
  research: 4,
  internships: 5,
  placements: 6,
  certifications: 7,
  workshops: 8,
  seminars: 9,
  'industrial-visits': 10,
  'startup-innovation': 11,
  'nss-ncc': 12,
  'sponsored-projects': 13,
};

export const STUDENT_MODULE_LABEL_BY_KEY: Record<string, string> = {
  sports: 'Sports',
  cultural: 'Cultural',
  technical: 'Technical',
  research: 'Research',
  internships: 'Internship',
  placements: 'Placement',
  certifications: 'Certification',
  workshops: 'Workshop',
  seminars: 'Seminar',
  'industrial-visits': 'Industrial Visit',
  'startup-innovation': 'Startup & Innovation',
  'nss-ncc': 'HSS / NCC',
  'sponsored-projects': 'Sponsored Projects',
};

export const STUDENT_ACTIVITY_REPORT_CONFIG: TemplateReportConfig = {
  reportTitle: 'STUDENT ACHIEVEMENT REPORT',
  sectionOrder: ['cover', 'introduction', 'modules', 'conclusion'],
  tableHeaders: STUDENT_ACTIVITY_TABLE_HEADERS,
  columnWeights: STANDARD_TEMPLATE_COLUMN_WEIGHTS,
  fileNamePrefix: 'Student-Achievement-Report',
  narrative: {
    promptsDir: path.join(__dirname, 'templates'),
    fallbackIntroduction: TEMPLATE_FALLBACK_INTRODUCTION,
    fallbackConclusion: TEMPLATE_FALLBACK_CONCLUSION,
    introTailoring: ({ department, academicYear, totalRecords, activeModules, modules }) => {
      if (modules.length === 1) {
        const moduleName = modules[0]?.heading ?? 'this module';
        return `The following report presents only ${moduleName} records for ${department} during academic year ${academicYear}. A total of ${totalRecords} approved record(s) belonging to this module are documented. Tables list the fields stored for this activity type. Factual details are taken from the institutional repository; names, dates, organizations, awards, and amounts are not inferred.`;
      }

      return `The following report presents student achievements across all identified modules for ${department} during academic year ${academicYear}. A total of ${totalRecords} approved record(s) are documented across ${activeModules} active module(s). Each module table includes the student name, type of achievement, title, organization, and date in the institutional format.`;
    },
  },
  resolvePresentation: (filters) => {
    const moduleDefinition = getStudentModuleReportDefinition(filters.studentModule);
    if (!moduleDefinition) return {};
    return {
      reportTitle: moduleDefinition.reportTitle,
      fileNamePrefix: moduleDefinition.fileNamePrefix,
    };
  },
};
