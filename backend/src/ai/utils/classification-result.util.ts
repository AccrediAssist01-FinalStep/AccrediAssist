import { z } from 'zod';
import { ValidationError } from '../../utils/errors';
import {
  CLASSIFICATION_CATEGORIES,
  ClassificationCategory,
  ClassificationResult,
} from '../interfaces/classification.interface';

const nullableString = z.preprocess(
  (value) => (value === '' || value === undefined ? null : value),
  z.string().nullable(),
);

const nullableConfidence = z.preprocess(
  (value) => (value === '' || value === undefined ? null : value),
  z.number().min(0).max(100).nullable(),
);

export const classificationResultSchema = z.object({
  category: z.enum(CLASSIFICATION_CATEGORIES),
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
