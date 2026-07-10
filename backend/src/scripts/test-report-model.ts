/**
 * Report model integration tests.
 *
 * Prerequisites:
 *   1. cp backend/.env.example backend/.env (set MONGODB_URI)
 *   2. npm install
 *   3. npm run test:report-model
 */

import dotenv from 'dotenv';
import { connectDatabase, disconnectDatabase } from '../database/connection';
import { Report } from '../models/Report';
import { User } from '../models/User';

dotenv.config();

const assert = (condition: boolean, message: string): void => {
  if (!condition) {
    throw new Error(`FAIL: ${message}`);
  }
  console.log(`PASS: ${message}`);
};

const assertThrows = async (fn: () => Promise<unknown>, message: string): Promise<void> => {
  try {
    await fn();
    throw new Error(`FAIL: ${message} (expected error but succeeded)`);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('FAIL:')) {
      throw error;
    }
    console.log(`PASS: ${message}`);
  }
};

const runTests = async (): Promise<void> => {
  console.log('Running Report model tests...\n');

  await connectDatabase();
  await Report.deleteMany({});
  await User.deleteMany({ email: 'report-test@accrediassist.edu' });

  const user = await User.create({
    name: 'Report Tester',
    email: 'report-test@accrediassist.edu',
    password: 'Test@12345',
    role: 'Admin',
  });

  // Test 1: Create with required fields
  const report = await Report.create({
    reportTitle: 'Monthly Placement Summary - March 2026',
    reportType: 'Placement',
    generatedBy: user._id,
    generatedDate: new Date('2026-03-31'),
    fileUrl: 'https://cloudinary.com/reports/placement-march-2026.pdf',
    filtersApplied: {
      startDate: new Date('2026-03-01'),
      endDate: new Date('2026-03-31'),
      department: 'Computer Science',
    },
  });

  assert(!!report._id, 'Report creates successfully');
  assert(report.reportTitle === 'Monthly Placement Summary - March 2026', 'reportTitle is stored correctly');
  assert(report.reportType === 'Placement', 'reportType is stored correctly');
  assert(report.generatedBy.equals(user._id), 'generatedBy is stored correctly');
  assert(
    (report.filtersApplied as { department?: string })?.department === 'Computer Science',
    'filtersApplied is stored correctly',
  );
  assert(!!report.createdAt, 'Timestamps: createdAt is set');
  assert(!!report.updatedAt, 'Timestamps: updatedAt is set');
  assert(report.isDeleted === false, 'Base schema: isDeleted defaults to false');

  // Test 2: Query by reportType index
  const byType = await Report.find({ reportType: 'Placement' });
  assert(byType.length === 1, 'Query by reportType works');

  // Test 3: Query by generatedDate index
  const byDate = await Report.find({ generatedDate: { $gte: new Date('2026-03-01') } });
  assert(byDate.length === 1, 'Query by generatedDate works');

  // Test 4: Missing reportTitle rejected
  await assertThrows(
    () =>
      Report.create({
        reportType: 'Monthly',
        generatedBy: user._id,
        generatedDate: new Date(),
      } as never),
    'Missing reportTitle is rejected',
  );

  // Test 5: Missing reportType rejected
  await assertThrows(
    () =>
      Report.create({
        reportTitle: 'Test Report',
        generatedBy: user._id,
        generatedDate: new Date(),
      } as never),
    'Missing reportType is rejected',
  );

  // Test 6: Invalid reportType rejected
  await assertThrows(
    () =>
      Report.create({
        reportTitle: 'Test Report',
        reportType: 'InvalidType',
        generatedBy: user._id,
        generatedDate: new Date(),
      } as never),
    'Invalid reportType is rejected',
  );

  // Test 7: Invalid fileUrl rejected
  await assertThrows(
    () =>
      Report.create({
        reportTitle: 'Test Report',
        reportType: 'Monthly',
        generatedBy: user._id,
        generatedDate: new Date(),
        fileUrl: 'not-a-valid-url',
      }),
    'Invalid fileUrl is rejected',
  );

  // Test 8: Soft delete via base schema
  await report.softDelete();
  const hidden = await Report.findById(report._id);
  assert(!hidden, 'Soft-deleted record excluded from default queries');

  // Cleanup
  await Report.deleteMany({});
  await User.deleteMany({ email: 'report-test@accrediassist.edu' });
  await disconnectDatabase();

  console.log('\nAll Report model tests passed.');
};

runTests().catch(async (error) => {
  console.error('\nReport model tests failed:', error);
  await disconnectDatabase().catch(() => undefined);
  process.exit(1);
});
