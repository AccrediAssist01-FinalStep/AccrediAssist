/**
 * Placement model integration tests.
 *
 * Prerequisites:
 *   1. cp backend/.env.example backend/.env (set MONGODB_URI)
 *   2. npm install
 *   3. npm run test:placement-model
 */

import dotenv from 'dotenv';
import { connectDatabase, disconnectDatabase } from '../database/connection';
import { Placement } from '../models/Placement';

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
  console.log('Running Placement model tests...\n');

  await connectDatabase();
  await Placement.deleteMany({});

  // Test 1: Create with required fields
  const placement = await Placement.create({
    studentName: 'Rahul Patil',
    rollNumber: 'CS2021001',
    company: 'Infosys',
    role: 'Software Engineer',
    package: '12 LPA',
    joiningDate: new Date('2026-07-01'),
    offerLetter: 'https://cloudinary.com/offers/rahul.pdf',
  });

  assert(!!placement._id, 'Placement creates successfully');
  assert(placement.studentName === 'Rahul Patil', 'studentName is stored correctly');
  assert(placement.company === 'Infosys', 'company is stored correctly');
  assert(placement.package === '12 LPA', 'package is stored correctly');
  assert(!!placement.createdAt, 'Timestamps: createdAt is set');
  assert(!!placement.updatedAt, 'Timestamps: updatedAt is set');
  assert(placement.isDeleted === false, 'Base schema: isDeleted defaults to false');

  // Test 2: Query by studentName index
  const byName = await Placement.find({ studentName: 'Rahul Patil' });
  assert(byName.length === 1, 'Query by studentName works');

  // Test 3: Query by company index
  const byCompany = await Placement.find({ company: 'Infosys' });
  assert(byCompany.length === 1, 'Query by company works');

  // Test 4: Missing studentName rejected
  await assertThrows(
    () =>
      Placement.create({
        company: 'TCS',
      } as never),
    'Missing studentName is rejected',
  );

  // Test 5: Missing company rejected
  await assertThrows(
    () =>
      Placement.create({
        studentName: 'Test Student',
      } as never),
    'Missing company is rejected',
  );

  // Test 6: Invalid offerLetter rejected
  await assertThrows(
    () =>
      Placement.create({
        studentName: 'Test Student',
        company: 'Wipro',
        offerLetter: 'not-a-valid-url',
      }),
    'Invalid offerLetter URL is rejected',
  );

  // Test 7: Soft delete via base schema
  await placement.softDelete();
  const hidden = await Placement.findById(placement._id);
  assert(!hidden, 'Soft-deleted record excluded from default queries');

  // Cleanup
  await Placement.deleteMany({});
  await disconnectDatabase();

  console.log('\nAll Placement model tests passed.');
};

runTests().catch(async (error) => {
  console.error('\nPlacement model tests failed:', error);
  await disconnectDatabase().catch(() => undefined);
  process.exit(1);
});
