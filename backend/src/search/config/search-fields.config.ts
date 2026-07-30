import { SmartSearchCollection } from './search-collections.config';

export const SMART_SEARCH_SORT_VALUES = ['latest', 'oldest', ''] as const;

export type SmartSearchSort = (typeof SMART_SEARCH_SORT_VALUES)[number];

export const SMART_SEARCH_COLLECTION_FIELDS: Record<SmartSearchCollection, readonly string[]> = {
  placements: [
    'studentName',
    'rollNumber',
    'department',
    'company',
    'role',
    'package',
    'year',
  ],
  internships: ['studentName', 'rollNumber', 'company', 'role', 'duration', 'year'],
  student_achievements: [
    'studentName',
    'rollNumber',
    'department',
    'achievementType',
    'title',
    'organization',
    'year',
  ],
  faculty_achievements: [
    'facultyName',
    'designation',
    'achievementType',
    'title',
    'organization',
    'year',
  ],
  completed_event_reports: ['eventTitle', 'eventType', 'venue', 'coordinator', 'year'],
  publications: [
    'facultyName',
    'paperTitle',
    'journal',
    'conference',
    'authors',
    'topic',
    'year',
  ],
  patents: ['patentTitle', 'inventors', 'patentNumber', 'status', 'year'],
  news: [
    'headline',
    'newspaperName',
    'articleCategory',
    'articleLanguage',
    'department',
    'organization',
    'topic',
    'year',
  ],
};

export const SMART_SEARCH_COLLECTION_ALIASES: Record<string, SmartSearchCollection> = {
  placement: 'placements',
  placements: 'placements',
  internship: 'internships',
  internships: 'internships',
  student_achievement: 'student_achievements',
  student_achievements: 'student_achievements',
  faculty_achievement: 'faculty_achievements',
  faculty_achievements: 'faculty_achievements',
  completed_event_report: 'completed_event_reports',
  completed_event_reports: 'completed_event_reports',
  event_report: 'completed_event_reports',
  event_reports: 'completed_event_reports',
  workshop: 'completed_event_reports',
  workshops: 'completed_event_reports',
  publication: 'publications',
  publications: 'publications',
  patent: 'patents',
  patents: 'patents',
  news: 'news',
  newspaper: 'news',
  newspapers: 'news',
  magazine: 'news',
};
