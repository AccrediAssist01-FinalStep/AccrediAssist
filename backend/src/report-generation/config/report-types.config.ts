import { ReportTypeDefinition } from '../interfaces/report-generation.interface';

/** Dedicated generation report types (includes accreditation-specific reports) */
export const GENERATION_REPORT_TYPES = [
  'NBA',
  'NAAC',
  'AICTE',
  'Placement',
  'Internship',
  'Student Achievement',
  'Faculty Achievement',
  'Publication',
  'Patent',
  'Completed Event',
  'News',
] as const;

export type GenerationReportType = (typeof GENERATION_REPORT_TYPES)[number];

export const REPORT_TYPE_DEFINITIONS: Record<GenerationReportType, ReportTypeDefinition> = {
  NBA: {
    id: 'NBA',
    label: 'NBA Report',
    description: 'National Board of Accreditation compliance and outcome metrics report.',
    category: 'accreditation',
    dataSources: ['placements', 'internships', 'studentAchievements', 'facultyAchievements', 'publications', 'patents', 'completedEventReports'],
    templateId: 'nba-v1',
    chartsIncluded: true,
    aiSummaryRequired: true,
  },
  NAAC: {
    id: 'NAAC',
    label: 'NAAC Report',
    description: 'NAAC accreditation criteria and institutional performance report.',
    category: 'accreditation',
    dataSources: ['placements', 'internships', 'studentAchievements', 'facultyAchievements', 'publications', 'patents', 'completedEventReports'],
    templateId: 'naac-v1',
    chartsIncluded: true,
    aiSummaryRequired: true,
  },
  AICTE: {
    id: 'AICTE',
    label: 'AICTE Report',
    description: 'AICTE regulatory and academic quality indicators report.',
    category: 'accreditation',
    dataSources: ['placements', 'internships', 'studentAchievements', 'facultyAchievements', 'publications', 'patents'],
    templateId: 'aicte-v1',
    chartsIncluded: true,
    aiSummaryRequired: true,
  },
  Placement: {
    id: 'Placement',
    label: 'Placement Report',
    description: 'Student placement statistics and company-wise outcomes.',
    category: 'operational',
    dataSources: ['placements'],
    templateId: 'placement-v1',
    chartsIncluded: true,
    aiSummaryRequired: true,
  },
  Internship: {
    id: 'Internship',
    label: 'Internship Report',
    description: 'Internship participation and organization-wise summary.',
    category: 'operational',
    dataSources: ['internships'],
    templateId: 'internship-v1',
    chartsIncluded: true,
    aiSummaryRequired: true,
  },
  'Student Achievement': {
    id: 'Student Achievement',
    label: 'Student Achievement Report',
    description: 'Student awards, competitions, and extracurricular achievements.',
    category: 'achievement',
    dataSources: ['studentAchievements'],
    templateId: 'student-achievement-v1',
    chartsIncluded: true,
    aiSummaryRequired: true,
  },
  'Faculty Achievement': {
    id: 'Faculty Achievement',
    label: 'Faculty Achievement Report',
    description: 'Faculty awards, certifications, and professional milestones.',
    category: 'achievement',
    dataSources: ['facultyAchievements'],
    templateId: 'faculty-achievement-v1',
    chartsIncluded: true,
    aiSummaryRequired: true,
  },
  Publication: {
    id: 'Publication',
    label: 'Publication Report',
    description: 'Faculty and student publication index and journal breakdown.',
    category: 'research',
    dataSources: ['publications'],
    templateId: 'publication-v1',
    chartsIncluded: true,
    aiSummaryRequired: true,
  },
  Patent: {
    id: 'Patent',
    label: 'Patent Report',
    description: 'Patent filings, grants, and intellectual property summary.',
    category: 'research',
    dataSources: ['patents'],
    templateId: 'patent-v1',
    chartsIncluded: true,
    aiSummaryRequired: true,
  },
  'Completed Event': {
    id: 'Completed Event',
    label: 'Completed Event Report',
    description: 'Workshops, seminars, FDPs, and institutional event outcomes.',
    category: 'operational',
    dataSources: ['completedEventReports'],
    templateId: 'completed-event-v1',
    chartsIncluded: true,
    aiSummaryRequired: true,
  },
  News: {
    id: 'News',
    label: 'News Analytics Report',
    description: 'Newspaper and magazine article analytics with department-wise and monthly news coverage.',
    category: 'operational',
    dataSources: ['news'],
    templateId: 'news-v1',
    chartsIncluded: true,
    aiSummaryRequired: true,
  },
};

export const listGenerationReportTypes = (): ReportTypeDefinition[] =>
  GENERATION_REPORT_TYPES.map((type) => REPORT_TYPE_DEFINITIONS[type]);

export const getGenerationReportTypeDefinition = (
  type: GenerationReportType,
): ReportTypeDefinition => REPORT_TYPE_DEFINITIONS[type];
