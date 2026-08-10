import type { ReportColumnDefinition } from '../config/report-module-columns.config';

export const formatReportDate = (value: unknown): string => {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const formatReportFieldValue = (
  record: Record<string, unknown>,
  column: ReportColumnDefinition,
): string => {
  const value = record[column.key];

  if (value === null || value === undefined || value === '') {
    return '—';
  }

  if (column.format === 'date') {
    return formatReportDate(value);
  }

  if (column.format === 'list' || Array.isArray(value)) {
    if (Array.isArray(value)) {
      return value.length > 0 ? value.map(String).join(', ') : '—';
    }
    return String(value);
  }

  return String(value);
};

export const extractReportRowValues = (
  record: Record<string, unknown>,
  columns: ReportColumnDefinition[],
): string[] => columns.map((column) => formatReportFieldValue(record, column));

export const resolveReportRowSortDate = (
  record: Record<string, unknown>,
  columns: ReportColumnDefinition[],
): number => {
  for (const column of columns) {
    if (column.format === 'date') {
      const raw = record[column.key];
      if (raw) {
        const date = raw instanceof Date ? raw : new Date(String(raw));
        if (!Number.isNaN(date.getTime())) {
          return date.getTime();
        }
      }
    }
  }

  const fallback = record.date ?? record.joiningDate ?? record.startDate ?? record.publicationDate ?? record.filingDate;
  if (!fallback) return 0;
  const date = fallback instanceof Date ? fallback : new Date(String(fallback));
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
};
