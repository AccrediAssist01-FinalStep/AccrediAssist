import { ExtractionResult } from '../interfaces/extraction.interface';
import { isFacultySponsoredProjectContext } from './achievement-inference.util';

export const ACTIVITY_SUBCATEGORY = {
  MOU: 'MoU',
  STUDENT_SPONSORED_PROJECT: 'Student Sponsored Project',
  RESOURCE_PERSON: 'Resource Person',
  SESSION_CHAIR_REVIEWER: 'Session Chair / Reviewer',
} as const;

export const SPECIALIZED_ACTIVITY_SUBCATEGORIES = Object.values(ACTIVITY_SUBCATEGORY);

export type SessionRoleType = 'Session Chair' | 'Reviewer';

const collectText = (extraction: ExtractionResult, originalMessage = ''): string =>
  [
    originalMessage,
    extraction.title,
    extraction.description,
    extraction.categoryHint,
    extraction.organization,
    extraction.company,
    extraction.eventName,
  ]
    .filter((value): value is string => Boolean(value?.trim()))
    .join(' ')
    .toLowerCase();

export const isFacultyMouContext = (
  extraction: ExtractionResult,
  originalMessage = '',
): boolean => {
  const text = collectText(extraction, originalMessage);
  return /\b(mou|m\.o\.u\.|memorandum of understanding|moa)\b/i.test(text);
};

export const isFacultyResourcePersonContext = (
  extraction: ExtractionResult,
  originalMessage = '',
): boolean => {
  const text = collectText(extraction, originalMessage);
  return (
    /\bresource person\b/.test(text) ||
    /\binvited as (an? )?(expert|resource)\b/.test(text) ||
    /\bacted as (an? )?(expert|resource person)\b/.test(text) ||
    /\binvited resource person\b/.test(text)
  );
};

export const resolveSessionRoleType = (
  extraction: ExtractionResult,
  originalMessage = '',
): SessionRoleType | null => {
  const text = collectText(extraction, originalMessage);
  const isChair = /\bsession chair\b/.test(text) || /\bchaired (a |the )?session\b/.test(text);
  const isReviewer =
    /\breviewer\b/.test(text) ||
    /\breviewed (research )?papers?\b/.test(text) ||
    /\bpaper reviewer\b/.test(text);

  if (isReviewer && !isChair) {
    return 'Reviewer';
  }
  if (isChair) {
    return 'Session Chair';
  }
  if (isReviewer) {
    return 'Reviewer';
  }
  return null;
};

export const isSessionChairReviewerContext = (
  extraction: ExtractionResult,
  originalMessage = '',
): boolean => resolveSessionRoleType(extraction, originalMessage) !== null;

export const isStudentSponsoredProjectContext = (
  extraction: ExtractionResult,
  originalMessage = '',
): boolean => {
  if (isFacultySponsoredProjectContext(extraction, originalMessage)) {
    return false;
  }

  const text = collectText(extraction, originalMessage);
  const hasStudent =
    Boolean(extraction.studentNames?.length) || /\bstudent\b/.test(text);
  const hasSponsorship =
    /\b(sponsored project|project was sponsored|sponsorship of|sponsored by|sponsorship amount)\b/.test(
      text,
    ) || /\b₹\s?\d/.test(text);

  return hasStudent && hasSponsorship;
};

export const resolveSpecializedActivitySubCategory = (
  extraction: ExtractionResult,
  originalMessage = '',
): string | null => {
  if (isFacultyMouContext(extraction, originalMessage)) {
    return ACTIVITY_SUBCATEGORY.MOU;
  }
  if (isFacultyResourcePersonContext(extraction, originalMessage)) {
    return ACTIVITY_SUBCATEGORY.RESOURCE_PERSON;
  }
  if (isSessionChairReviewerContext(extraction, originalMessage)) {
    return ACTIVITY_SUBCATEGORY.SESSION_CHAIR_REVIEWER;
  }
  if (isStudentSponsoredProjectContext(extraction, originalMessage)) {
    return ACTIVITY_SUBCATEGORY.STUDENT_SPONSORED_PROJECT;
  }
  return null;
};
