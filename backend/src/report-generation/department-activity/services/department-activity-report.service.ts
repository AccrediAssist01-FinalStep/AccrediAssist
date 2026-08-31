import { DEPARTMENT_ACTIVITY_REPORT_CONFIG, DEPARTMENT_ACTIVITY_TABLE_HEADERS } from '../department-activity-report.config';
import { createTemplateActivityReportGenerator } from '../../template-activity-report/services/template-activity-report-generator.service';
import { buildDepartmentActivityModuleTables } from '../utils/department-activity-module-rows.util';
import type { TemplateModuleTable } from '../../template-activity-report/template-activity-report.types';
import { isDepartmentModuleReportKey } from '../config/department-module-reports.config';
import { collectDepartmentModulePhotographCandidates } from '../utils/department-module-photographs.util';
import { resolveActivityPhotographs } from '../../utils/activity-module-photographs.util';
import { BadRequestError } from '../../../utils/errors';

const toTemplateModuleTables = (
  tables: ReturnType<typeof buildDepartmentActivityModuleTables>,
): TemplateModuleTable[] =>
  tables.map((module) => ({
    moduleNumber: module.moduleNumber,
    heading: module.heading,
    sectionKey: module.sectionKey,
    headers: [...DEPARTMENT_ACTIVITY_TABLE_HEADERS],
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
  async (context) => {
    const aggregation = context.collectedData?.aggregation;
    if (!aggregation) return [];

    const departmentModule = context.filters.departmentModule;
    if (departmentModule && !isDepartmentModuleReportKey(departmentModule)) {
      throw new BadRequestError(
        `Unknown department module "${departmentModule}". Use one of the existing department activity modules.`,
      );
    }

    const tables = buildDepartmentActivityModuleTables(
      aggregation,
      context.filters.keyword,
      departmentModule,
    );
    const modules = toTemplateModuleTables(tables);

    if (!departmentModule) {
      return modules;
    }

    const photographs = await resolveActivityPhotographs(
      collectDepartmentModulePhotographCandidates(tables),
    );
    return { modules, photographs };
  },
);

export const departmentActivityReportGeneratorService = departmentActivityReportGenerator;
