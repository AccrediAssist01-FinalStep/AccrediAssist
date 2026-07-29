import { AchievementType } from '../../database/enums';
import { ExtractionResult } from '../interfaces/extraction.interface';

const SPORTS_KEYWORDS = [
  'badminton',
  'cricket',
  'football',
  'volleyball',
  'basketball',
  'tennis',
  'table tennis',
  'athletics',
  'sports meet',
  'sports day',
  'inter-college sports',
  'kho-kho',
  'kabaddi',
  'hockey',
  'swimming',
  'wrestling',
  'boxing',
  'marathon',
  'relay',
  'shot put',
  'long jump',
  'high jump',
  'chess tournament',
  'carrom',
];

const CULTURAL_KEYWORDS = [
  'cultural fest',
  'cultural event',
  'dance',
  'singing',
  'music competition',
  'drama',
  'theatre',
  'theater',
  'nss',
  'ncc',
  'rangoli',
  'debate competition',
  'elocution',
];

const CERTIFICATION_KEYWORDS = [
  'certification',
  'certified',
  'certificate course',
  'nptel',
  'coursera',
  'udemy',
];

const RESEARCH_KEYWORDS = [
  'research paper',
  'journal paper',
  'conference paper',
  'thesis',
  'dissertation',
];

const HACKATHON_KEYWORDS = ['hackathon', 'startup', 'innovation challenge', 'ideathon'];

const collectSearchText = (extraction: ExtractionResult): string =>
  [
    extraction.title,
    extraction.description,
    extraction.categoryHint,
    extraction.eventName,
    extraction.organization,
  ]
    .filter((value): value is string => Boolean(value?.trim()))
    .join(' ')
    .toLowerCase();

const matchesKeywords = (text: string, keywords: string[]): boolean =>
  keywords.some((keyword) => text.includes(keyword));

export const inferAchievementTypeFromText = (
  extraction: ExtractionResult,
): AchievementType | null => {
  const text = collectSearchText(extraction);

  if (!text) {
    return null;
  }

  if (matchesKeywords(text, SPORTS_KEYWORDS) || /\bsports?\b/.test(text)) {
    return 'Sports';
  }

  if (matchesKeywords(text, CULTURAL_KEYWORDS)) {
    return 'Cultural';
  }

  if (matchesKeywords(text, CERTIFICATION_KEYWORDS)) {
    return 'Certification';
  }

  if (matchesKeywords(text, HACKATHON_KEYWORDS)) {
    return 'Hackathon';
  }

  if (matchesKeywords(text, RESEARCH_KEYWORDS)) {
    return 'Research';
  }

  return null;
};

export const enrichExtractionAchievementType = (
  extraction: ExtractionResult,
): ExtractionResult => {
  const current = extraction.achievementType?.trim();

  if (current && current !== 'Technical') {
    return extraction;
  }

  const inferred = inferAchievementTypeFromText(extraction);
  if (!inferred) {
    return extraction;
  }

  return {
    ...extraction,
    achievementType: inferred,
    categoryHint: extraction.categoryHint ?? inferred,
  };
};
