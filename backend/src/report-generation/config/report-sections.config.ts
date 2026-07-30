import type { GenerationReportType } from './report-types.config';
import type { AggregationModuleKey } from '../aggregation/interfaces/aggregation.interface';

export interface ReportSectionDefinition {
  key: string;
  label: string;
  module: AggregationModuleKey;
  /** Match achievementType, eventType, or other category field */
  categoryMatch?: string | string[];
  /** Regex applied to title/description for keyword-style sections */
  titlePattern?: RegExp;
}

export const REPORT_SECTION_DEFINITIONS: Partial<
  Record<GenerationReportType, ReportSectionDefinition[]>
> = {
  'Student Activities': [
    { key: 'sports', label: 'Sports', module: 'studentAchievements', categoryMatch: 'Sports' },
    { key: 'cultural', label: 'Cultural', module: 'studentAchievements', categoryMatch: 'Cultural' },
    {
      key: 'technical',
      label: 'Technical',
      module: 'studentAchievements',
      categoryMatch: ['Technical', 'Hackathon'],
    },
    {
      key: 'research',
      label: 'Research',
      module: 'studentAchievements',
      categoryMatch: 'Research',
    },
    { key: 'internships', label: 'Internships', module: 'internships' },
    { key: 'placements', label: 'Placements', module: 'placements' },
    {
      key: 'certifications',
      label: 'Certifications',
      module: 'studentAchievements',
      categoryMatch: 'Certification',
    },
    {
      key: 'workshops',
      label: 'Workshops',
      module: 'completedEventReports',
      categoryMatch: 'Workshop',
    },
    {
      key: 'seminars',
      label: 'Seminars',
      module: 'completedEventReports',
      categoryMatch: 'Seminar',
    },
    {
      key: 'industrial-visits',
      label: 'Industrial Visits',
      module: 'completedEventReports',
      categoryMatch: 'Industrial Visit',
    },
    {
      key: 'startup-innovation',
      label: 'Startup & Innovation',
      module: 'studentAchievements',
      categoryMatch: 'Award',
      titlePattern: /startup|innovation|incubat/i,
    },
    {
      key: 'nss-ncc',
      label: 'NSS / NCC',
      module: 'studentAchievements',
      titlePattern: /nss|ncc|national service|cadet/i,
    },
  ],
  'Faculty Activities': [
    { key: 'fdp', label: 'Faculty Development Programs', module: 'completedEventReports', categoryMatch: 'FDP' },
    { key: 'workshops', label: 'Workshops', module: 'completedEventReports', categoryMatch: 'Workshop' },
    { key: 'seminars', label: 'Seminars', module: 'completedEventReports', categoryMatch: 'Seminar' },
    {
      key: 'conferences',
      label: 'Conferences',
      module: 'publications',
      titlePattern: /conference/i,
    },
    { key: 'publications', label: 'Publications', module: 'publications' },
    { key: 'patents', label: 'Patents', module: 'patents' },
    {
      key: 'book-chapters',
      label: 'Book Chapters',
      module: 'publications',
      titlePattern: /book chapter|chapter in book/i,
    },
    {
      key: 'consultancy',
      label: 'Consultancy',
      module: 'facultyAchievements',
      titlePattern: /consult/i,
    },
    {
      key: 'sponsored-projects',
      label: 'Sponsored Projects',
      module: 'facultyAchievements',
      titlePattern: /sponsored|project grant|research project/i,
    },
    {
      key: 'certifications',
      label: 'Certifications',
      module: 'facultyAchievements',
      categoryMatch: 'Certification',
    },
    { key: 'awards', label: 'Awards', module: 'facultyAchievements', categoryMatch: 'Award' },
    {
      key: 'guest-lectures',
      label: 'Guest Lectures',
      module: 'completedEventReports',
      categoryMatch: 'Guest Lecture',
    },
  ],
  'Department Activities': [
    { key: 'department-events', label: 'Department Events', module: 'completedEventReports' },
    {
      key: 'industrial-visits',
      label: 'Industrial Visits',
      module: 'completedEventReports',
      categoryMatch: 'Industrial Visit',
    },
    { key: 'department-notifications', label: 'Department Notifications', module: 'news' },
    {
      key: 'achievement-repository',
      label: 'Department Achievement Repository',
      module: 'studentAchievements',
    },
    {
      key: 'accreditation-activities',
      label: 'Accreditation Activities',
      module: 'facultyAchievements',
      titlePattern: /accreditation|nba|naac|aicte/i,
    },
    {
      key: 'department-achievements',
      label: 'Department Achievements',
      module: 'facultyAchievements',
    },
  ],
  'AI Generated Workshop': [
    { key: 'workshops', label: 'Workshop Details', module: 'completedEventReports', categoryMatch: 'Workshop' },
  ],
  'AI Generated Industrial Visit': [
    {
      key: 'industrial-visits',
      label: 'Industrial Visit Details',
      module: 'completedEventReports',
      categoryMatch: 'Industrial Visit',
    },
  ],
};

export const getReportSectionDefinitions = (
  reportType: GenerationReportType,
): ReportSectionDefinition[] => REPORT_SECTION_DEFINITIONS[reportType] ?? [];
