import { FACULTY_ACTIVITY_REPORT_CONFIG } from '../faculty-activity-report.config';
import { createTemplateActivityReportGenerator } from '../../template-activity-report/services/template-activity-report-generator.service';
import { buildFacultyActivityModuleTables } from '../utils/faculty-activity-module-rows.util';
import type { TemplateModuleTable } from '../../template-activity-report/template-activity-report.types';

const toTemplateModuleTables = (
  tables: ReturnType<typeof buildFacultyActivityModuleTables>,
): TemplateModuleTable[] =>
  tables.map((module) => ({
    moduleNumber: module.moduleNumber,
    heading: module.heading,
    sectionKey: module.sectionKey,
    rows: module.rows.map((row) => [
      row.facultyName,
      row.type,
      row.title,
      row.organization,
      row.date,
    ]),
  }));

export const facultyActivityReportGenerator = createTemplateActivityReportGenerator(
  FACULTY_ACTIVITY_REPORT_CONFIG,
  (context) => {
    const aggregation = context.collectedData?.aggregation;
    if (!aggregation) return [];
    return toTemplateModuleTables(
      buildFacultyActivityModuleTables(aggregation, context.filters.keyword),
    );
  },
);

export const facultyActivityReportGeneratorService = facultyActivityReportGenerator;
