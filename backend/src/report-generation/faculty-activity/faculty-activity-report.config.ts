import path from 'path';

import type { TemplateReportConfig } from '../template-activity-report/template-activity-report.types';

import { STANDARD_TEMPLATE_COLUMN_WEIGHTS } from '../template-activity-report/utils/template-table.util';
import { getFacultyModuleReportDefinition } from './config/faculty-module-reports.config';

export const FACULTY_ACTIVITY_TABLE_HEADERS = [
  'Faculty Name',
  'Type',
  'Title',
  'Organization',
  'Date',
] as const;

export const FACULTY_MODULE_NUMBER_BY_KEY: Record<string, number> = {
  fdp: 1,
  workshops: 2,
  seminars: 3,
  conferences: 4,
  publications: 5,
  patents: 6,
  'book-chapters': 7,
  consultancy: 8,
  'sponsored-projects': 9,
  certifications: 10,
  awards: 11,
  'guest-lectures': 12,
  mous: 13,
  'resource-person': 14,
  'session-chair-reviewer': 15,
};

export const FACULTY_MODULE_LABEL_BY_KEY: Record<string, string> = {
  fdp: 'FDPs',
  workshops: 'Workshops Attended',
  seminars: 'Seminars Attended',
  conferences: 'Conferences',
  publications: 'Publications',
  patents: 'Patents',
  'book-chapters': 'Book Chapters',
  consultancy: 'Consultancy',
  'sponsored-projects': 'Sponsored Projects',
  certifications: 'Certifications',
  awards: 'Awards',
  'guest-lectures': 'Guest Lectures',
  mous: 'MoUs',
  'resource-person': 'Faculty as Resource Person',
  'session-chair-reviewer': 'Session Chair / Reviewer',
};

const FACULTY_FALLBACK_INTRO = [
  'Faculty achievements and professional activities are vital indicators of academic excellence, research contribution, and institutional development. The activities recorded across various modules reflect the active engagement of faculty members in sponsored research, scholarly publications, patents, and professional development workshops.',
  'The achievements include sponsored research projects, journal and conference publications, patents filed or granted, and workshops attended by faculty members. These accomplishments strengthen the academic profile of the department and support accreditation and quality enhancement initiatives.',
  'The following report presents faculty activities across all identified modules in a structured tabular format suitable for institutional documentation and review.',
];

const FACULTY_FALLBACK_CONCLUSION = [
  'The faculty activity report highlights the diverse professional contributions, scholarly output, and developmental engagement of faculty members across academic and research domains. Activities spanning sponsored projects, publications, patents, and workshops attended demonstrate sustained faculty participation in institutional growth.',
  'Participation in these activities enhances faculty expertise, research visibility, industry interaction, and student mentoring capabilities. Publications and patents contribute to the research ecosystem, while sponsored projects reflect applied knowledge and external collaboration.',
  'Overall, the documented activities reflect the institution\'s commitment to faculty development and research culture. Systematic recording of these achievements supports accreditation processes, department reviews, and strategic planning for academic excellence.',
];

export const FACULTY_ACTIVITY_REPORT_CONFIG: TemplateReportConfig = {
  reportTitle: 'FACULTY ACHIEVEMENT REPORT',
  sectionOrder: ['cover', 'introduction', 'modules', 'conclusion'],
  tableHeaders: FACULTY_ACTIVITY_TABLE_HEADERS,
  columnWeights: STANDARD_TEMPLATE_COLUMN_WEIGHTS,
  fileNamePrefix: 'Faculty-Achievement-Report',
  narrative: {
    promptsDir: path.join(__dirname, 'templates'),
    fallbackIntroduction: FACULTY_FALLBACK_INTRO,
    fallbackConclusion: FACULTY_FALLBACK_CONCLUSION,
    introTailoring: ({ department, academicYear, totalRecords, activeModules, modules }) => {
      if (modules.length === 1) {
        const moduleName = modules[0]?.heading ?? 'this module';
        return `The following report presents only ${moduleName} records for ${department} during academic year ${academicYear}. A total of ${totalRecords} approved record(s) belonging to this module are documented. Factual details are taken from the institutional repository.`;
      }

      return `The following report presents faculty activities across all identified modules for ${department} during academic year ${academicYear}. A total of ${totalRecords} approved record(s) are documented across ${activeModules} active module(s). Each module table includes the faculty name, type of activity, title, organization, and date.`;
    },
  },
  resolvePresentation: (filters) => {
    const moduleDefinition = getFacultyModuleReportDefinition(filters.facultyModule);
    if (!moduleDefinition) return {};
    return {
      reportTitle: moduleDefinition.reportTitle,
      fileNamePrefix: moduleDefinition.fileNamePrefix,
    };
  },
};
