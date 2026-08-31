import { getReportSectionDefinitions } from '../../config/report-sections.config';

export const FACULTY_MODULE_REPORT_KEYS = [
  'fdp',
  'workshops',
  'seminars',
  'conferences',
  'publications',
  'patents',
  'book-chapters',
  'consultancy',
  'sponsored-projects',
  'certifications',
  'awards',
  'guest-lectures',
  'mous',
  'resource-person',
  'session-chair-reviewer',
] as const;

export type FacultyModuleReportKey = (typeof FACULTY_MODULE_REPORT_KEYS)[number];

export interface FacultyModuleReportDefinition {
  key: FacultyModuleReportKey;
  reportTitle: string;
  displayTitle: string;
  captionPrefix: string;
  fileNamePrefix: string;
}

const DEFINITIONS: Record<FacultyModuleReportKey, FacultyModuleReportDefinition> = {
  fdp: {
    key: 'fdp',
    reportTitle: 'FACULTY DEVELOPMENT PROGRAMME REPORT',
    displayTitle: 'Faculty FDP Report',
    captionPrefix: 'FDP',
    fileNamePrefix: 'Faculty-FDP-Report',
  },
  workshops: {
    key: 'workshops',
    reportTitle: 'FACULTY WORKSHOPS REPORT',
    displayTitle: 'Faculty Workshops Report',
    captionPrefix: 'Workshop',
    fileNamePrefix: 'Faculty-Workshops-Report',
  },
  seminars: {
    key: 'seminars',
    reportTitle: 'FACULTY SEMINARS REPORT',
    displayTitle: 'Faculty Seminars Report',
    captionPrefix: 'Seminar',
    fileNamePrefix: 'Faculty-Seminars-Report',
  },
  conferences: {
    key: 'conferences',
    reportTitle: 'FACULTY CONFERENCES REPORT',
    displayTitle: 'Faculty Conferences Report',
    captionPrefix: 'Conference',
    fileNamePrefix: 'Faculty-Conferences-Report',
  },
  publications: {
    key: 'publications',
    reportTitle: 'FACULTY PUBLICATIONS REPORT',
    displayTitle: 'Faculty Publications Report',
    captionPrefix: 'Publication',
    fileNamePrefix: 'Faculty-Publications-Report',
  },
  patents: {
    key: 'patents',
    reportTitle: 'FACULTY PATENTS REPORT',
    displayTitle: 'Faculty Patents Report',
    captionPrefix: 'Patent',
    fileNamePrefix: 'Faculty-Patents-Report',
  },
  'book-chapters': {
    key: 'book-chapters',
    reportTitle: 'FACULTY BOOK CHAPTERS REPORT',
    displayTitle: 'Faculty Book Chapters Report',
    captionPrefix: 'Book Chapter',
    fileNamePrefix: 'Faculty-Book-Chapters-Report',
  },
  consultancy: {
    key: 'consultancy',
    reportTitle: 'FACULTY CONSULTANCY REPORT',
    displayTitle: 'Faculty Consultancy Report',
    captionPrefix: 'Consultancy',
    fileNamePrefix: 'Faculty-Consultancy-Report',
  },
  'sponsored-projects': {
    key: 'sponsored-projects',
    reportTitle: 'FACULTY SPONSORED PROJECTS REPORT',
    displayTitle: 'Faculty Sponsored Projects Report',
    captionPrefix: 'Sponsored Project',
    fileNamePrefix: 'Faculty-Sponsored-Projects-Report',
  },
  certifications: {
    key: 'certifications',
    reportTitle: 'FACULTY CERTIFICATIONS REPORT',
    displayTitle: 'Faculty Certifications Report',
    captionPrefix: 'Certification',
    fileNamePrefix: 'Faculty-Certifications-Report',
  },
  awards: {
    key: 'awards',
    reportTitle: 'FACULTY AWARDS REPORT',
    displayTitle: 'Faculty Awards Report',
    captionPrefix: 'Award',
    fileNamePrefix: 'Faculty-Awards-Report',
  },
  'guest-lectures': {
    key: 'guest-lectures',
    reportTitle: 'FACULTY GUEST LECTURES REPORT',
    displayTitle: 'Faculty Guest Lectures Report',
    captionPrefix: 'Guest Lecture',
    fileNamePrefix: 'Faculty-Guest-Lectures-Report',
  },
  mous: {
    key: 'mous',
    reportTitle: 'FACULTY MOU REPORT',
    displayTitle: 'Faculty MoU Report',
    captionPrefix: 'MoU',
    fileNamePrefix: 'Faculty-MoU-Report',
  },
  'resource-person': {
    key: 'resource-person',
    reportTitle: 'FACULTY AS RESOURCE PERSON REPORT',
    displayTitle: 'Faculty as Resource Person Report',
    captionPrefix: 'Resource Person',
    fileNamePrefix: 'Faculty-Resource-Person-Report',
  },
  'session-chair-reviewer': {
    key: 'session-chair-reviewer',
    reportTitle: 'FACULTY SESSION CHAIR REVIEWER REPORT',
    displayTitle: 'Faculty Session Chair / Reviewer Report',
    captionPrefix: 'Session Chair / Reviewer',
    fileNamePrefix: 'Faculty-Session-Chair-Reviewer-Report',
  },
};

export const isFacultyModuleReportKey = (value: string | undefined): value is FacultyModuleReportKey =>
  Boolean(value && (FACULTY_MODULE_REPORT_KEYS as readonly string[]).includes(value));

export const getFacultyModuleReportDefinition = (
  key: string | undefined,
): FacultyModuleReportDefinition | undefined => {
  if (!isFacultyModuleReportKey(key)) return undefined;
  return DEFINITIONS[key];
};

export const facultyModuleKeysMatchReportSections = (): boolean => {
  const sectionKeys = getReportSectionDefinitions('Faculty Activities').map((section) => section.key);
  return (
    sectionKeys.length === FACULTY_MODULE_REPORT_KEYS.length &&
    FACULTY_MODULE_REPORT_KEYS.every((key, index) => sectionKeys[index] === key)
  );
};
