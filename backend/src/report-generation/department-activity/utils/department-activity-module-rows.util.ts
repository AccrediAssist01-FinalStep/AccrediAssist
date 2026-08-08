import { getReportSectionDefinitions, type ReportSectionDefinition } from '../../config/report-sections.config';
import type { ReportAggregationResult } from '../../aggregation/interfaces/aggregation.interface';

export interface DepartmentActivityModuleRow {
  title: string;
  category: string;
  department: string;
  coordinator: string;
  date: string;
  sortDate: number;
}

export interface DepartmentActivityModuleTable {
  moduleNumber: number;
  heading: string;
  sectionKey: string;
  rows: DepartmentActivityModuleRow[];
}

const formatDate = (value: unknown): string => {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const resolveSortableDate = (record: Record<string, unknown>): number => {
  const raw = record.date ?? record.publicationDate ?? record.joiningDate ?? record.startDate;
  if (!raw) return 0;
  const date = raw instanceof Date ? raw : new Date(String(raw));
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
};

const getCategoryValue = (record: Record<string, unknown>): string =>
  String(record.eventType ?? record.articleCategory ?? record.achievementType ?? '');

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
    record.headline,
    record.description,
    record.summary,
    record.organization,
    record.facultyName,
    record.studentName,
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

const recordMatchesSection = (
  record: Record<string, unknown>,
  section: ReportSectionDefinition,
): boolean =>
  matchesCategory(record, section.categoryMatch) &&
  matchesTitlePattern(record, section.titlePattern);

const mapToModuleRow = (record: Record<string, unknown>): DepartmentActivityModuleRow => ({
  title: String(record.eventTitle ?? record.headline ?? record.title ?? '—'),
  category: String(record.eventType ?? record.articleCategory ?? record.achievementType ?? '—'),
  department: String(record.department ?? '—'),
  coordinator: String(record.coordinator ?? record.facultyName ?? record.studentName ?? '—'),
  date: formatDate(record.date ?? record.publicationDate),
  sortDate: resolveSortableDate(record),
});

const MODULE_NUMBER_BY_KEY: Record<string, number> = {
  'department-events': 1,
  'industrial-visits': 2,
  'department-notifications': 3,
  'achievement-repository': 4,
  'accreditation-activities': 5,
  'department-achievements': 6,
};

const MODULE_HEADING_BY_KEY: Record<string, string> = {
  'department-events': 'Department Events',
  'industrial-visits': 'Industrial Visits',
  'department-notifications': 'Department Notifications',
  'achievement-repository': 'Department Achievement Repository',
  'accreditation-activities': 'Accreditation Activities',
  'department-achievements': 'Department Achievements',
};

const assignExclusiveRecords = (
  records: Record<string, unknown>[],
  sections: ReportSectionDefinition[],
  priorityKeys: readonly string[],
  fallbackKey: string,
  keyword?: string,
): Map<string, Record<string, unknown>[]> => {
  const sectionByKey = new Map(sections.map((section) => [section.key, section]));
  const buckets = new Map<string, Record<string, unknown>[]>(
    [...priorityKeys, fallbackKey].map((key) => [key, []]),
  );

  for (const record of records) {
    if (!matchesKeyword(record, keyword)) {
      continue;
    }

    const matchedKey =
      priorityKeys.find((key) => {
        const section = sectionByKey.get(key);
        return section && recordMatchesSection(record, section);
      }) ?? fallbackKey;

    buckets.get(matchedKey)?.push(record);
  }

  return buckets;
};

export const buildDepartmentActivityModuleTables = (
  aggregation: ReportAggregationResult,
  keyword?: string,
): DepartmentActivityModuleTable[] => {
  const definitions = getReportSectionDefinitions('Department Activities');

  const eventBuckets = assignExclusiveRecords(
    aggregation.records.byModule.completedEventReports ?? [],
    definitions,
    ['industrial-visits'],
    'department-events',
    keyword,
  );

  const facultyAchievementBuckets = assignExclusiveRecords(
    aggregation.records.byModule.facultyAchievements ?? [],
    definitions,
    ['accreditation-activities'],
    'department-achievements',
    keyword,
  );

  return definitions.map((section) => {
    let sourceRecords: Record<string, unknown>[];

    if (section.module === 'completedEventReports') {
      sourceRecords = eventBuckets.get(section.key) ?? [];
    } else if (section.module === 'facultyAchievements') {
      sourceRecords = facultyAchievementBuckets.get(section.key) ?? [];
    } else {
      sourceRecords = (aggregation.records.byModule[section.module] ?? []).filter(
        (record) =>
          recordMatchesSection(record, section) && matchesKeyword(record, keyword),
      );
    }

    const rows = sourceRecords
      .map((record) => mapToModuleRow(record))
      .sort((left, right) => left.sortDate - right.sortDate);

    const moduleNumber = MODULE_NUMBER_BY_KEY[section.key] ?? 0;
    const label = MODULE_HEADING_BY_KEY[section.key] ?? section.label;

    return {
      moduleNumber,
      heading: `Module ${moduleNumber}: ${label}`,
      sectionKey: section.key,
      rows,
    };
  });
};
