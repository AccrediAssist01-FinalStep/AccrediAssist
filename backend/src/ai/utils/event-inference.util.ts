import { ExtractionResult } from '../interfaces/extraction.interface';

const INDUSTRIAL_VISIT_PATTERN =
  /\bindustrial\s+visit\b|\bindustry\s+visit\b|\bindustry\s+visit\s+report\b|\bindustrial\s+visit\s+report\b/i;

const collectIndustrialVisitText = (
  message: string,
  extraction: ExtractionResult,
): string =>
  [
    message,
    extraction.title,
    extraction.description,
    extraction.categoryHint,
    extraction.eventName,
    extraction.eventType,
    extraction.organization,
  ]
    .filter((value): value is string => Boolean(value?.trim()))
    .join(' ')
    .toLowerCase();

export const isIndustrialVisitContext = (
  message: string,
  extraction: ExtractionResult,
): boolean => {
  const text = collectIndustrialVisitText(message, extraction);
  if (!text) {
    return false;
  }

  if (INDUSTRIAL_VISIT_PATTERN.test(text)) {
    return true;
  }

  const hint = extraction.categoryHint?.trim().toLowerCase() ?? '';
  const eventType = extraction.eventType?.trim().toLowerCase() ?? '';
  return hint === 'industrial visit' || eventType === 'industrial visit';
};

export const enrichIndustrialVisitFields = (
  extraction: ExtractionResult,
  originalMessage: string,
): ExtractionResult => {
  if (!isIndustrialVisitContext(originalMessage, extraction)) {
    return extraction;
  }

  const result: ExtractionResult = { ...extraction };
  const message = originalMessage.trim();

  result.categoryHint = 'Industrial Visit';
  result.eventType = 'Industrial Visit';

  if (!result.eventName?.trim()) {
    result.eventName =
      result.title?.trim() ||
      (/\bindustry\s+visit\s+report\b/i.test(message)
        ? 'Department Industry Visit Report'
        : 'Industrial Visit');
  }

  if (!result.title?.trim()) {
    result.title = result.eventName;
  }

  if (!result.organization?.trim()) {
    const departmentMatch = message.match(
      /(?:the\s+)?([A-Za-z][A-Za-z\s&]+?\s+Engineering\s+Department|Department)/i,
    );
    result.organization = departmentMatch?.[1]?.trim() ?? 'Department';
  }

  if (!result.description?.trim() && message) {
    result.description = message.slice(0, 500);
  }

  return result;
};
