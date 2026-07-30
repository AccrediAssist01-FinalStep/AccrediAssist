import type { AggregationFilters, ResolvedDateRange } from '../interfaces/aggregation.interface';
import type { ModuleAggregationConfig } from '../interfaces/aggregation.interface';
import { ACTIVE_MATCH } from '../../../dashboard/utils/dashboard-aggregation.util';

const escapeRegex = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const buildBaseFieldMatch = (
  config: ModuleAggregationConfig,
  filters: AggregationFilters,
): Record<string, unknown> => {
  const match: Record<string, unknown> = { ...ACTIVE_MATCH };

  if (filters.department && config.departmentField) {
    match[config.departmentField] = {
      $regex: `^${escapeRegex(filters.department)}$`,
      $options: 'i',
    };
  }

  if (filters.category && config.categoryField) {
    match[config.categoryField] = {
      $regex: `^${escapeRegex(filters.category)}$`,
      $options: 'i',
    };
  }

  if (filters.eventType && config.key === 'completedEventReports') {
    match.eventType = {
      $regex: `^${escapeRegex(filters.eventType)}$`,
      $options: 'i',
    };
  }

  if (filters.keyword?.trim()) {
    const keyword = escapeRegex(filters.keyword.trim());
    match.$or = [
      { title: { $regex: keyword, $options: 'i' } },
      { eventTitle: { $regex: keyword, $options: 'i' } },
      { studentName: { $regex: keyword, $options: 'i' } },
      { facultyName: { $regex: keyword, $options: 'i' } },
      { company: { $regex: keyword, $options: 'i' } },
      { organization: { $regex: keyword, $options: 'i' } },
      { headline: { $regex: keyword, $options: 'i' } },
      { paperTitle: { $regex: keyword, $options: 'i' } },
      { patentTitle: { $regex: keyword, $options: 'i' } },
      { description: { $regex: keyword, $options: 'i' } },
      { summary: { $regex: keyword, $options: 'i' } },
    ];
  }

  if (filters.faculty && config.facultyField) {
    match[config.facultyField] = {
      $regex: escapeRegex(filters.faculty),
      $options: 'i',
    };
  }

  if (filters.student && config.studentField) {
    match[config.studentField] = {
      $regex: escapeRegex(filters.student),
      $options: 'i',
    };
  }

  return match;
};

export const buildDateMatchStage = (
  range: ResolvedDateRange,
): Record<string, unknown> | null => {
  if (!range.start && !range.end) {
    return null;
  }

  const dateCriteria: Record<string, Date> = {};
  if (range.start) dateCriteria.$gte = range.start;
  if (range.end) dateCriteria.$lte = range.end;

  return { normalizedDate: dateCriteria };
};

export const buildPreviousPeriodMatchStage = (
  range: ResolvedDateRange,
): Record<string, unknown> | null => {
  if (!range.previousStart && !range.previousEnd) {
    return null;
  }

  const dateCriteria: Record<string, Date> = {};
  if (range.previousStart) dateCriteria.$gte = range.previousStart;
  if (range.previousEnd) dateCriteria.$lte = range.previousEnd;

  return { normalizedDate: dateCriteria };
};

export const normalizeFilters = (filters: AggregationFilters): AggregationFilters => ({
  ...filters,
  department: filters.department?.trim() || undefined,
  academicYear: filters.academicYear?.trim() || undefined,
  category: filters.category?.trim() || undefined,
  eventType: filters.eventType?.trim() || undefined,
  faculty: filters.faculty?.trim() || undefined,
  student: filters.student?.trim() || undefined,
  keyword: filters.keyword?.trim() || undefined,
});
