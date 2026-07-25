import { RECORD_CATEGORIES, RecordCategory } from '../../database/enums';
import { ClassificationCategory } from '../interfaces/classification.interface';
import { ExtractionResult } from '../interfaces/extraction.interface';

const DIRECT_CATEGORY_MAP: Record<Exclude<ClassificationCategory, 'Other'>, RecordCategory> = {
  'Student Achievement': 'Student Achievement',
  'Faculty Achievement': 'Faculty Achievement',
  Placement: 'Placement',
  Internship: 'Internship',
  Workshop: 'Workshop',
  Seminar: 'Seminar',
  'Industrial Visit': 'Industrial Visit',
  Publication: 'Publication',
  Patent: 'Patent',
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
  if (classificationCategory !== 'Other') {
    return DIRECT_CATEGORY_MAP[classificationCategory];
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
