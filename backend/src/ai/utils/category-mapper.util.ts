import { EVENT_TYPES, EventType, RECORD_CATEGORIES, RecordCategory } from '../../database/enums';
import { ClassificationCategory } from '../interfaces/classification.interface';
import { ExtractionResult } from '../interfaces/extraction.interface';

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

const resolveCompletedEventCategory = (extraction: ExtractionResult): RecordCategory => {
  const eventType = extraction.eventType?.trim();
  if (eventType && EVENT_TYPE_SET.has(eventType)) {
    return eventType as EventType;
  }

  const categoryHint = extraction.categoryHint?.trim();
  if (categoryHint === 'Seminar') {
    return 'Seminar';
  }
  if (categoryHint === 'Industrial Visit') {
    return 'Industrial Visit';
  }

  return 'Workshop';
};

const ACHIEVEMENT_TYPE_MAP: Record<string, RecordCategory> = {
  Sports: 'Sports',
  Cultural: 'Cultural',
  Certification: 'Certification',
  Research: 'Research',
  Technical: 'Student Achievement',
  Hackathon: 'Student Achievement',
  Award: 'Faculty Achievement',
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

  const direct = DIRECT_CATEGORY_MAP[classificationCategory];
  if (direct) {
    return direct;
  }

  const categoryHint = extraction.categoryHint?.trim();
  if (categoryHint && isRecordCategory(categoryHint)) {
    return categoryHint;
  }

  const achievementType = extraction.achievementType?.trim();
  if (achievementType && ACHIEVEMENT_TYPE_MAP[achievementType]) {
    return ACHIEVEMENT_TYPE_MAP[achievementType];
  }

  return 'Research';
};
