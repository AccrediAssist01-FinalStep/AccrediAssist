import { getReportSectionDefinitions, type ReportSectionDefinition } from '../../config/report-sections.config';
import type { ReportAggregationResult } from '../../aggregation/interfaces/aggregation.interface';
import type {
  StudentActivityModuleRow,
  StudentActivityModuleTable,
} from '../student-activity-report.types';

const formatDate = (value: unknown): string => {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const resolveSortableDate = (record: Record<string, unknown>): number => {
  const raw = record.date ?? record.joiningDate ?? record.startDate ?? record.endDate;
  if (!raw) return 0;
  const date = raw instanceof Date ? raw : new Date(String(raw));
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
};

const getCategoryValue = (record: Record<string, unknown>): string =>
  String(record.achievementType ?? record.eventType ?? record.status ?? '');

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
    record.description,
    record.summary,
    record.studentName,
    record.organization,
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

const resolveRecordTitle = (
  record: Record<string, unknown>,
  section: ReportSectionDefinition,
): string => {
  if (section.module === 'placements') {
    const company = String(record.company ?? '—');
    const role = String(record.role ?? '').trim();
    return role ? `${role} at ${company}` : `Placement at ${company}`;
  }

  if (section.module === 'internships') {
    const company = String(record.company ?? '—');
    const role = String(record.role ?? '').trim();
    return role ? `${role} at ${company}` : `Internship at ${company}`;
  }

  if (section.module === 'completedEventReports') {
    return String(record.eventTitle ?? record.title ?? '—');
  }

  return String(record.title ?? record.eventTitle ?? record.publicationTitle ?? '—');
};

const mapToModuleRow = (
  record: Record<string, unknown>,
  section: ReportSectionDefinition,
): StudentActivityModuleRow => {
  const isEventModule = section.module === 'completedEventReports';
  const sortDate = resolveSortableDate(record);

  return {
    studentName: isEventModule
      ? String(record.coordinator ?? record.studentName ?? 'Department Event')
      : String(record.studentName ?? '—'),
    type: String(
      record.achievementType ??
        record.eventType ??
        record.role ??
        (record.package ? 'Placement' : 'Participation'),
    ),
    title: resolveRecordTitle(record, section),
    organization: String(
      record.organization ?? record.company ?? record.venue ?? record.department ?? '—',
    ),
    date: formatDate(record.date ?? record.joiningDate ?? record.startDate),
    sortDate,
  };
};

/** Module numbering aligned with STUDENT ACHIEVEMENT REPORT.docx */
const MODULE_NUMBER_BY_KEY: Record<string, number> = {
  sports: 1,
  cultural: 2,
  technical: 3,
  research: 4,
  internships: 5,
  placements: 6,
  certifications: 7,
  workshops: 8,
  seminars: 9,
  'industrial-visits': 10,
  'startup-innovation': 11,
  'nss-ncc': 12,
};

const MODULE_HEADING_BY_KEY: Record<string, string> = {
  sports: 'Sports',
  cultural: 'Cultural',
  technical: 'Technical',
  research: 'Research',
  internships: 'Internship',
  placements: 'Placement',
  certifications: 'Certification',
  workshops: 'Workshop',
  seminars: 'Seminar',
  'industrial-visits': 'Industrial Visit',
  'startup-innovation': 'Startup & Innovation',
  'nss-ncc': 'HSS / NCC',
};

const STUDENT_ACHIEVEMENT_SECTION_PRIORITY = [
  'sports',
  'nss-ncc',
  'startup-innovation',
  'cultural',
  'research',
  'certifications',
  'technical',
] as const;

const assignStudentAchievementsToSections = (
  records: Record<string, unknown>[],
  sections: ReportSectionDefinition[],
  keyword?: string,
): Map<string, Record<string, unknown>[]> => {
  const sectionByKey = new Map(sections.map((section) => [section.key, section]));
  const buckets = new Map<string, Record<string, unknown>[]>(
    STUDENT_ACHIEVEMENT_SECTION_PRIORITY.map((key) => [key, []]),
  );

  for (const record of records) {
    if (!matchesKeyword(record, keyword)) {
      continue;
    }

    const matchedKey =
      STUDENT_ACHIEVEMENT_SECTION_PRIORITY.find((key) => {
        const section = sectionByKey.get(key);
        return (
          section?.module === 'studentAchievements' &&
          key !== 'technical' &&
          recordMatchesSection(record, section)
        );
      }) ?? 'technical';

    buckets.get(matchedKey)?.push(record);
  }

  return buckets;
};

export const buildStudentActivityModuleTables = (
  aggregation: ReportAggregationResult,
  keyword?: string,
): StudentActivityModuleTable[] => {
  const definitions = getReportSectionDefinitions('Student Activities');
  const achievementBuckets = assignStudentAchievementsToSections(
    aggregation.records.byModule.studentAchievements ?? [],
    definitions,
    keyword,
  );

  return definitions.map((section) => {
    let sourceRecords: Record<string, unknown>[];

    if (section.module === 'studentAchievements') {
      sourceRecords = achievementBuckets.get(section.key) ?? [];
    } else {
      sourceRecords = (aggregation.records.byModule[section.module] ?? []).filter(
        (record) =>
          recordMatchesSection(record, section) && matchesKeyword(record, keyword),
      );
    }

    const rows = sourceRecords
      .map((record) => mapToModuleRow(record, section))
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
