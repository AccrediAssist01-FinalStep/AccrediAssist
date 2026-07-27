import { GenerationReportType } from '../config/report-types.config';
import { ReportGenerationFilters } from '../interfaces/report-generation.interface';
import { ReportPipelineContext } from '../interfaces/report-data.interface';
import { buildDefaultReportTitle } from './report-type.util';

export const createPipelineContext = (
  reportType: GenerationReportType,
  filters: ReportGenerationFilters = {},
): ReportPipelineContext => ({
  reportType,
  filters,
});

export const buildReportTitle = (
  reportType: GenerationReportType,
  filters: ReportGenerationFilters,
  customTitle?: string,
): string => {
  if (customTitle?.trim()) {
    return customTitle.trim();
  }

  const base = buildDefaultReportTitle(reportType);
  const suffixParts: string[] = [];

  if (filters.academicYear) {
    suffixParts.push(filters.academicYear);
  } else if (filters.month && filters.year) {
    suffixParts.push(`${filters.month} ${filters.year}`);
  } else if (filters.year) {
    suffixParts.push(String(filters.year));
  }

  if (filters.department) {
    suffixParts.push(filters.department);
  }

  return suffixParts.length > 0 ? `${base} (${suffixParts.join(' · ')})` : base;
};
