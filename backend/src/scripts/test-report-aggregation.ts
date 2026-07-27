/**
 * Report Data Aggregation Engine tests.
 *
 * Prerequisites:
 *   1. cp backend/.env.example backend/.env (set MONGODB_URI)
 *   2. npm install
 *   3. npm run test:report-aggregation
 */

import dotenv from 'dotenv';
import { connectDatabase, disconnectDatabase } from '../database/connection';
import { CompletedEventReport } from '../models/CompletedEventReport';
import { FacultyAchievement } from '../models/FacultyAchievement';
import { Internship } from '../models/Internship';
import { Patent } from '../models/Patent';
import { PendingRecord } from '../models/PendingRecord';
import { Placement } from '../models/Placement';
import { Publication } from '../models/Publication';
import { StudentAchievement } from '../models/StudentAchievement';
import { AGGREGATION_MODULE_KEYS } from '../report-generation/aggregation/interfaces/aggregation.interface';
import { aggregationService } from '../report-generation/aggregation/services/aggregation.service';

dotenv.config();

const TEST_PREFIX = 'agg-test-';

const assert = (condition: boolean, message: string): void => {
  if (!condition) {
    throw new Error(`FAIL: ${message}`);
  }
  console.log(`PASS: ${message}`);
};

const seedSampleData = async (): Promise<void> => {
  await Promise.all([
    StudentAchievement.deleteMany({ studentName: { $regex: TEST_PREFIX } }),
    FacultyAchievement.deleteMany({ facultyName: { $regex: TEST_PREFIX } }),
    Placement.deleteMany({ studentName: { $regex: TEST_PREFIX } }),
    Internship.deleteMany({ studentName: { $regex: TEST_PREFIX } }),
    Publication.deleteMany({ facultyName: { $regex: TEST_PREFIX } }),
    Patent.deleteMany({ patentTitle: { $regex: TEST_PREFIX } }),
    CompletedEventReport.deleteMany({ eventTitle: { $regex: TEST_PREFIX } }),
    PendingRecord.deleteMany({ originalMessage: { $regex: TEST_PREFIX } }),
  ]);

  await StudentAchievement.create([
    {
      studentName: `${TEST_PREFIX}Rahul`,
      department: 'Computer Engineering',
      achievementType: 'Technical',
      title: 'Hackathon Winner',
      date: new Date('2025-08-15'),
    },
    {
      studentName: `${TEST_PREFIX}Priya`,
      department: 'Computer Engineering',
      achievementType: 'Sports',
      title: 'State Level Athlete',
      date: new Date('2025-11-20'),
    },
    {
      studentName: `${TEST_PREFIX}Rahul`,
      department: 'Computer Engineering',
      achievementType: 'Technical',
      title: 'Coding Contest',
      date: new Date('2024-09-10'),
    },
  ]);

  await FacultyAchievement.create([
    {
      facultyName: `${TEST_PREFIX}Dr. Sharma`,
      achievementType: 'Research',
      title: 'Best Paper Award',
      date: new Date('2025-07-01'),
    },
  ]);

  await Placement.create([
    {
      studentName: `${TEST_PREFIX}Rahul`,
      department: 'Computer Engineering',
      company: 'TCS',
      role: 'Software Engineer',
      joiningDate: new Date('2025-06-01'),
    },
    {
      studentName: `${TEST_PREFIX}Amit`,
      department: 'Mechanical Engineering',
      company: 'L&T',
      role: 'Graduate Trainee',
      joiningDate: new Date('2025-06-15'),
    },
  ]);

  await Internship.create([
    {
      studentName: `${TEST_PREFIX}Priya`,
      company: 'Infosys',
      role: 'Intern',
      startDate: new Date('2025-05-01'),
      endDate: new Date('2025-07-31'),
    },
  ]);

  await Publication.create([
    {
      facultyName: `${TEST_PREFIX}Dr. Sharma`,
      paperTitle: `${TEST_PREFIX} ML in Education`,
      journal: 'IEEE Access',
      publicationDate: new Date('2025-03-01'),
    },
  ]);

  await Patent.create([
    {
      patentTitle: `${TEST_PREFIX} Smart Campus System`,
      inventors: [`${TEST_PREFIX}Dr. Sharma`],
      status: 'Filed',
      filingDate: new Date('2025-01-15'),
    },
  ]);

  await CompletedEventReport.create([
    {
      eventTitle: `${TEST_PREFIX} AI Workshop`,
      eventType: 'Workshop',
      date: new Date('2025-02-10'),
      coordinator: `${TEST_PREFIX}Dr. Sharma`,
      participants: 120,
    },
  ]);

  await PendingRecord.create([
    {
      originalMessage: `${TEST_PREFIX} pending placement record`,
      category: 'Placement',
      confidenceScore: 85,
      status: 'Pending',
    },
    {
      originalMessage: `${TEST_PREFIX} pending internship record`,
      category: 'Internship',
      confidenceScore: 72,
      status: 'Needs Review',
    },
  ]);
};

const cleanupSampleData = async (): Promise<void> => {
  await Promise.all([
    StudentAchievement.deleteMany({ studentName: { $regex: TEST_PREFIX } }),
    FacultyAchievement.deleteMany({ facultyName: { $regex: TEST_PREFIX } }),
    Placement.deleteMany({ studentName: { $regex: TEST_PREFIX } }),
    Internship.deleteMany({ studentName: { $regex: TEST_PREFIX } }),
    Publication.deleteMany({ facultyName: { $regex: TEST_PREFIX } }),
    Patent.deleteMany({ patentTitle: { $regex: TEST_PREFIX } }),
    CompletedEventReport.deleteMany({ eventTitle: { $regex: TEST_PREFIX } }),
    PendingRecord.deleteMany({ originalMessage: { $regex: TEST_PREFIX } }),
  ]);
};

const runTests = async (): Promise<void> => {
  console.log('Running Report Data Aggregation Engine tests...\n');

  await connectDatabase();
  await seedSampleData();

  // Test 1: Full aggregation across all modules
  const fullResult = await aggregationService.aggregate({});
  assert(fullResult.metadata.modules.length === AGGREGATION_MODULE_KEYS.length, 'Aggregates all modules');
  assert(typeof fullResult.metadata.queryDurationMs === 'number', 'Reports query duration');
  assert(fullResult.statistics.overall.totalRecords >= 10, 'Overall total includes seeded records');
  assert(!!fullResult.charts.byModule.studentAchievements, 'Chart data generated for student achievements');
  assert(!!fullResult.records.byModule.studentAchievements, 'Latest records returned for student achievements');
  assert(Array.isArray(fullResult.summary.highlights), 'Summary highlights generated');

  // Test 2: Department filter
  const deptResult = await aggregationService.aggregate({
    department: 'Computer Engineering',
    modules: ['studentAchievements', 'placements'],
  });
  const studentStats = deptResult.statistics.byModule.studentAchievements;
  assert(studentStats?.totalCount === 3, 'Department filter limits student achievements');
  assert(deptResult.statistics.byModule.placements?.totalCount === 1, 'Department filter limits placements');

  // Test 3: Student filter
  const studentResult = await aggregationService.aggregate({
    student: `${TEST_PREFIX}Rahul`,
    modules: ['studentAchievements', 'placements'],
  });
  assert(studentResult.statistics.byModule.studentAchievements?.totalCount === 2, 'Student filter on achievements');
  assert(studentResult.statistics.byModule.placements?.totalCount === 1, 'Student filter on placements');

  // Test 4: Academic year filter
  const ayResult = await aggregationService.aggregate({
    academicYear: '2025-2026',
    modules: ['studentAchievements'],
  });
  assert(
    (ayResult.statistics.byModule.studentAchievements?.totalCount ?? 0) >= 2,
    'Academic year filter includes 2025 records',
  );

  // Test 5: Category filter
  const categoryResult = await aggregationService.aggregate({
    category: 'Technical',
    modules: ['studentAchievements'],
  });
  assert(categoryResult.statistics.byModule.studentAchievements?.totalCount === 2, 'Category filter works');

  // Test 6: Faculty filter
  const facultyResult = await aggregationService.aggregate({
    faculty: `${TEST_PREFIX}Dr. Sharma`,
    modules: ['facultyAchievements', 'publications'],
  });
  assert(facultyResult.statistics.byModule.facultyAchievements?.totalCount === 1, 'Faculty filter on achievements');
  assert(facultyResult.statistics.byModule.publications?.totalCount === 1, 'Faculty filter on publications');

  // Test 7: Pending reviews stats only (no records)
  const pendingResult = await aggregationService.aggregate({
    modules: ['pendingReviews'],
  });
  assert((pendingResult.statistics.byModule.pendingReviews?.totalCount ?? 0) >= 2, 'Pending review stats counted');
  assert(!pendingResult.records.byModule.pendingReviews, 'Pending reviews returns stats only');

  // Test 8: Top performers
  const performers = fullResult.statistics.byModule.studentAchievements?.topPerformers ?? [];
  assert(performers.some((item) => item.name.includes('Rahul')), 'Top performers includes Rahul');

  // Test 9: Growth percentage with date range
  const rangeResult = await aggregationService.aggregate({
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-12-31'),
    modules: ['studentAchievements'],
  });
  assert(
    rangeResult.statistics.byModule.studentAchievements?.growthPercentage !== undefined,
    'Growth percentage computed for date range',
  );

  // Test 10: Performance — full aggregation under 5 seconds
  const perfStart = Date.now();
  await aggregationService.aggregate({});
  const perfDuration = Date.now() - perfStart;
  assert(perfDuration < 5000, `Full aggregation completes under 5s (${perfDuration}ms)`);

  // Test 11: Output structure
  assert('metadata' in fullResult, 'Output has metadata');
  assert('statistics' in fullResult, 'Output has statistics');
  assert('charts' in fullResult, 'Output has charts');
  assert('records' in fullResult, 'Output has records');
  assert('summary' in fullResult, 'Output has summary');

  await cleanupSampleData();
  await disconnectDatabase();

  console.log('\nAll report aggregation tests passed.');
};

runTests().catch(async (error) => {
  console.error(error);
  await cleanupSampleData().catch(() => undefined);
  await disconnectDatabase().catch(() => undefined);
  process.exit(1);
});
