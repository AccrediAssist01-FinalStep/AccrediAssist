import { z } from 'zod';
import { ValidationError } from '../../utils/errors';
import { NEWS_ARTICLE_CATEGORIES } from '../../types/news.types';
import {
  NON_NEWSPAPER_IMAGE_TYPES,
  NewsDetectionResult,
} from '../interfaces/news-detection.interface';

const nullableString = z.preprocess(
  (value) => (value === '' || value === undefined ? null : value),
  z.string().nullable(),
);

const nullableStringArray = z.preprocess(
  (value) => {
    if (value === '' || value === undefined || value === null) {
      return null;
    }
    if (Array.isArray(value)) {
      return value.filter((item) => typeof item === 'string' && item.trim());
    }
    return null;
  },
  z.array(z.string()).nullable(),
);

const nullableConfidence = z.preprocess(
  (value) => (value === '' || value === undefined ? null : value),
  z.number().min(0).max(100).nullable(),
);

export const newsDetectionResultSchema = z.object({
  isNewspaperArticle: z.boolean(),
  rejectedImageType: z.enum(NON_NEWSPAPER_IMAGE_TYPES).nullable(),
  headline: nullableString,
  articleText: nullableString,
  language: nullableString,
  newspaperName: nullableString,
  publicationDate: nullableString,
  peopleMentioned: nullableStringArray,
  organization: nullableString,
  department: nullableString,
  articleCategory: z.enum(NEWS_ARTICLE_CATEGORIES).nullable(),
  summary: nullableString,
  confidence: nullableConfidence,
  reasoning: nullableString,
});

export const normalizeNewsDetectionResult = (payload: unknown): NewsDetectionResult => {
  const parsed = newsDetectionResultSchema.safeParse(payload);

  if (!parsed.success) {
    throw new ValidationError('Gemini news detection response failed validation', [
      parsed.error.message,
    ]);
  }

  return parsed.data;
};

/** Casual image types that should not enter any ERP pipeline. */
const CASUAL_IMAGE_TYPES = new Set<NewsDetectionResult['rejectedImageType']>([
  'selfie',
  'meme',
  'random_image',
  'whatsapp_screenshot',
]);

/** Institutional image types that should continue through the standard AI pipeline. */
export const isInstitutionalImageType = (
  rejectedImageType: NewsDetectionResult['rejectedImageType'],
): boolean =>
  Boolean(rejectedImageType) && !CASUAL_IMAGE_TYPES.has(rejectedImageType);

export const shouldIgnoreRejectedImage = (result: NewsDetectionResult): boolean =>
  !result.isNewspaperArticle &&
  Boolean(result.rejectedImageType) &&
  CASUAL_IMAGE_TYPES.has(result.rejectedImageType) &&
  (result.confidence ?? 0) >= 60;
