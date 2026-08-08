import { DEPARTMENT_ACTIVITY_REPORT_CONFIG } from '../department-activity-report.config';
import { createTemplateActivityReportGenerator } from '../../template-activity-report/services/template-activity-report-generator.service';
import { buildDepartmentActivityModuleTables } from '../utils/department-activity-module-rows.util';
import type { TemplateModuleTable } from '../../template-activity-report/template-activity-report.types';

const toTemplateModuleTables = (
  tables: ReturnType<typeof buildDepartmentActivityModuleTables>,
): TemplateModuleTable[] =>
  tables.map((module) => ({
    moduleNumber: module.moduleNumber,
    heading: module.heading,
    sectionKey: module.sectionKey,
    rows: module.rows.map((row) => [
      row.title,
      row.category,
      row.department,
      row.coordinator,
      row.date,
    ]),
  }));

export const departmentActivityReportGenerator = createTemplateActivityReportGenerator(
  DEPARTMENT_ACTIVITY_REPORT_CONFIG,
  (context) => {
    const aggregation = context.collectedData?.aggregation;
    if (!aggregation) return [];
    return toTemplateModuleTables(
      buildDepartmentActivityModuleTables(aggregation, context.filters.keyword),
    );
  },
);

export const departmentActivityReportGeneratorService = departmentActivityReportGenerator;
