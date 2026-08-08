import { RecordCategory } from '../../database/enums';
import { ExtractionResult } from '../interfaces/extraction.interface';
import { enrichExtractionAchievementType, isFacultySponsoredProjectContext } from './achievement-inference.util';

export type ActivityModule = 'Student Activities' | 'Faculty Activities' | 'Department Activities' | 'News';

export interface ActivityClassification {
  module: ActivityModule;
  subCategory: string;
}

const RECORD_CATEGORY_MODULE_MAP: Record<RecordCategory, ActivityClassification> = {
  Placement: { module: 'Student Activities', subCategory: 'Placement' },
  Internship: { module: 'Student Activities', subCategory: 'Internship' },
  Sports: { module: 'Student Activities', subCategory: 'Sports' },
  Cultural: { module: 'Student Activities', subCategory: 'Cultural' },
  Certification: { module: 'Student Activities', subCategory: 'Certifications' },
  Research: { module: 'Student Activities', subCategory: 'Research' },
  'Student Achievement': { module: 'Student Activities', subCategory: 'Technical' },
  'Faculty Achievement': { module: 'Faculty Activities', subCategory: 'Awards' },
  Publication: { module: 'Faculty Activities', subCategory: 'Publications' },
  Patent: { module: 'Faculty Activities', subCategory: 'Patents' },
  Workshop: { module: 'Department Activities', subCategory: 'Events' },
  Seminar: { module: 'Department Activities', subCategory: 'Events' },
  'Industrial Visit': { module: 'Department Activities', subCategory: 'Industrial Visit Reports' },
  News: { module: 'News', subCategory: 'Newspaper Articles' },
};

const ACHIEVEMENT_SUBCATEGORY: Record<string, string> = {
  Sports: 'Sports',
  Cultural: 'Cultural',
  Technical: 'Technical',
  Hackathon: 'Startup & Innovation',
  Research: 'Research',
  Certification: 'Certifications',
  Award: 'Awards',
};

const EVENT_SUBCATEGORY: Record<string, string> = {
  Workshop: 'Events',
  Seminar: 'Events',
  'Guest Lecture': 'Guest Lectures',
  'Industrial Visit': 'Industrial Visit Reports',
  FDP: 'FDPs',
  'Training Program': 'Workshops Attended',
};

export const resolveActivityClassification = (
  recordCategory: RecordCategory,
  extraction: ExtractionResult,
  originalMessage = '',
): ActivityClassification => {
  const enriched = enrichExtractionAchievementType(extraction);

  if (
    recordCategory === 'Faculty Achievement' &&
    (isFacultySponsoredProjectContext(enriched, originalMessage) ||
      enriched.achievementType?.trim() === 'Research')
  ) {
    return { module: 'Faculty Activities', subCategory: 'Sponsored Projects' };
  }

  if (isFacultySponsoredProjectContext(enriched, originalMessage)) {
    return { module: 'Faculty Activities', subCategory: 'Sponsored Projects' };
  }

  const base = RECORD_CATEGORY_MODULE_MAP[recordCategory];

  const achievementType = enriched.achievementType?.trim();
  if (achievementType && ACHIEVEMENT_SUBCATEGORY[achievementType]) {
    const subCategory = ACHIEVEMENT_SUBCATEGORY[achievementType];
    if (recordCategory === 'Faculty Achievement' || achievementType === 'Award') {
      return { module: 'Faculty Activities', subCategory };
    }
    if (['Certification', 'Research', 'Sports', 'Cultural', 'Technical', 'Hackathon'].includes(achievementType)) {
      return { module: 'Student Activities', subCategory };
    }
    return { module: 'Student Activities', subCategory };
  }

  if (recordCategory === 'Sports') {
    return { module: 'Student Activities', subCategory: 'Sports' };
  }

  if (recordCategory === 'Cultural') {
    return { module: 'Student Activities', subCategory: 'Cultural' };
  }

  if (recordCategory === 'Certification') {
    return { module: 'Student Activities', subCategory: 'Certifications' };
  }

  if (recordCategory === 'Research') {
    return { module: 'Student Activities', subCategory: 'Research' };
  }

  const eventType = extraction.eventType?.trim();
  if (eventType && EVENT_SUBCATEGORY[eventType]) {
    if (eventType === 'FDP' || eventType === 'Guest Lecture') {
      return { module: 'Faculty Activities', subCategory: EVENT_SUBCATEGORY[eventType] };
    }
    if (eventType === 'Industrial Visit') {
      return { module: 'Department Activities', subCategory: 'Industrial Visit Reports' };
    }
    return { module: 'Department Activities', subCategory: EVENT_SUBCATEGORY[eventType] };
  }

  if (recordCategory === 'Publication') {
    const hint = extraction.categoryHint?.toLowerCase() ?? '';
    if (hint.includes('book')) {
      return { module: 'Faculty Activities', subCategory: 'Book Chapters' };
    }
    if (hint.includes('conference')) {
      return { module: 'Faculty Activities', subCategory: 'Conferences' };
    }
  }

  return base ?? { module: 'Department Activities', subCategory: 'Department Achievements' };
};
