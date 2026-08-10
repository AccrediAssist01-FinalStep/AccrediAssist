import { getReportSectionDefinitions, type ReportSectionDefinition } from '../../config/report-sections.config';
import { getFacultyReportModuleColumns } from '../../config/report-module-columns.config';
import type { ReportAggregationResult } from '../../aggregation/interfaces/aggregation.interface';
import {
  extractReportRowValues,
  resolveReportRowSortDate,
} from '../../utils/report-record-formatter.util';

export interface FacultyActivityModuleTable {
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
    record.paperTitle,
    record.patentTitle,
    record.projectTitle,
    record.eventTitle,
    record.description,
    record.summary,
    record.organization,
    record.journal,
    record.conference,
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
  fdp: 1,
  workshops: 2,
  seminars: 3,
  conferences: 4,
  publications: 5,
  patents: 6,
  'book-chapters': 7,
  consultancy: 8,
  'sponsored-projects': 9,
  certifications: 10,
  awards: 11,
  'guest-lectures': 12,
};

const MODULE_HEADING_BY_KEY: Record<string, string> = {
  fdp: 'FDPs',
  workshops: 'Workshops Attended',
  seminars: 'Seminars Attended',
  conferences: 'Conferences',
  publications: 'Publications',
  patents: 'Patents',
  'book-chapters': 'Book Chapters',
  consultancy: 'Consultancy',
  'sponsored-projects': 'Sponsored Projects',
  certifications: 'Certifications',
  awards: 'Awards',
  'guest-lectures': 'Guest Lectures',
};

const FACULTY_ACHIEVEMENT_SECTION_PRIORITY = [
  'sponsored-projects',
  'consultancy',
  'certifications',
  'conferences',
  'awards',
] as const;

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

export const buildFacultyActivityModuleTables = (
  aggregation: ReportAggregationResult,
  keyword?: string,
): FacultyActivityModuleTable[] => {
  const definitions = getReportSectionDefinitions('Faculty Activities');

  const facultyAchievementBuckets = assignExclusiveRecords(
    aggregation.records.byModule.facultyAchievements ?? [],
    definitions,
    FACULTY_ACHIEVEMENT_SECTION_PRIORITY,
    'awards',
    keyword,
  );

  const publicationBuckets = assignExclusiveRecords(
    aggregation.records.byModule.publications ?? [],
    definitions,
    ['book-chapters'],
    'publications',
    keyword,
  );

  return definitions.map((section) => {
    let sourceRecords: Record<string, unknown>[];

    if (section.module === 'facultyAchievements') {
      sourceRecords = facultyAchievementBuckets.get(section.key) ?? [];
    } else if (section.module === 'publications') {
      sourceRecords = publicationBuckets.get(section.key) ?? [];
    } else {
      sourceRecords = (aggregation.records.byModule[section.module] ?? []).filter(
        (record) =>
          recordMatchesSection(record, section) && matchesKeyword(record, keyword),
      );
    }

    const columns = getFacultyReportModuleColumns(section.key);
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
