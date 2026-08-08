import { STUDENT_ACTIVITY_MODULE_TABLE_HEADERS } from '../student-activity-report-template.config';

/** Column proportions from STUDENT ACHIEVEMENT REPORT.docx tblGrid */
export const STUDENT_ACTIVITY_TABLE_COLUMN_WEIGHTS = [1294, 900, 3824, 2382, 960] as const;

export const STUDENT_ACTIVITY_TABLE_COLUMN_WIDTHS_DXA = [...STUDENT_ACTIVITY_TABLE_COLUMN_WEIGHTS];

export const getStudentActivityColumnWidths = (totalWidth: number): number[] => {
  const totalWeight = STUDENT_ACTIVITY_TABLE_COLUMN_WEIGHTS.reduce((sum, weight) => sum + weight, 0);
  const widths = STUDENT_ACTIVITY_TABLE_COLUMN_WEIGHTS.map(
    (weight) => Math.floor((weight / totalWeight) * totalWidth),
  );
  const used = widths.reduce((sum, width) => sum + width, 0);
  widths[widths.length - 1] += totalWidth - used;
  return widths;
};

export const getStudentActivityTableHeaders = (): string[] =>
  [...STUDENT_ACTIVITY_MODULE_TABLE_HEADERS];

export const toStudentActivityRowValues = (row: {
  studentName: string;
  type: string;
  title: string;
  organization: string;
  date: string;
}): string[] => [row.studentName, row.type, row.title, row.organization, row.date];
