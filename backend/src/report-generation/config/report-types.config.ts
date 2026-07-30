import { ReportTypeDefinition } from '../interfaces/report-generation.interface';

/** Exactly eight institutional reports supported by the ERP */
export const GENERATION_REPORT_TYPES = [
  'Student Activities',
  'Faculty Activities',
  'Department Activities',
  'NBA',
  'NAAC',
  'AICTE',
  'AI Generated Workshop',
  'AI Generated Industrial Visit',
] as const;

export type GenerationReportType = (typeof GENERATION_REPORT_TYPES)[number];

/** Legacy report types retained for backward-compatible history records */
export const LEGACY_GENERATION_REPORT_TYPES = [
  'Placement',
  'Internship',
  'Student Achievement',
  'Faculty Achievement',
  'Publication',
  'Patent',
  'Completed Event',
  'News',
] as const;

export type LegacyGenerationReportType = (typeof LEGACY_GENERATION_REPORT_TYPES)[number];

export const REPORT_TYPE_DEFINITIONS: Record<GenerationReportType, ReportTypeDefinition> = {
  'Student Activities': {
    id: 'Student Activities',
    label: 'Student Activities Report',
    description:
      'Complete student activity repository with sports, cultural, technical, placements, internships, and events.',
    category: 'operational',
    dataSources: ['studentAchievements', 'placements', 'internships', 'completedEventReports'],
    templateId: 'student-activities-v1',
    chartsIncluded: true,
    aiSummaryRequired: true,
  },
  'Faculty Activities': {
    id: 'Faculty Activities',
    label: 'Faculty Activities Report',
    description:
      'Faculty development, publications, patents, consultancy, awards, and professional activities.',
    category: 'achievement',
    dataSources: ['facultyAchievements', 'publications', 'patents', 'completedEventReports'],
    templateId: 'faculty-activities-v1',
    chartsIncluded: true,
    aiSummaryRequired: true,
  },
  'Department Activities': {
    id: 'Department Activities',
    label: 'Department Activities Report',
    description:
      'Department events, industrial visits, notifications, achievements, and accreditation activities.',
    category: 'operational',
    dataSources: ['completedEventReports', 'news', 'studentAchievements', 'facultyAchievements'],
    templateId: 'department-activities-v1',
    chartsIncluded: true,
    aiSummaryRequired: true,
  },
  NBA: {
    id: 'NBA',
    label: 'NBA Report',
    description: 'National Board of Accreditation compliance and outcome metrics report.',
    category: 'accreditation',
    dataSources: [
      'placements',
      'internships',
      'studentAchievements',
      'facultyAchievements',
      'publications',
      'patents',
      'completedEventReports',
    ],
    templateId: 'nba-v1',
    chartsIncluded: true,
    aiSummaryRequired: true,
  },
  NAAC: {
    id: 'NAAC',
    label: 'NAAC Report',
    description: 'NAAC accreditation criteria and institutional performance report.',
    category: 'accreditation',
    dataSources: [
      'placements',
      'internships',
      'studentAchievements',
      'facultyAchievements',
      'publications',
      'patents',
      'completedEventReports',
    ],
    templateId: 'naac-v1',
    chartsIncluded: true,
    aiSummaryRequired: true,
  },
  AICTE: {
    id: 'AICTE',
    label: 'AICTE Report',
    description: 'AICTE regulatory and academic quality indicators report.',
    category: 'accreditation',
    dataSources: [
      'placements',
      'internships',
      'studentAchievements',
      'facultyAchievements',
      'publications',
      'patents',
    ],
    templateId: 'aicte-v1',
    chartsIncluded: true,
    aiSummaryRequired: true,
  },
  'AI Generated Workshop': {
    id: 'AI Generated Workshop',
    label: 'AI Generated Workshop Report',
    description: 'AI-assisted workshop analytics with event details, photos, and executive summary.',
    category: 'operational',
    dataSources: ['completedEventReports'],
    templateId: 'ai-workshop-v1',
    chartsIncluded: true,
    aiSummaryRequired: true,
  },
  'AI Generated Industrial Visit': {
    id: 'AI Generated Industrial Visit',
    label: 'AI Generated Industrial Visit Report',
    description:
      'AI-assisted industrial visit analytics with participation metrics and executive summary.',
    category: 'operational',
    dataSources: ['completedEventReports'],
    templateId: 'ai-industrial-visit-v1',
    chartsIncluded: true,
    aiSummaryRequired: true,
  },
};

export const listGenerationReportTypes = (): ReportTypeDefinition[] =>
  GENERATION_REPORT_TYPES.map((type) => REPORT_TYPE_DEFINITIONS[type]);

export const getGenerationReportTypeDefinition = (
  type: GenerationReportType,
): ReportTypeDefinition => REPORT_TYPE_DEFINITIONS[type];
