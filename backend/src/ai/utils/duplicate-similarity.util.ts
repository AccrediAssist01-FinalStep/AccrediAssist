import { env } from '../../config/env';

export const DEFAULT_DUPLICATE_THRESHOLD = 80;

export const getDuplicateThreshold = (): number => env.AI_DUPLICATE_THRESHOLD;

export const toStringValue = (value: unknown): string | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

export const toStringArray = (value: unknown): string[] | null => {
  if (Array.isArray(value)) {
    const normalized = value
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter(Boolean);

    return normalized.length > 0 ? normalized : null;
  }

  const single = toStringValue(value);
  return single ? [single] : null;
};

export const normalizeText = (value: string): string =>
  value.trim().toLowerCase().replace(/\s+/g, ' ');

export const stringSimilarity = (left: string | null, right: string | null): number => {
  if (!left || !right) {
    return 0;
  }

  const normalizedLeft = normalizeText(left);
  const normalizedRight = normalizeText(right);

  if (normalizedLeft === normalizedRight) {
    return 100;
  }

  if (
    normalizedLeft.includes(normalizedRight) ||
    normalizedRight.includes(normalizedLeft)
  ) {
    return 90;
  }

  const leftTokens = new Set(normalizedLeft.split(' '));
  const rightTokens = new Set(normalizedRight.split(' '));
  const intersection = [...leftTokens].filter((token) => rightTokens.has(token));
  const union = new Set([...leftTokens, ...rightTokens]);

  if (union.size === 0) {
    return 0;
  }

  return Math.round((intersection.length / union.size) * 100);
};

export const arraySimilarity = (
  left: string[] | null,
  right: string[] | null,
): number => {
  if (!left?.length || !right?.length) {
    return 0;
  }

  let bestScore = 0;

  for (const leftValue of left) {
    for (const rightValue of right) {
      bestScore = Math.max(bestScore, stringSimilarity(leftValue, rightValue));
    }
  }

  return bestScore;
};

const CATEGORY_FIELD_WEIGHTS: Record<string, Record<string, number>> = {
  Placement: {
    studentNames: 30,
    company: 30,
    placement: 20,
    title: 10,
    date: 10,
  },
  Internship: {
    studentNames: 30,
    company: 30,
    internship: 20,
    date: 20,
  },
  'Student Achievement': {
    studentNames: 30,
    title: 25,
    eventName: 20,
    achievementType: 15,
    date: 10,
  },
  'Faculty Achievement': {
    facultyNames: 30,
    title: 30,
    organization: 20,
    date: 20,
  },
  Workshop: {
    eventName: 35,
    title: 25,
    eventType: 15,
    location: 15,
    date: 10,
  },
  Seminar: {
    eventName: 35,
    title: 25,
    organization: 20,
    date: 20,
  },
  'Industrial Visit': {
    company: 30,
    eventName: 25,
    title: 15,
    location: 20,
    date: 10,
  },
  Publication: {
    facultyNames: 25,
    publicationTitle: 45,
    organization: 15,
    date: 15,
  },
  Patent: {
    patentTitle: 50,
    facultyNames: 30,
    date: 20,
  },
  Other: {
    title: 40,
    description: 35,
    date: 25,
  },
};

export const toComparableFields = (
  extractedData: Record<string, unknown>,
): Record<string, string | string[] | null> => ({
  title: toStringValue(extractedData.title),
  description: toStringValue(extractedData.description),
  studentNames: toStringArray(extractedData.studentNames),
  facultyNames: toStringArray(extractedData.facultyNames),
  company: toStringValue(extractedData.company),
  organization: toStringValue(extractedData.organization),
  eventName: toStringValue(extractedData.eventName),
  eventType: toStringValue(extractedData.eventType),
  achievementType: toStringValue(extractedData.achievementType),
  publicationTitle: toStringValue(extractedData.publicationTitle),
  patentTitle: toStringValue(extractedData.patentTitle),
  internship: toStringValue(extractedData.internship),
  placement: toStringValue(extractedData.placement),
  date: toStringValue(extractedData.date),
  location: toStringValue(extractedData.location),
});

export const calculateSimilarityScore = (
  category: string,
  source: Record<string, string | string[] | null>,
  target: Record<string, string | string[] | null>,
): number => {
  const weights = CATEGORY_FIELD_WEIGHTS[category] ?? CATEGORY_FIELD_WEIGHTS.Other;
  let weightedScore = 0;
  let totalWeight = 0;

  for (const [field, weight] of Object.entries(weights)) {
    const sourceValue = source[field];
    const targetValue = target[field];

    if (!sourceValue || !targetValue) {
      continue;
    }

    const score =
      Array.isArray(sourceValue) || Array.isArray(targetValue)
        ? arraySimilarity(
            Array.isArray(sourceValue) ? sourceValue : [sourceValue],
            Array.isArray(targetValue) ? targetValue : [targetValue],
          )
        : stringSimilarity(sourceValue, targetValue);

    weightedScore += score * weight;
    totalWeight += weight;
  }

  if (totalWeight === 0) {
    return 0;
  }

  return Math.round(weightedScore / totalWeight);
};
