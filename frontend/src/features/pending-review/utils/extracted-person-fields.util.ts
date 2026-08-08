import type { PendingRecordExtractedData } from '@/types/api-models';

export const resolveFacultyName = (data?: PendingRecordExtractedData | Record<string, unknown>): string => {
  if (!data) return '';

  const record = data as Record<string, unknown>;
  const direct = record.facultyName;
  if (direct != null && String(direct).trim()) {
    return String(direct).trim();
  }

  const names = record.facultyNames;
  if (Array.isArray(names) && names[0]) {
    return String(names[0]).trim();
  }

  const structured = record.structuredData as Record<string, unknown> | undefined;
  if (structured?.facultyName != null && String(structured.facultyName).trim()) {
    return String(structured.facultyName).trim();
  }

  return '';
};

export const resolveStudentName = (data?: PendingRecordExtractedData | Record<string, unknown>): string => {
  if (!data) return '';

  const record = data as Record<string, unknown>;
  const direct = record.studentName;
  if (direct != null && String(direct).trim()) {
    return String(direct).trim();
  }

  const names = record.studentNames;
  if (Array.isArray(names) && names[0]) {
    return String(names[0]).trim();
  }

  const structured = record.structuredData as Record<string, unknown> | undefined;
  if (structured?.studentName != null && String(structured.studentName).trim()) {
    return String(structured.studentName).trim();
  }

  return '';
};
