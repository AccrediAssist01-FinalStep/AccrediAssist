import { z } from 'zod';
import { ValidationError } from '../../utils/errors';
import { ExtractionResult } from '../interfaces/extraction.interface';

const nullableString = z.preprocess(
  (value) => (value === '' || value === undefined ? null : value),
  z.string().nullable(),
);

const nullableStringArray = z.preprocess(
  (value) => {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    if (Array.isArray(value)) {
      const filtered = value.filter((item) => typeof item === 'string' && item.trim().length > 0);
      return filtered.length > 0 ? filtered : null;
    }

    if (typeof value === 'string') {
      return [value];
    }

    return null;
  },
  z.array(z.string()).nullable(),
);

const nullableConfidence = z.preprocess(
  (value) => (value === '' || value === undefined ? null : value),
  z.number().min(0).max(100).nullable(),
);

export const extractionResultSchema = z.object({
  title: nullableString,
  description: nullableString,
  categoryHint: nullableString,
  studentNames: nullableStringArray,
  facultyNames: nullableStringArray,
  company: nullableString,
  organization: nullableString,
  eventName: nullableString,
  eventType: nullableString,
  achievementType: nullableString,
  publicationTitle: nullableString,
  patentTitle: nullableString,
  internship: nullableString,
  placement: nullableString,
  certificates: nullableStringArray,
  mediaReferences: nullableStringArray,
  date: nullableString,
  location: nullableString,
  confidence: nullableConfidence,
});

export const normalizeExtractionResult = (payload: unknown): ExtractionResult => {
  const parsed = extractionResultSchema.safeParse(payload);

  if (!parsed.success) {
    throw new ValidationError('Gemini extraction response failed validation', [
      parsed.error.message,
    ]);
  }

  return parsed.data;
};

export const EXTRACTION_RESULT_KEYS: Array<keyof ExtractionResult> = [
  'title',
  'description',
  'categoryHint',
  'studentNames',
  'facultyNames',
  'company',
  'organization',
  'eventName',
  'eventType',
  'achievementType',
  'publicationTitle',
  'patentTitle',
  'internship',
  'placement',
  'certificates',
  'mediaReferences',
  'date',
  'location',
  'confidence',
];
