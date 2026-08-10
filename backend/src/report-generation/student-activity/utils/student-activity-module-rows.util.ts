import { getReportSectionDefinitions, type ReportSectionDefinition } from '../../config/report-sections.config';
import { getStudentReportModuleColumns } from '../../config/report-module-columns.config';
import type { ReportAggregationResult } from '../../aggregation/interfaces/aggregation.interface';
import {
  extractReportRowValues,
  resolveReportRowSortDate,
} from '../../utils/report-record-formatter.util';

export interface StudentActivityModuleTable {
  moduleNumber: number;
  heading: string;
  sectionKey: string;
  headers: string[];
  rows: string[][];
}

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
  'nss-ncc': 'NSS / NCC',
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

    const columns = getStudentReportModuleColumns(section.key);
    const headers = columns.map((column) => column.label);

    const rows = sourceRecords
      .map((record) => ({
        values: extractReportRowValues(record, columns),
        sortDate: resolveReportRowSortDate(record, columns),
      }))
      .sort((left, right) => left.sortDate - right.sortDate)
      .map((row) => row.values);

    const moduleNumber = MODULE_NUMBER_BY_KEY[section.key] ?? 0;
    const label = MODULE_HEADING_BY_KEY[section.key] ?? section.label;

    return {
      moduleNumber,
      heading: `Module ${moduleNumber}: ${label}`,
      sectionKey: section.key,
      headers,
      rows,
    };
  });
};
