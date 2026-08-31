import { getReportSectionDefinitions } from '../../config/report-sections.config';

export const DEPARTMENT_MODULE_REPORT_KEYS = [
  'department-events',
  'industrial-visits',
  'department-notifications',
  'achievement-repository',
  'accreditation-activities',
  'department-achievements',
] as const;

export type DepartmentModuleReportKey = (typeof DEPARTMENT_MODULE_REPORT_KEYS)[number];

export interface DepartmentModuleReportDefinition {
  key: DepartmentModuleReportKey;
  reportTitle: string;
  displayTitle: string;
  captionPrefix: string;
  fileNamePrefix: string;
}

const DEFINITIONS: Record<DepartmentModuleReportKey, DepartmentModuleReportDefinition> = {
  'department-events': {
    key: 'department-events',
    reportTitle: 'DEPARTMENT EVENTS REPORT',
    displayTitle: 'Department Events Report',
    captionPrefix: 'Department Event',
    fileNamePrefix: 'Department-Events-Report',
  },
  'industrial-visits': {
    key: 'industrial-visits',
    reportTitle: 'DEPARTMENT INDUSTRIAL VISITS REPORT',
    displayTitle: 'Department Industrial Visits Report',
    captionPrefix: 'Industrial Visit',
    fileNamePrefix: 'Department-Industrial-Visits-Report',
  },
  'department-notifications': {
    key: 'department-notifications',
    reportTitle: 'DEPARTMENT NOTIFICATIONS REPORT',
    displayTitle: 'Department Notifications Report',
    captionPrefix: 'Notification',
    fileNamePrefix: 'Department-Notifications-Report',
  },
  'achievement-repository': {
    key: 'achievement-repository',
    reportTitle: 'DEPARTMENT ACHIEVEMENT REPOSITORY REPORT',
    displayTitle: 'Department Achievement Repository Report',
    captionPrefix: 'Achievement',
    fileNamePrefix: 'Department-Achievement-Repository-Report',
  },
  'accreditation-activities': {
    key: 'accreditation-activities',
    reportTitle: 'DEPARTMENT ACCREDITATION ACTIVITIES REPORT',
    displayTitle: 'Department Accreditation Activities Report',
    captionPrefix: 'Accreditation',
    fileNamePrefix: 'Department-Accreditation-Activities-Report',
  },
  'department-achievements': {
    key: 'department-achievements',
    reportTitle: 'DEPARTMENT ACHIEVEMENTS REPORT',
    displayTitle: 'Department Achievements Report',
    captionPrefix: 'Department Achievement',
    fileNamePrefix: 'Department-Achievements-Report',
  },
};

export const isDepartmentModuleReportKey = (
  value: string | undefined,
): value is DepartmentModuleReportKey =>
  Boolean(value && (DEPARTMENT_MODULE_REPORT_KEYS as readonly string[]).includes(value));

export const getDepartmentModuleReportDefinition = (
  key: string | undefined,
): DepartmentModuleReportDefinition | undefined => {
  if (!isDepartmentModuleReportKey(key)) return undefined;
  return DEFINITIONS[key];
};

export const departmentModuleKeysMatchReportSections = (): boolean => {
  const sectionKeys = getReportSectionDefinitions('Department Activities').map((section) => section.key);
  return (
    sectionKeys.length === DEPARTMENT_MODULE_REPORT_KEYS.length &&
    DEPARTMENT_MODULE_REPORT_KEYS.every((key, index) => sectionKeys[index] === key)
  );
};
