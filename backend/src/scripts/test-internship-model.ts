/**
 * Internship model integration tests.
 *
 * Prerequisites:
 *   1. cp backend/.env.example backend/.env (set MONGODB_URI)
 *   2. npm install
 *   3. npm run test:internship-model
 */

import dotenv from 'dotenv';
import { connectDatabase, disconnectDatabase } from '../database/connection';
import { Internship } from '../models/Internship';

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
  console.log('Running Internship model tests...\n');

  await connectDatabase();
  await Internship.deleteMany({});

  // Test 1: Create with required fields
  const internship = await Internship.create({
    studentName: 'Rahul Patil',
    rollNumber: 'CS2021001',
    company: 'Infosys',
    role: 'Software Development Intern',
    duration: '3 months',
    startDate: new Date('2026-01-15'),
    endDate: new Date('2026-04-15'),
    certificateUrl: 'https://cloudinary.com/certificates/rahul-intern.pdf',
  });

  assert(!!internship._id, 'Internship creates successfully');
  assert(internship.studentName === 'Rahul Patil', 'studentName is stored correctly');
  assert(internship.company === 'Infosys', 'company is stored correctly');
  assert(internship.duration === '3 months', 'duration is stored correctly');
  assert(!!internship.createdAt, 'Timestamps: createdAt is set');
  assert(!!internship.updatedAt, 'Timestamps: updatedAt is set');
  assert(internship.isDeleted === false, 'Base schema: isDeleted defaults to false');

  // Test 2: Query by studentName index
  const byName = await Internship.find({ studentName: 'Rahul Patil' });
  assert(byName.length === 1, 'Query by studentName works');

  // Test 3: Query by company index
  const byCompany = await Internship.find({ company: 'Infosys' });
  assert(byCompany.length === 1, 'Query by company works');

  // Test 4: Missing studentName rejected
  await assertThrows(
    () =>
      Internship.create({
        company: 'TCS',
      } as never),
    'Missing studentName is rejected',
  );

  // Test 5: Missing company rejected
  await assertThrows(
    () =>
      Internship.create({
        studentName: 'Test Student',
      } as never),
    'Missing company is rejected',
  );

  // Test 6: Invalid certificateUrl rejected
  await assertThrows(
    () =>
      Internship.create({
        studentName: 'Test Student',
        company: 'Wipro',
        certificateUrl: 'not-a-valid-url',
      }),
    'Invalid certificateUrl is rejected',
  );

  // Test 7: endDate before startDate rejected
  await assertThrows(
    () =>
      Internship.create({
        studentName: 'Test Student',
        company: 'Accenture',
        startDate: new Date('2026-06-01'),
        endDate: new Date('2026-01-01'),
      }),
    'endDate before startDate is rejected',
  );

  // Test 8: Soft delete via base schema
  await internship.softDelete();
  const hidden = await Internship.findById(internship._id);
  assert(!hidden, 'Soft-deleted record excluded from default queries');

  // Cleanup
  await Internship.deleteMany({});
  await disconnectDatabase();

  console.log('\nAll Internship model tests passed.');
};

runTests().catch(async (error) => {
  console.error('\nInternship model tests failed:', error);
  await disconnectDatabase().catch(() => undefined);
  process.exit(1);
});
