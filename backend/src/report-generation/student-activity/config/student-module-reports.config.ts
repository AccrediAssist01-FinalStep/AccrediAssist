import { getReportSectionDefinitions } from '../../config/report-sections.config';

/** Canonical student module keys — must match Student Activities report section keys */
export const STUDENT_MODULE_REPORT_KEYS = [
  'sports',
  'cultural',
  'technical',
  'research',
  'internships',
  'placements',
  'certifications',
  'workshops',
  'seminars',
  'industrial-visits',
  'startup-innovation',
  'nss-ncc',
  'sponsored-projects',
] as const;

export type StudentModuleReportKey = (typeof STUDENT_MODULE_REPORT_KEYS)[number];

export interface StudentModuleReportDefinition {
  key: StudentModuleReportKey;
  /** Cover / document title */
  reportTitle: string;
  /** History card / UI title */
  displayTitle: string;
  /** Caption prefix, e.g. Sports */
  captionPrefix: string;
  fileNamePrefix: string;
}

const DEFINITIONS: Record<StudentModuleReportKey, StudentModuleReportDefinition> = {
  sports: {
    key: 'sports',
    reportTitle: 'STUDENT SPORTS REPORT',
    displayTitle: 'Student Sports Report',
    captionPrefix: 'Sports',
    fileNamePrefix: 'Student-Sports-Report',
  },
  cultural: {
    key: 'cultural',
    reportTitle: 'STUDENT CULTURAL ACTIVITIES REPORT',
    displayTitle: 'Student Cultural Activities Report',
    captionPrefix: 'Cultural Activities',
    fileNamePrefix: 'Student-Cultural-Activities-Report',
  },
  technical: {
    key: 'technical',
    reportTitle: 'STUDENT TECHNICAL ACTIVITIES REPORT',
    displayTitle: 'Student Technical Activities Report',
    captionPrefix: 'Technical Activities',
    fileNamePrefix: 'Student-Technical-Activities-Report',
  },
  research: {
    key: 'research',
    reportTitle: 'STUDENT RESEARCH REPORT',
    displayTitle: 'Student Research Report',
    captionPrefix: 'Research',
    fileNamePrefix: 'Student-Research-Report',
  },
  internships: {
    key: 'internships',
    reportTitle: 'STUDENT INTERNSHIPS REPORT',
    displayTitle: 'Student Internships Report',
    captionPrefix: 'Internship',
    fileNamePrefix: 'Student-Internships-Report',
  },
  placements: {
    key: 'placements',
    reportTitle: 'STUDENT PLACEMENTS REPORT',
    displayTitle: 'Student Placements Report',
    captionPrefix: 'Placement',
    fileNamePrefix: 'Student-Placements-Report',
  },
  certifications: {
    key: 'certifications',
    reportTitle: 'STUDENT CERTIFICATIONS REPORT',
    displayTitle: 'Student Certifications Report',
    captionPrefix: 'Certification',
    fileNamePrefix: 'Student-Certifications-Report',
  },
  workshops: {
    key: 'workshops',
    reportTitle: 'STUDENT WORKSHOPS REPORT',
    displayTitle: 'Student Workshops Report',
    captionPrefix: 'Workshop',
    fileNamePrefix: 'Student-Workshops-Report',
  },
  seminars: {
    key: 'seminars',
    reportTitle: 'STUDENT SEMINARS REPORT',
    displayTitle: 'Student Seminars Report',
    captionPrefix: 'Seminar',
    fileNamePrefix: 'Student-Seminars-Report',
  },
  'industrial-visits': {
    key: 'industrial-visits',
    reportTitle: 'STUDENT INDUSTRIAL VISITS REPORT',
    displayTitle: 'Student Industrial Visits Report',
    captionPrefix: 'Industrial Visit',
    fileNamePrefix: 'Student-Industrial-Visits-Report',
  },
  'startup-innovation': {
    key: 'startup-innovation',
    reportTitle: 'STUDENT STARTUP AND INNOVATION REPORT',
    displayTitle: 'Student Startup & Innovation Report',
    captionPrefix: 'Startup & Innovation',
    fileNamePrefix: 'Student-Startup-Innovation-Report',
  },
  'nss-ncc': {
    key: 'nss-ncc',
    reportTitle: 'STUDENT NSS NCC REPORT',
    displayTitle: 'Student NSS / NCC Report',
    captionPrefix: 'NSS / NCC',
    fileNamePrefix: 'Student-NSS-NCC-Report',
  },
  'sponsored-projects': {
    key: 'sponsored-projects',
    reportTitle: 'STUDENT SPONSORED PROJECTS REPORT',
    displayTitle: 'Student Sponsored Projects Report',
    captionPrefix: 'Student Sponsored Project',
    fileNamePrefix: 'Student-Sponsored-Projects-Report',
  },
};

export const isStudentModuleReportKey = (value: string | undefined): value is StudentModuleReportKey =>
  Boolean(value && (STUDENT_MODULE_REPORT_KEYS as readonly string[]).includes(value));

export const getStudentModuleReportDefinition = (
  key: string | undefined,
): StudentModuleReportDefinition | undefined => {
  if (!isStudentModuleReportKey(key)) return undefined;
  return DEFINITIONS[key];
};

export const listStudentModuleReportDefinitions = (): StudentModuleReportDefinition[] =>
  STUDENT_MODULE_REPORT_KEYS.map((key) => DEFINITIONS[key]);

/** Guard: configured module keys stay aligned with Student Activities section config */
export const studentModuleKeysMatchReportSections = (): boolean => {
  const sectionKeys = getReportSectionDefinitions('Student Activities').map((section) => section.key);
  if (sectionKeys.length !== STUDENT_MODULE_REPORT_KEYS.length) return false;
  return STUDENT_MODULE_REPORT_KEYS.every((key, index) => sectionKeys[index] === key);
};
