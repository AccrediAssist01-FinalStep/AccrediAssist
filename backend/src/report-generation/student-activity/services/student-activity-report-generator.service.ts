import {
  STUDENT_ACTIVITY_REPORT_CONFIG,
} from '../student-activity-report.config';
import { createTemplateActivityReportGenerator } from '../../template-activity-report/services/template-activity-report-generator.service';
import { buildStudentActivityModuleTables } from '../utils/student-activity-module-rows.util';
import type { TemplateModuleTable } from '../../template-activity-report/template-activity-report.types';

const toTemplateModuleTables = (
  tables: ReturnType<typeof buildStudentActivityModuleTables>,
): TemplateModuleTable[] =>
  tables.map((module) => ({
    moduleNumber: module.moduleNumber,
    heading: module.heading,
    sectionKey: module.sectionKey,
    rows: module.rows.map((row) => [
      row.studentName,
      row.type,
      row.title,
      row.organization,
      row.date,
    ]),
  }));

export const studentActivityReportGenerator = createTemplateActivityReportGenerator(
  STUDENT_ACTIVITY_REPORT_CONFIG,
  (context) => {
    const aggregation = context.collectedData?.aggregation;
    if (!aggregation) return [];
    return toTemplateModuleTables(
      buildStudentActivityModuleTables(aggregation, context.filters.keyword),
    );
  },
);

/** @deprecated Use studentActivityReportGenerator — kept for existing imports */
export const studentActivityReportGeneratorService = studentActivityReportGenerator;
