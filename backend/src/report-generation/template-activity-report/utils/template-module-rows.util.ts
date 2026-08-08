import type { ReportAggregationResult } from '../../aggregation/interfaces/aggregation.interface';
import type { GenerationReportType } from '../../config/report-types.config';
import {
  getReportSectionDefinitions,
  type ReportSectionDefinition,
} from '../../config/report-sections.config';
import type { TemplateModuleTable } from '../template-activity-report.types';

const formatDate = (value: unknown): string => {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const resolveSortableDate = (record: Record<string, unknown>): number => {
  const raw =
    record.date ?? record.joiningDate ?? record.startDate ?? record.publicationDate ?? record.filingDate;
  if (!raw) return 0;
  const date = raw instanceof Date ? raw : new Date(String(raw));
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
};

const getCategoryValue = (record: Record<string, unknown>): string =>
  String(record.achievementType ?? record.eventType ?? record.status ?? record.articleCategory ?? '');

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

export type TemplateRowMapper = (
  record: Record<string, unknown>,
  section: ReportSectionDefinition,
) => string[];

export const buildTemplateModuleTables = (
  reportType: GenerationReportType,
  aggregation: ReportAggregationResult,
  moduleNumberByKey: Record<string, number>,
  moduleLabelByKey: Record<string, string>,
  mapRecordToRow: TemplateRowMapper,
  keyword?: string,
): TemplateModuleTable[] => {
  const definitions = getReportSectionDefinitions(reportType);

  return definitions.map((section) => {
    const sourceRecords = aggregation.records.byModule[section.module] ?? [];
    const filtered = sourceRecords
      .filter(
        (record) =>
          matchesCategory(record, section.categoryMatch) &&
          matchesTitlePattern(record, section.titlePattern) &&
          matchesKeyword(record, keyword),
      )
      .sort(
        (left, right) => resolveSortableDate(left) - resolveSortableDate(right),
      );

    const moduleNumber = moduleNumberByKey[section.key] ?? 0;
    const label = moduleLabelByKey[section.key] ?? section.label;

    return {
      moduleNumber,
      heading: `Module ${moduleNumber}: ${label}`,
      sectionKey: section.key,
      rows: filtered.map((record) => mapRecordToRow(record, section)),
    };
  });
};

export { formatDate, resolveSortableDate };
