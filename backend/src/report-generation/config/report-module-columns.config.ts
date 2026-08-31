export type ReportColumnFormat = 'text' | 'date' | 'list';

export interface ReportColumnDefinition {
  key: string;
  label: string;
  format?: ReportColumnFormat;
}

const studentAchievementColumns: ReportColumnDefinition[] = [
  { key: 'studentName', label: 'Student' },
  { key: 'achievementType', label: 'Type' },
  { key: 'title', label: 'Title' },
  { key: 'organization', label: 'Organization' },
  { key: 'date', label: 'Date', format: 'date' },
];

const studentPlacementColumns: ReportColumnDefinition[] = [
  { key: 'studentName', label: 'Student' },
  { key: 'company', label: 'Company' },
  { key: 'role', label: 'Role' },
  { key: 'package', label: 'Package' },
  { key: 'joiningDate', label: 'Joining Date', format: 'date' },
];

const studentInternshipColumns: ReportColumnDefinition[] = [
  { key: 'studentName', label: 'Student' },
  { key: 'company', label: 'Company' },
  { key: 'role', label: 'Role' },
  { key: 'duration', label: 'Duration' },
  { key: 'startDate', label: 'Start Date', format: 'date' },
];

const eventColumns: ReportColumnDefinition[] = [
  { key: 'eventTitle', label: 'Event' },
  { key: 'eventType', label: 'Type' },
  { key: 'coordinator', label: 'Coordinator' },
  { key: 'venue', label: 'Venue' },
  { key: 'date', label: 'Date', format: 'date' },
];

const facultyAchievementColumns: ReportColumnDefinition[] = [
  { key: 'facultyName', label: 'Faculty' },
  { key: 'achievementType', label: 'Type' },
  { key: 'title', label: 'Title' },
  { key: 'organization', label: 'Organization' },
  { key: 'date', label: 'Date', format: 'date' },
];

const facultyPublicationColumns: ReportColumnDefinition[] = [
  { key: 'facultyName', label: 'Faculty' },
  { key: 'paperTitle', label: 'Paper Title' },
  { key: 'journal', label: 'Journal' },
  { key: 'conference', label: 'Conference' },
  { key: 'publicationDate', label: 'Date', format: 'date' },
];

const facultyPatentColumns: ReportColumnDefinition[] = [
  { key: 'patentTitle', label: 'Title' },
  { key: 'inventors', label: 'Inventors', format: 'list' },
  { key: 'patentNumber', label: 'Patent No.' },
  { key: 'status', label: 'Status' },
  { key: 'filingDate', label: 'Filing Date', format: 'date' },
];

/** Mirrors frontend/src/config/modules.ts column templates per report section key */
export const STUDENT_REPORT_MODULE_COLUMNS: Record<string, ReportColumnDefinition[]> = {
  sports: studentAchievementColumns,
  cultural: studentAchievementColumns,
  technical: studentAchievementColumns,
  research: studentAchievementColumns,
  certifications: studentAchievementColumns,
  'startup-innovation': studentAchievementColumns,
  'nss-ncc': studentAchievementColumns,
  'sponsored-projects': [
    { key: 'studentName', label: 'Student' },
    { key: 'title', label: 'Project Name' },
    { key: 'organization', label: 'Sponsored Organization' },
    { key: 'sponsorshipAmount', label: 'Sponsorship Amount' },
    { key: 'date', label: 'Date', format: 'date' },
  ],
  internships: studentInternshipColumns,
  placements: studentPlacementColumns,
  workshops: eventColumns,
  seminars: eventColumns,
  'industrial-visits': eventColumns,
};

export const FACULTY_REPORT_MODULE_COLUMNS: Record<string, ReportColumnDefinition[]> = {
  fdp: eventColumns,
  workshops: eventColumns,
  seminars: eventColumns,
  'guest-lectures': eventColumns,
  conferences: facultyAchievementColumns,
  consultancy: facultyAchievementColumns,
  'sponsored-projects': facultyAchievementColumns,
  certifications: facultyAchievementColumns,
  awards: facultyAchievementColumns,
  mous: [
    { key: 'facultyName', label: 'Faculty' },
    { key: 'organization', label: 'Company / Organization' },
    { key: 'date', label: 'Date of MoU', format: 'date' },
    { key: 'benefit', label: 'Benefit' },
  ],
  'resource-person': [
    { key: 'facultyName', label: 'Faculty' },
    { key: 'organization', label: 'College / University / Organization' },
    { key: 'resourceType', label: 'Resource Type' },
    { key: 'date', label: 'Date', format: 'date' },
  ],
  'session-chair-reviewer': [
    { key: 'facultyName', label: 'Faculty' },
    { key: 'organization', label: 'Organization' },
    { key: 'sessionRole', label: 'Type' },
    { key: 'date', label: 'Date', format: 'date' },
  ],
  publications: facultyPublicationColumns,
  'book-chapters': facultyPublicationColumns,
  patents: facultyPatentColumns,
};

export const getStudentReportModuleColumns = (sectionKey: string): ReportColumnDefinition[] =>
  STUDENT_REPORT_MODULE_COLUMNS[sectionKey] ?? studentAchievementColumns;

export const getFacultyReportModuleColumns = (sectionKey: string): ReportColumnDefinition[] =>
  FACULTY_REPORT_MODULE_COLUMNS[sectionKey] ?? facultyAchievementColumns;
