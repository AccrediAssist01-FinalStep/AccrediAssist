import { ExtractionResult } from '../interfaces/extraction.interface';
import { logger } from '../../utils/logger';
import { enrichIndustrialVisitFields } from './event-inference.util';

const FACULTY_CONTEXT_PATTERN =
  /\b(faculty member|faculty of|faculty member of|professor|prof\.|dr\.|department of)\b/i;
const PATENT_PATTERN = /\bpatent\b/i;
const PUBLICATION_PATTERN = /\b(publication|published|journal paper|research paper)\b/i;

const NAME_BLOCKLIST = new Set([
  'Heartiest',
  'Your',
  'Mechanical',
  'Engineering',
  'Department',
  'Congratulations',
  'Keep',
  'Final',
  'National',
  'Board',
  'Successful',
  'Industry',
  'Visit',
  'Report',
]);

const isLikelyPersonName = (value: string): boolean => {
  const name = value.trim();
  if (!name || name.length < 2 || NAME_BLOCKLIST.has(name)) {
    return false;
  }

  return /^[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?$/.test(name);
};

const collectRegexMatches = (text: string, pattern: RegExp, groupIndex = 1): string[] => {
  const matches: string[] = [];

  if (pattern.global) {
    for (const match of text.matchAll(pattern)) {
      const candidate = match[groupIndex]?.trim();
      if (candidate) {
        matches.push(candidate);
      }
    }
    return matches;
  }

  const match = text.match(pattern);
  const candidate = match?.[groupIndex]?.trim();
  return candidate ? [candidate] : [];
};

const extractFacultyNamesFromText = (text: string): string[] => {
  const names = new Set<string>();

  const patterns = [
    /(?:Dr\.?|Prof\.?|Professor)\s*(?:\/(?:Dr\.?|Prof\.?))?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s*,\s*a\s+(?:proud\s+)?faculty\s+member/gi,
    /Congratulations\s+to\s+(?:Dr\.?\/Prof\.?\s+)?([A-Z][a-z]+)/gi,
    /Heartiest congratulations to\s+([A-Z][a-z]+)/gi,
    /,\s*([A-Z][a-z]+)!\s*Keep\s+shining/gi,
  ];

  for (const pattern of patterns) {
    for (const candidate of collectRegexMatches(text, pattern)) {
      if (isLikelyPersonName(candidate)) {
        names.add(candidate);
      }
    }
  }

  return [...names];
};

export const enrichExtractionFields = (
  extraction: ExtractionResult,
  originalMessage: string,
): ExtractionResult => {
  try {
    const result: ExtractionResult = { ...extraction };
    const message = originalMessage.trim();

    const inferredFaculty = extractFacultyNamesFromText(message);
    if (inferredFaculty.length > 0) {
      result.facultyNames = [...new Set([...(result.facultyNames ?? []), ...inferredFaculty])];
    }

    const isFacultyContext =
      FACULTY_CONTEXT_PATTERN.test(message) || Boolean(result.facultyNames?.length);
    const mentionsPatent = PATENT_PATTERN.test(message);
    const mentionsPublication = PUBLICATION_PATTERN.test(message);

    if (mentionsPatent) {
      if (!result.patentTitle?.trim() && result.title?.trim()) {
        result.patentTitle = result.title.trim();
      }

      if (!result.patentTitle?.trim()) {
        const faculty = result.facultyNames?.[0];
        result.patentTitle = faculty
          ? `Patent secured by ${faculty}`
          : 'Faculty patent achievement';
      }

      if (!result.title?.trim()) {
        result.title = result.patentTitle;
      }

      if (!result.categoryHint?.trim()) {
        result.categoryHint = 'Patent';
      }
    }

    if (mentionsPublication) {
      if (!result.publicationTitle?.trim() && result.title?.trim()) {
        result.publicationTitle = result.title.trim();
      }

      if (!result.categoryHint?.trim()) {
        result.categoryHint = 'Publication';
      }
    }

    if (isFacultyContext) {
      const departmentMatch = message.match(
        /Department of\s+([A-Za-z][A-Za-z\s&]+?)(?:,|\.|\s+for|\s+has|\s+have|$)/i,
      );
      if (departmentMatch?.[1]) {
        result.organization = result.organization ?? departmentMatch[1].trim();
      }
    }

    if (isFacultyContext && !result.achievementType && !mentionsPatent && !mentionsPublication) {
      result.achievementType = 'Award';
    }

    return enrichIndustrialVisitFields(result, message);
  } catch (error) {
    logger.warn('Extraction enrichment failed; continuing with raw extraction', {
      error: error instanceof Error ? error.message : String(error),
    });
    return extraction;
  }
};
