import path from 'path';
import type { TemplateReportConfig } from '../template-activity-report/template-activity-report.types';
import { STANDARD_TEMPLATE_COLUMN_WEIGHTS } from '../template-activity-report/utils/template-table.util';

export const DEPARTMENT_ACTIVITY_TABLE_HEADERS = [
  'Title',
  'Category',
  'Department',
  'Coordinator',
  'Date',
] as const;

export const DEPARTMENT_MODULE_NUMBER_BY_KEY: Record<string, number> = {
  'department-events': 1,
  'industrial-visits': 2,
  'department-notifications': 3,
  'achievement-repository': 4,
  'accreditation-activities': 5,
  'department-achievements': 6,
};

export const DEPARTMENT_MODULE_LABEL_BY_KEY: Record<string, string> = {
  'department-events': 'Department Events',
  'industrial-visits': 'Industrial Visits',
  'department-notifications': 'Department Notifications',
  'achievement-repository': 'Department Achievement Repository',
  'accreditation-activities': 'Accreditation Activities',
  'department-achievements': 'Department Achievements',
};

const DEPARTMENT_FALLBACK_INTRO = [
  'Department activities form an essential component of institutional functioning, reflecting the academic, administrative, and developmental initiatives undertaken by the department. The activities documented across various modules demonstrate coordinated efforts in organizing events, industrial visits, notifications, achievements, and accreditation-related work.',
  'The activities include department events, industrial visits, official notifications, achievement repositories, accreditation activities, and department-level accomplishments. These records provide a comprehensive view of departmental engagement with students, faculty, industry, and quality assurance frameworks such as NBA, NAAC, and AICTE.',
  'The following report presents department activities across all identified modules in a structured tabular format for institutional reporting and review.',
];

const DEPARTMENT_FALLBACK_CONCLUSION = [
  'The department activity report summarizes the range of events, visits, notifications, and achievements that contribute to the overall functioning and visibility of the department. Documented activities reflect proactive departmental engagement in academic enrichment, industry interaction, and compliance with accreditation requirements.',
  'Organizing events and industrial visits strengthens practical learning and industry exposure for students. Maintaining notification records and achievement repositories ensures transparency and traceability of departmental initiatives. Accreditation-related activities demonstrate alignment with quality standards and continuous improvement practices.',
  'Overall, the documented activities support effective department governance and institutional reporting. Continued systematic documentation will help the department showcase its contributions and plan future initiatives strategically.',
];

export const DEPARTMENT_ACTIVITY_REPORT_CONFIG: TemplateReportConfig = {
  reportTitle: 'DEPARTMENT ACTIVITIES REPORT',
  sectionOrder: ['cover', 'introduction', 'modules', 'conclusion'],
  tableHeaders: DEPARTMENT_ACTIVITY_TABLE_HEADERS,
  columnWeights: STANDARD_TEMPLATE_COLUMN_WEIGHTS,
  fileNamePrefix: 'Department-Activities-Report',
  narrative: {
    promptsDir: path.join(__dirname, 'templates'),
    fallbackIntroduction: DEPARTMENT_FALLBACK_INTRO,
    fallbackConclusion: DEPARTMENT_FALLBACK_CONCLUSION,
    introTailoring: ({ department, academicYear, totalRecords, activeModules }) =>
      `The following report presents department activities across all identified modules for ${department} during academic year ${academicYear}. A total of ${totalRecords} approved record(s) are documented across ${activeModules} active module(s). Each module table includes the activity title, category, department, coordinator, and date.`,
  },
};
