import { FACULTY_ACTIVITY_REPORT_CONFIG } from '../faculty-activity-report.config';
import { createTemplateActivityReportGenerator } from '../../template-activity-report/services/template-activity-report-generator.service';
import { buildFacultyActivityModuleTables } from '../utils/faculty-activity-module-rows.util';
import type { TemplateModuleTable } from '../../template-activity-report/template-activity-report.types';
import { isFacultyModuleReportKey } from '../config/faculty-module-reports.config';
import { collectFacultyModulePhotographCandidates } from '../utils/faculty-module-photographs.util';
import { resolveActivityPhotographs } from '../../utils/activity-module-photographs.util';
import { BadRequestError } from '../../../utils/errors';

const toTemplateModuleTables = (
  tables: ReturnType<typeof buildFacultyActivityModuleTables>,
): TemplateModuleTable[] =>
  tables.map((module) => ({
    moduleNumber: module.moduleNumber,
    heading: module.heading,
    sectionKey: module.sectionKey,
    headers: module.headers,
    rows: module.rows,
  }));

export const facultyActivityReportGenerator = createTemplateActivityReportGenerator(
  FACULTY_ACTIVITY_REPORT_CONFIG,
  async (context) => {
    const aggregation = context.collectedData?.aggregation;
    if (!aggregation) return [];

    const facultyModule = context.filters.facultyModule;
    if (facultyModule && !isFacultyModuleReportKey(facultyModule)) {
      throw new BadRequestError(
        `Unknown faculty module "${facultyModule}". Use one of the existing faculty activity modules.`,
      );
    }

    const tables = buildFacultyActivityModuleTables(
      aggregation,
      context.filters.keyword,
      facultyModule,
    );
    const modules = toTemplateModuleTables(tables);

    if (!facultyModule) {
      return modules;
    }

    const photographs = await resolveActivityPhotographs(
      collectFacultyModulePhotographCandidates(tables),
    );
    return { modules, photographs };
  },
);

export const facultyActivityReportGeneratorService = facultyActivityReportGenerator;
