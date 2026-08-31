/**
 * Faculty and department module-wise reports: filtering and photograph captions.
 *
 * Run: npx tsx src/scripts/test-faculty-department-module-reports.ts
 */

import { GENERATION_REPORT_TYPES } from '../report-generation/config/report-types.config';
import type { ReportAggregationResult } from '../report-generation/aggregation/interfaces/aggregation.interface';
import { facultyModuleKeysMatchReportSections } from '../report-generation/faculty-activity/config/faculty-module-reports.config';
import { departmentModuleKeysMatchReportSections } from '../report-generation/department-activity/config/department-module-reports.config';
import { buildFacultyActivityModuleTables } from '../report-generation/faculty-activity/utils/faculty-activity-module-rows.util';
import { buildDepartmentActivityModuleTables } from '../report-generation/department-activity/utils/department-activity-module-rows.util';
import { buildFacultyPhotographCaption } from '../report-generation/faculty-activity/utils/faculty-module-photographs.util';
import { buildDepartmentPhotographCaption } from '../report-generation/department-activity/utils/department-module-photographs.util';
import { generateReportSchema } from '../validations/report.validation';

const assert = (label: string, condition: boolean, detail?: string): void => {
  if (!condition) {
    throw new Error(`FAIL: ${label}${detail ? ` — ${detail}` : ''}`);
  }
  console.log(`PASS: ${label}${detail ? ` (${detail})` : ''}`);
};

const emptyAggregation = (
  overrides: Partial<ReportAggregationResult['records']['byModule']>,
): ReportAggregationResult =>
  ({
    records: {
      byModule: {
        studentAchievements: [],
        facultyAchievements: [],
        placements: [],
        internships: [],
        publications: [],
        patents: [],
        completedEventReports: [],
        news: [],
        pendingReviews: [],
        ...overrides,
      },
    },
    statistics: { overall: { totalRecords: 0 }, byModule: {} },
    metadata: { generatedAt: new Date().toISOString() },
  }) as unknown as ReportAggregationResult;

const facultyRecords = {
  mou: {
    facultyName: 'Dr. Meera Iyer',
    achievementType: 'Award',
    activitySubCategory: 'MoU',
    title: 'MoU for industry collaboration',
    organization: 'Tata Consultancy Services',
    date: new Date('2025-06-01'),
    photos: ['https://res.cloudinary.com/demo/image/upload/mou.jpg'],
  },
  award: {
    facultyName: 'Dr. Anil Kumar',
    achievementType: 'Award',
    title: 'Best Teacher Award',
    organization: 'University Grants Commission',
    date: new Date('2025-05-01'),
  },
};

const departmentRecords = {
  industrialVisit: {
    eventTitle: 'Visit to Infosys Mysore',
    eventType: 'Industrial Visit',
    coordinator: 'Prof. Kavita Rao',
    venue: 'Mysore',
    date: new Date('2025-07-10'),
    photoUrls: ['https://res.cloudinary.com/demo/image/upload/iv.jpg'],
  },
  departmentEvent: {
    eventTitle: 'Department Day 2025',
    eventType: 'Workshop',
    coordinator: 'Prof. Rajesh Nair',
    date: new Date('2025-08-01'),
  },
};

const main = (): void => {
  assert('Existing generation report types remain 8', GENERATION_REPORT_TYPES.length === 8);
  assert('Faculty module keys match report sections', facultyModuleKeysMatchReportSections());
  assert('Department module keys match report sections', departmentModuleKeysMatchReportSections());

  const mixedFaculty = emptyAggregation({
    facultyAchievements: [facultyRecords.mou, facultyRecords.award],
  });
  const fullFaculty = buildFacultyActivityModuleTables(mixedFaculty);
  assert('Combined faculty report still has 15 modules', fullFaculty.length === 15);

  const mouTables = buildFacultyActivityModuleTables(mixedFaculty, undefined, 'mous');
  assert('MoU report has one table', mouTables.length === 1);
  assert('MoU heading is module name only', mouTables[0]?.heading === 'MoUs');
  assert('MoU report includes MoU records', mouTables[0]?.rows.length === 1);
  assert(
    'MoU report excludes generic awards',
    !mouTables[0]?.rows.some((row) => row.some((cell) => String(cell).includes('Best Teacher'))),
  );

  const awardTables = buildFacultyActivityModuleTables(mixedFaculty, undefined, 'awards');
  assert('Awards report excludes MoU records', awardTables[0]?.rows.length === 1);
  assert(
    'Awards report includes award',
    Boolean(awardTables[0]?.rows[0]?.some((cell) => String(cell).includes('Best Teacher'))),
  );

  assert(
    'Faculty MoU caption uses faculty name and organization',
    buildFacultyPhotographCaption(facultyRecords.mou, 'MoU', 'mous') ===
      'Dr. Meera Iyer – Tata Consultancy Services',
  );

  const mixedDepartment = emptyAggregation({
    completedEventReports: [departmentRecords.industrialVisit, departmentRecords.departmentEvent],
  });
  const fullDepartment = buildDepartmentActivityModuleTables(mixedDepartment);
  assert('Combined department report still has 6 modules', fullDepartment.length === 6);

  const ivTables = buildDepartmentActivityModuleTables(mixedDepartment, undefined, 'industrial-visits');
  assert('Industrial visit report has one table', ivTables.length === 1);
  assert('Industrial visit heading is module name only', ivTables[0]?.heading === 'Industrial Visits');
  assert('Industrial visit report includes IV records', ivTables[0]?.rows.length === 1);
  assert(
    'Industrial visit report excludes department day',
    !ivTables[0]?.rows.some((row) => row.title.includes('Department Day')),
  );

  const eventTables = buildDepartmentActivityModuleTables(
    mixedDepartment,
    undefined,
    'department-events',
  );
  assert('Department events exclude industrial visits', eventTables[0]?.rows.length === 1);
  assert(
    'Department events include Department Day',
    eventTables[0]?.rows[0]?.title.includes('Department Day') === true,
  );

  assert(
    'Department IV caption uses coordinator and company/event',
    buildDepartmentPhotographCaption(
      departmentRecords.industrialVisit,
      'Industrial Visit',
      'industrial-visits',
    ) === 'Prof. Kavita Rao – Visit to Infosys Mysore',
  );

  assert(
    'API accepts facultyModule on Faculty Activities',
    generateReportSchema.safeParse({
      reportType: 'Faculty Activities',
      format: 'pdf',
      facultyModule: 'mous',
    }).success,
  );
  assert(
    'API rejects facultyModule on Student Activities',
    !generateReportSchema.safeParse({
      reportType: 'Student Activities',
      format: 'pdf',
      facultyModule: 'mous',
    }).success,
  );
  assert(
    'API accepts departmentModule on Department Activities',
    generateReportSchema.safeParse({
      reportType: 'Department Activities',
      format: 'pdf',
      departmentModule: 'industrial-visits',
    }).success,
  );

  console.log('Faculty and department module-wise report tests completed.');
};

main();
