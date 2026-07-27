import type { AggregationFilters, ResolvedDateRange } from '../interfaces/aggregation.interface';
import { BadRequestError } from '../../../utils/errors';

const MONTH_LABELS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

export const formatMonthPeriod = (year: number, month: number): string =>
  `${MONTH_LABELS[month - 1] ?? month} ${year}`;

/**
 * Resolves academic year strings:
 * - "2024-2025" → Jun 1 2024 – May 31 2025
 * - "2024"      → Jan 1 2024 – Dec 31 2024
 */
export const resolveAcademicYearRange = (academicYear: string): { start: Date; end: Date } => {
  const rangeMatch = /^(\d{4})-(\d{4})$/.exec(academicYear.trim());
  if (rangeMatch) {
    const startYear = Number(rangeMatch[1]);
    const endYear = Number(rangeMatch[2]);
    return {
      start: new Date(Date.UTC(startYear, 5, 1)),
      end: new Date(Date.UTC(endYear, 4, 31, 23, 59, 59, 999)),
    };
  }

  const singleYear = Number(academicYear.trim());
  if (!Number.isNaN(singleYear) && singleYear >= 1900 && singleYear <= 2100) {
    return {
      start: new Date(Date.UTC(singleYear, 0, 1)),
      end: new Date(Date.UTC(singleYear, 11, 31, 23, 59, 59, 999)),
    };
  }

  throw new BadRequestError(
    `Invalid academic year format: "${academicYear}". Use "YYYY-YYYY" or a four-digit year.`,
  );
};

/** Semester within academic year: 1 = Jun–Nov, 2 = Dec–May */
export const resolveSemesterRange = (
  academicYear: string,
  semester: 1 | 2,
): { start: Date; end: Date } => {
  const { start: ayStart, end: ayEnd } = resolveAcademicYearRange(academicYear);

  if (semester === 1) {
    return {
      start: ayStart,
      end: new Date(Date.UTC(ayStart.getUTCFullYear(), 10, 30, 23, 59, 59, 999)),
    };
  }

  const secondSemesterStartYear =
    ayEnd.getUTCFullYear() === ayStart.getUTCFullYear()
      ? ayStart.getUTCFullYear()
      : ayEnd.getUTCFullYear();

  return {
    start: new Date(Date.UTC(secondSemesterStartYear, 11, 1)),
    end: ayEnd,
  };
};

export const resolveDateRange = (filters: AggregationFilters): ResolvedDateRange => {
  if (filters.startDate || filters.endDate) {
    const start = filters.startDate;
    const end = filters.endDate ?? filters.startDate;
    const durationMs =
      start && end ? end.getTime() - start.getTime() : undefined;

    return {
      start,
      end,
      previousEnd: start && durationMs !== undefined ? new Date(start.getTime() - 1) : undefined,
      previousStart:
        start && durationMs !== undefined
          ? new Date(start.getTime() - durationMs - 1)
          : undefined,
      label: 'custom',
    };
  }

  if (filters.academicYear && filters.semester) {
    const { start, end } = resolveSemesterRange(filters.academicYear, filters.semester);
    const durationMs = end.getTime() - start.getTime();
    return {
      start,
      end,
      previousEnd: new Date(start.getTime() - 1),
      previousStart: new Date(start.getTime() - durationMs - 1),
      label: `${filters.academicYear} S${filters.semester}`,
    };
  }

  if (filters.academicYear) {
    const { start, end } = resolveAcademicYearRange(filters.academicYear);
    const durationMs = end.getTime() - start.getTime();
    return {
      start,
      end,
      previousEnd: new Date(start.getTime() - 1),
      previousStart: new Date(start.getTime() - durationMs - 1),
      label: filters.academicYear,
    };
  }

  return {};
};

export const isDateWithinRange = (
  value: Date | undefined,
  range: ResolvedDateRange,
): boolean => {
  if (!value) return !range.start && !range.end;
  if (range.start && value < range.start) return false;
  if (range.end && value > range.end) return false;
  return true;
};
