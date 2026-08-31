import {
  STUDENT_ACTIVITY_REPORT_CONFIG,
} from '../student-activity-report.config';
import { createTemplateActivityReportGenerator } from '../../template-activity-report/services/template-activity-report-generator.service';
import { buildStudentActivityModuleTables } from '../utils/student-activity-module-rows.util';
import type { TemplateModuleTable } from '../../template-activity-report/template-activity-report.types';
import { isStudentModuleReportKey } from '../config/student-module-reports.config';
import {
  collectStudentModulePhotographCandidates,
  resolveStudentModulePhotographs,
} from '../utils/student-module-photographs.util';
import { BadRequestError } from '../../../utils/errors';

const toTemplateModuleTables = (
  tables: ReturnType<typeof buildStudentActivityModuleTables>,
): TemplateModuleTable[] =>
  tables.map((module) => ({
    moduleNumber: module.moduleNumber,
    heading: module.heading,
    sectionKey: module.sectionKey,
    headers: module.headers,
    rows: module.rows,
  }));

export const studentActivityReportGenerator = createTemplateActivityReportGenerator(
  STUDENT_ACTIVITY_REPORT_CONFIG,
  async (context) => {
    const aggregation = context.collectedData?.aggregation;
    if (!aggregation) return [];

    const studentModule = context.filters.studentModule;
    if (studentModule && !isStudentModuleReportKey(studentModule)) {
      throw new BadRequestError(
        `Unknown student module "${studentModule}". Use one of the existing student activity modules.`,
      );
    }

    const tables = buildStudentActivityModuleTables(
      aggregation,
      context.filters.keyword,
      studentModule,
    );
    const modules = toTemplateModuleTables(tables);

    if (!studentModule) {
      return modules;
    }

    const candidates = collectStudentModulePhotographCandidates(tables);
    const photographs = await resolveStudentModulePhotographs(candidates);
    return { modules, photographs };
  },
);

/** @deprecated Use studentActivityReportGenerator — kept for existing imports */
export const studentActivityReportGeneratorService = studentActivityReportGenerator;
