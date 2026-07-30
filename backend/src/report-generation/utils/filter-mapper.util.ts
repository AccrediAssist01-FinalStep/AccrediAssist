import type { AggregationFilters } from '../aggregation/interfaces/aggregation.interface';
import { ReportGenerationFilters } from '../interfaces/report-generation.interface';

const MONTH_INDEX: Record<string, number> = {
  january: 1,
  jan: 1,
  february: 2,
  feb: 2,
  march: 3,
  mar: 3,
  april: 4,
  apr: 4,
  may: 5,
  june: 6,
  jun: 6,
  july: 7,
  jul: 7,
  august: 8,
  aug: 8,
  september: 9,
  sep: 9,
  sept: 9,
  october: 10,
  oct: 10,
  november: 11,
  nov: 11,
  december: 12,
  dec: 12,
};

export const resolveMonthYearRange = (
  month?: string,
  year?: number,
): { startDate?: Date; endDate?: Date } => {
  if (!month?.trim() || !year) {
    return {};
  }

  const numericMonth = Number(month);
  const monthIndex =
    !Number.isNaN(numericMonth) && numericMonth >= 1 && numericMonth <= 12
      ? numericMonth
      : MONTH_INDEX[month.trim().toLowerCase()];

  if (!monthIndex) {
    return {};
  }

  return {
    startDate: new Date(Date.UTC(year, monthIndex - 1, 1)),
    endDate: new Date(Date.UTC(year, monthIndex, 0, 23, 59, 59, 999)),
  };
};

/** Maps report-generation filters to aggregation filters, including month/year resolution. */
export const mapToAggregationFilters = (filters: ReportGenerationFilters): AggregationFilters => {
  const monthYearRange = resolveMonthYearRange(filters.month, filters.year);

  return {
    department: filters.department,
    academicYear: filters.academicYear,
    semester: filters.semester,
    category: filters.category,
    faculty: filters.faculty,
    student: filters.student,
    keyword: filters.keyword,
    startDate: filters.startDate ?? monthYearRange.startDate,
    endDate: filters.endDate ?? monthYearRange.endDate,
  };
};

/** Returns true when redirecting to an external file URL is permitted. */
export const isAllowedExternalDownloadUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') {
      return false;
    }

    const host = parsed.hostname.toLowerCase();
    return (
      host === 'cloudinary.com' ||
      host.endsWith('.cloudinary.com') ||
      host.endsWith('.amazonaws.com')
    );
  } catch {
    return false;
  }
};
