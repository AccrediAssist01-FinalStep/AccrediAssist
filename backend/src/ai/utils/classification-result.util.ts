import { z } from 'zod';
import { ValidationError } from '../../utils/errors';
import {
  CLASSIFICATION_CATEGORIES,
  ClassificationCategory,
  ClassificationResult,
  LEGACY_CLASSIFICATION_CATEGORIES,
} from '../interfaces/classification.interface';

const nullableString = z.preprocess(
  (value) => (value === '' || value === undefined ? null : value),
  z.string().nullable(),
);

const nullableConfidence = z.preprocess(
  (value) => (value === '' || value === undefined ? null : value),
  z.number().min(0).max(100).nullable(),
);

const LEGACY_CATEGORY_MAP: Record<string, ClassificationCategory> = {
  Workshop: 'Completed Event Report',
  Seminar: 'Completed Event Report',
  'Industrial Visit': 'Completed Event Report',
  Other: 'Completed Event Report',
};

const normalizeCategory = (value: unknown): unknown => {
  if (typeof value !== 'string') {
    return value;
  }

  const trimmed = value.trim();
  if ((CLASSIFICATION_CATEGORIES as readonly string[]).includes(trimmed)) {
    return trimmed;
  }

  if ((LEGACY_CLASSIFICATION_CATEGORIES as readonly string[]).includes(trimmed)) {
    return LEGACY_CATEGORY_MAP[trimmed];
  }

  return trimmed;
};

export const classificationResultSchema = z.object({
  category: z.preprocess(
    normalizeCategory,
    z.enum(CLASSIFICATION_CATEGORIES),
  ),
  confidence: nullableConfidence,
  reasoning: nullableString,
});

export const normalizeClassificationResult = (payload: unknown): ClassificationResult => {
  const parsed = classificationResultSchema.safeParse(payload);

  if (!parsed.success) {
    throw new ValidationError('Gemini classification response failed validation', [
      parsed.error.message,
    ]);
  }

  return parsed.data;
};

export const isClassificationCategory = (value: string): value is ClassificationCategory =>
  (CLASSIFICATION_CATEGORIES as readonly string[]).includes(value);

export const CLASSIFICATION_RESULT_KEYS: Array<keyof ClassificationResult> = [
  'category',
  'confidence',
  'reasoning',
];
