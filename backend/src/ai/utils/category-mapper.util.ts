import { EVENT_TYPES, EventType, RECORD_CATEGORIES, RecordCategory } from '../../database/enums';
import { ClassificationCategory } from '../interfaces/classification.interface';
import { ExtractionResult } from '../interfaces/extraction.interface';
import { enrichExtractionAchievementType, inferAchievementTypeFromText, isFacultySponsoredProjectContext } from './achievement-inference.util';
import { isIndustrialVisitContext } from './event-inference.util';

const DIRECT_CATEGORY_MAP: Record<ClassificationCategory, RecordCategory> = {
  'Student Achievement': 'Student Achievement',
  'Faculty Achievement': 'Faculty Achievement',
  Placement: 'Placement',
  Internship: 'Internship',
  Publication: 'Publication',
  Patent: 'Patent',
  'Completed Event Report': 'Workshop',
};

const EVENT_TYPE_SET = new Set<string>(EVENT_TYPES);

const ACHIEVEMENT_TYPE_MAP: Record<string, RecordCategory> = {
  Sports: 'Sports',
  Cultural: 'Cultural',
  Certification: 'Certification',
  Research: 'Research',
  Technical: 'Student Achievement',
  Hackathon: 'Student Achievement',
  Award: 'Faculty Achievement',
};

const resolveCompletedEventCategory = (extraction: ExtractionResult): RecordCategory => {
  const eventType = extraction.eventType?.trim();
  if (eventType && EVENT_TYPE_SET.has(eventType)) {
    return eventType as EventType;
  }

  const categoryHint = extraction.categoryHint?.trim();
  if (categoryHint === 'Seminar') {
    return 'Seminar';
  }
  if (
    categoryHint === 'Industrial Visit' ||
    extraction.eventType?.trim() === 'Industrial Visit' ||
    isIndustrialVisitContext('', extraction)
  ) {
    return 'Industrial Visit';
  }

  return 'Workshop';
};

const resolveAchievementCategory = (extraction: ExtractionResult): RecordCategory | null => {
  const enriched = enrichExtractionAchievementType(extraction);

  const categoryHint = enriched.categoryHint?.trim();
  if (categoryHint && isRecordCategory(categoryHint)) {
    return categoryHint;
  }

  const achievementType = enriched.achievementType?.trim();
  if (achievementType && ACHIEVEMENT_TYPE_MAP[achievementType]) {
    return ACHIEVEMENT_TYPE_MAP[achievementType];
  }

  const inferred = inferAchievementTypeFromText(enriched);
  if (inferred && ACHIEVEMENT_TYPE_MAP[inferred]) {
    return ACHIEVEMENT_TYPE_MAP[inferred];
  }

  return null;
};

export const isRecordCategory = (value: string): value is RecordCategory =>
  (RECORD_CATEGORIES as readonly string[]).includes(value);

export const mapClassificationToRecordCategory = (
  classificationCategory: ClassificationCategory,
  extraction: ExtractionResult,
): RecordCategory => {
  if (classificationCategory === 'Completed Event Report') {
    return resolveCompletedEventCategory(extraction);
  }

  if (
    classificationCategory === 'Student Achievement' ||
    classificationCategory === 'Faculty Achievement'
  ) {
    if (classificationCategory === 'Faculty Achievement') {
      return 'Faculty Achievement';
    }

    const resolved = resolveAchievementCategory(extraction);
    if (resolved) {
      return resolved;
    }

    return classificationCategory;
  }

  const direct = DIRECT_CATEGORY_MAP[classificationCategory];
  if (direct) {
    return direct;
  }

  const fallback = resolveAchievementCategory(extraction);
  if (fallback) {
    if (isFacultySponsoredProjectContext(extraction) && fallback === 'Research') {
      return 'Faculty Achievement';
    }
    return fallback;
  }

  if (isIndustrialVisitContext('', extraction)) {
    return 'Industrial Visit';
  }

  return 'Research';
};
