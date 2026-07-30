import type { ReportAggregationResult } from '../aggregation/interfaces/aggregation.interface';
import type { GenerationReportType } from '../config/report-types.config';
import {
  getReportSectionDefinitions,
  type ReportSectionDefinition,
} from '../config/report-sections.config';
import type { ReportDataSection } from '../interfaces/report-data.interface';

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

const mapStudentRow = (record: Record<string, unknown>): Record<string, unknown> => ({
  activityName: record.title ?? record.eventTitle ?? '—',
  studentName: record.studentName ?? '—',
  rollNumber: record.rollNumber ?? '—',
  year: extractYear(record.date ?? record.joiningDate ?? record.startDate),
  department: record.department ?? '—',
  date: formatDate(record.date ?? record.joiningDate ?? record.startDate),
  organizer: record.organization ?? record.company ?? '—',
  achievementLevel: record.achievementType ?? record.role ?? '—',
  status: 'Approved',
  certificateLink: record.certificateUrl ?? record.offerLetter ?? '—',
  remarks: record.description ?? record.summary ?? '—',
});

const mapFacultyRow = (record: Record<string, unknown>): Record<string, unknown> => ({
  facultyName: record.facultyName ?? '—',
  department: record.department ?? '—',
  title: record.title ?? record.paperTitle ?? record.patentTitle ?? record.eventTitle ?? '—',
  organization: record.organization ?? record.journal ?? record.company ?? '—',
  duration: record.duration ?? record.role ?? '—',
  date: formatDate(record.date ?? record.publicationDate ?? record.filingDate),
  status: record.status ?? record.patentStatus ?? 'Approved',
  certificate: record.certificateUrl ?? record.generatedReportUrl ?? '—',
  remarks: record.description ?? record.summary ?? '—',
});

const mapDepartmentRow = (record: Record<string, unknown>): Record<string, unknown> => ({
  title: record.eventTitle ?? record.headline ?? record.title ?? '—',
  category:
    record.eventType ?? record.articleCategory ?? record.achievementType ?? '—',
  department: record.department ?? '—',
  date: formatDate(record.date ?? record.publicationDate),
  coordinator: record.coordinator ?? record.facultyName ?? record.studentName ?? '—',
  participants: record.participants ?? '—',
  status: 'Approved',
  documentLink: record.generatedReportUrl ?? record.imageUrl ?? record.certificateUrl ?? '—',
  remarks: record.summary ?? record.description ?? '—',
});

const mapEventRow = (record: Record<string, unknown>): Record<string, unknown> => ({
  eventTitle: record.eventTitle ?? '—',
  eventType: record.eventType ?? '—',
  date: formatDate(record.date),
  venue: record.venue ?? '—',
  coordinator: record.coordinator ?? '—',
  participants: record.participants ?? '—',
  summary: record.summary ?? '—',
  reportLink: record.generatedReportUrl ?? '—',
});

const mapSectionRows = (
  reportType: GenerationReportType,
  section: ReportSectionDefinition,
  records: Record<string, unknown>[],
): Record<string, unknown>[] => {
  if (reportType === 'AI Generated Workshop' || reportType === 'AI Generated Industrial Visit') {
    return records.map(mapEventRow);
  }

  if (reportType === 'Faculty Activities') {
    return records.map(mapFacultyRow);
  }

  if (reportType === 'Department Activities') {
    return records.map(mapDepartmentRow);
  }

  if (
    section.module === 'placements' ||
    section.module === 'internships' ||
    section.module === 'studentAchievements'
  ) {
    return records.map(mapStudentRow);
  }

  if (
    section.module === 'facultyAchievements' ||
    section.module === 'publications' ||
    section.module === 'patents'
  ) {
    return records.map(mapFacultyRow);
  }

  return records.map(mapDepartmentRow);
};

export const buildSectionedReportData = (
  reportType: GenerationReportType,
  aggregation: ReportAggregationResult,
  keyword?: string,
): ReportDataSection[] => {
  const definitions = getReportSectionDefinitions(reportType);

  if (definitions.length === 0) {
    return Object.entries(aggregation.records.byModule).map(([moduleKey, records]) => ({
      key: moduleKey,
      label: aggregation.statistics.byModule[moduleKey as keyof typeof aggregation.statistics.byModule]?.label ?? moduleKey,
      collection: moduleKey,
      recordCount: records?.length ?? 0,
      records: (records ?? []).slice(0, 50),
    }));
  }

  return definitions.map((section) => {
    const sourceRecords = aggregation.records.byModule[section.module] ?? [];
    const filtered = filterRecordsForSection(sourceRecords, section, keyword);
    const rows = mapSectionRows(reportType, section, filtered);

    return {
      key: section.key,
      label: section.label,
      collection: section.module,
      recordCount: rows.length,
      records: rows.slice(0, 100),
    };
  });
};

export const buildReportSummaryStats = (
  reportType: GenerationReportType,
  sections: ReportDataSection[],
  aggregation: ReportAggregationResult,
): Record<string, number> => {
  if (reportType === 'Student Activities') {
    const byKey = Object.fromEntries(sections.map((section) => [section.key, section.recordCount]));
    return {
      totalStudentActivities: sections.reduce((sum, section) => sum + section.recordCount, 0),
      totalStudents: aggregation.statistics.byModule.placements?.topPerformers.length ?? 0,
      totalPlacements: byKey.placements ?? aggregation.statistics.byModule.placements?.totalCount ?? 0,
      totalInternships: byKey.internships ?? aggregation.statistics.byModule.internships?.totalCount ?? 0,
      totalCertifications: byKey.certifications ?? 0,
    };
  }

  if (reportType === 'Faculty Activities') {
    return {
      totalFacultyActivities: sections.reduce((sum, section) => sum + section.recordCount, 0),
      totalPublications: aggregation.statistics.byModule.publications?.totalCount ?? 0,
      totalPatents: aggregation.statistics.byModule.patents?.totalCount ?? 0,
      totalAwards:
        sections.find((section) => section.key === 'awards')?.recordCount ?? 0,
    };
  }

  if (reportType === 'Department Activities') {
    return {
      totalDepartmentActivities: sections.reduce((sum, section) => sum + section.recordCount, 0),
      totalEvents: aggregation.statistics.byModule.completedEventReports?.totalCount ?? 0,
      totalNews: aggregation.statistics.byModule.news?.totalCount ?? 0,
    };
  }

  return {
    totalRecords: aggregation.statistics.overall.totalRecords,
  };
};
