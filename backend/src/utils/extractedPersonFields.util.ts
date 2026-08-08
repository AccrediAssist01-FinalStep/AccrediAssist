import { toStringArray, toStringValue } from '../ai/utils/duplicate-similarity.util';

export const normalizeExtractedPersonFields = (
  data: Record<string, unknown>,
): Record<string, unknown> => {
  const next = { ...data };
  const structured =
    typeof next.structuredData === 'object' && next.structuredData !== null
      ? (next.structuredData as Record<string, unknown>)
      : {};

  const facultyFromArray = toStringArray(next.facultyNames)?.[0] ?? null;
  const facultyFromStructured = toStringValue(structured.facultyName);
  next.facultyName =
    toStringValue(next.facultyName) ?? facultyFromArray ?? facultyFromStructured ?? undefined;

  const studentFromArray = toStringArray(next.studentNames)?.[0] ?? null;
  const studentFromStructured = toStringValue(structured.studentName);
  next.studentName =
    toStringValue(next.studentName) ?? studentFromArray ?? studentFromStructured ?? undefined;

  if (facultyFromArray && !toStringArray(next.facultyNames)?.length) {
    next.facultyNames = [next.facultyName as string];
  }

  if (studentFromArray && !toStringArray(next.studentNames)?.length) {
    next.studentNames = [next.studentName as string];
  }

  return next;
};

export const getFacultyNameFromExtractedData = (data: Record<string, unknown>): string | null => {
  const normalized = normalizeExtractedPersonFields(data);
  return toStringValue(normalized.facultyName);
};

export const getStudentNameFromExtractedData = (data: Record<string, unknown>): string | null => {
  const normalized = normalizeExtractedPersonFields(data);
  return toStringValue(normalized.studentName);
};
