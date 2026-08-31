import { GenerationReportType } from '../config/report-types.config';
import { ReportGenerationFilters } from '../interfaces/report-generation.interface';
import { ReportPipelineContext } from '../interfaces/report-data.interface';
import { getStudentModuleReportDefinition } from '../student-activity/config/student-module-reports.config';
import { getFacultyModuleReportDefinition } from '../faculty-activity/config/faculty-module-reports.config';
import { getDepartmentModuleReportDefinition } from '../department-activity/config/department-module-reports.config';
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

  const moduleDefinition =
    reportType === 'Student Activities'
      ? getStudentModuleReportDefinition(filters.studentModule)
      : reportType === 'Faculty Activities'
        ? getFacultyModuleReportDefinition(filters.facultyModule)
        : reportType === 'Department Activities'
          ? getDepartmentModuleReportDefinition(filters.departmentModule)
          : undefined;
  const base = moduleDefinition?.displayTitle ?? buildDefaultReportTitle(reportType);
  if (filters.eventTitle?.trim()) {
    return `${filters.eventTitle.trim()} - ${base}`;
  }

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
