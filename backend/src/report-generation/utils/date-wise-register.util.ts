import type { ReportAggregationResult } from '../aggregation/interfaces/aggregation.interface';
import {
  getReportSectionDefinitions,
  type ReportSectionDefinition,
} from '../config/report-sections.config';
import type { DateWiseActivityRegister } from '../interfaces/report-data.interface';

const extractYear = (value: unknown): string => {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? '—' : String(date.getUTCFullYear());
};

const formatDate = (value: unknown): string => {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const resolveSortableDate = (record: Record<string, unknown>): number => {
  const raw = record.date ?? record.joiningDate ?? record.startDate ?? record.endDate;
  if (!raw) return 0;
  const date = raw instanceof Date ? raw : new Date(String(raw));
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
};

const formatMonthGroup = (sortDate: number): string => {
  if (!sortDate) return 'Undated';
  return new Date(sortDate).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
};

const getCategoryValue = (record: Record<string, unknown>): string => {
  const value =
    record.achievementType ??
    record.eventType ??
    record.status ??
    record.articleCategory ??
    '';
  return String(value);
};

const matchesCategory = (record: Record<string, unknown>, match?: string | string[]): boolean => {
  if (!match) return true;
  const values = Array.isArray(match) ? match : [match];
  const category = getCategoryValue(record);
  return values.some((item) => category.toLowerCase() === item.toLowerCase());
};

const matchesTitlePattern = (record: Record<string, unknown>, pattern?: RegExp): boolean => {
  if (!pattern) return true;
  const haystack = [
    record.title,
    record.eventTitle,
    record.paperTitle,
    record.patentTitle,
    record.headline,
    record.description,
    record.summary,
  ]
    .filter(Boolean)
    .join(' ');
  return pattern.test(haystack);
};

const matchesKeyword = (record: Record<string, unknown>, keyword?: string): boolean => {
  if (!keyword?.trim()) return true;
  const pattern = new RegExp(keyword.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  return Object.values(record).some((value) => {
    if (typeof value === 'string') return pattern.test(value);
    if (Array.isArray(value)) return value.some((item) => typeof item === 'string' && pattern.test(item));
    return false;
  });
};

const filterRecordsForSection = (
  records: Record<string, unknown>[],
  section: ReportSectionDefinition,
  keyword?: string,
): Record<string, unknown>[] =>
  records.filter(
    (record) =>
      matchesCategory(record, section.categoryMatch) &&
      matchesTitlePattern(record, section.titlePattern) &&
      matchesKeyword(record, keyword),
  );

const buildUnifiedRow = (
  section: ReportSectionDefinition,
  record: Record<string, unknown>,
): Record<string, unknown> => {
  const isEvent = section.module === 'completedEventReports';
  const sortDate = resolveSortableDate(record);

  return {
    sortDate,
    monthGroup: formatMonthGroup(sortDate),
    date: formatDate(record.date ?? record.joiningDate ?? record.startDate),
    submodule: section.label,
    activityName: record.title ?? record.eventTitle ?? '—',
    studentName: isEvent ? (record.coordinator ?? '—') : (record.studentName ?? '—'),
    rollNumber: record.rollNumber ?? '—',
    department: record.department ?? '—',
    year: extractYear(record.date ?? record.joiningDate ?? record.startDate),
    organization: record.organization ?? record.company ?? record.venue ?? '—',
    type: record.achievementType ?? record.eventType ?? record.role ?? '—',
    remarks: record.description ?? record.summary ?? record.participants ?? '—',
  };
};

export const DATE_WISE_REGISTER_COLUMNS: Array<{ key: string; label: string }> = [
  { key: 'sNo', label: 'S.No' },
  { key: 'date', label: 'Date' },
  { key: 'submodule', label: 'Submodule' },
  { key: 'activityName', label: 'Activity / Event' },
  { key: 'studentName', label: 'Student Name' },
  { key: 'rollNumber', label: 'Roll No.' },
  { key: 'department', label: 'Department' },
  { key: 'year', label: 'Year' },
  { key: 'organization', label: 'Organization' },
  { key: 'type', label: 'Type / Role' },
  { key: 'remarks', label: 'Remarks' },
];

/** Flatten all student-activity sub-modules into one date-sorted tabular register */
export const buildDateWiseStudentActivityRegister = (
  aggregation: ReportAggregationResult,
  keyword?: string,
): DateWiseActivityRegister => {
  const definitions = getReportSectionDefinitions('Student Activities');
  const intermediate: Record<string, unknown>[] = [];

  for (const section of definitions) {
    const sourceRecords = aggregation.records.byModule[section.module] ?? [];
    const filtered = filterRecordsForSection(sourceRecords, section, keyword);

    for (const record of filtered) {
      intermediate.push(buildUnifiedRow(section, record));
    }
  }

  intermediate.sort((left, right) => {
    const leftDate = Number(left.sortDate ?? 0);
    const rightDate = Number(right.sortDate ?? 0);
    if (leftDate !== rightDate) return leftDate - rightDate;
    return String(left.submodule).localeCompare(String(right.submodule));
  });

  const rows = intermediate.map((row, index) => {
    const { sortDate: _sortDate, monthGroup: _monthGroup, ...rest } = row;
    return { sNo: index + 1, ...rest };
  });

  const byMonth = new Map<string, Record<string, unknown>[]>();
  intermediate.forEach((row, index) => {
    const monthKey = String(row.monthGroup ?? 'Undated');
    const entry = byMonth.get(monthKey) ?? [];
    const { sortDate: _sortDate, monthGroup: _monthGroup, ...rest } = row;
    entry.push({ sNo: index + 1, ...rest });
    byMonth.set(monthKey, entry);
  });

  const submoduleCounts = Object.fromEntries(
    definitions.map((section) => {
      const count = intermediate.filter((row) => row.submodule === section.label).length;
      return [section.key, count];
    }),
  );

  return {
    columns: DATE_WISE_REGISTER_COLUMNS,
    rows,
    byMonth: Object.fromEntries(byMonth),
    totalCount: rows.length,
    submoduleCounts,
  };
};
