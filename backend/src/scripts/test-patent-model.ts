/**
 * Patent model integration tests.
 *
 * Prerequisites:
 *   1. cp backend/.env.example backend/.env (set MONGODB_URI)
 *   2. npm install
 *   3. npm run test:patent-model
 */

import dotenv from 'dotenv';
import { connectDatabase, disconnectDatabase } from '../database/connection';
import { Patent } from '../models/Patent';

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
  console.log('Running Patent model tests...\n');

  await connectDatabase();
  await Patent.deleteMany({});

  // Test 1: Create with required fields
  const patent = await Patent.create({
    patentTitle: 'IoT-Based Predictive Maintenance System',
    inventors: ['Dr. Sharma', 'Prof. Mehta'],
    patentNumber: 'IN2025012345',
    status: 'Filed',
    filingDate: new Date('2025-08-10'),
    documentUrl: 'https://cloudinary.com/patents/iot-maintenance.pdf',
  });

  assert(!!patent._id, 'Patent creates successfully');
  assert(
    patent.patentTitle === 'IoT-Based Predictive Maintenance System',
    'patentTitle is stored correctly',
  );
  assert(patent.status === 'Filed', 'status is stored correctly');
  assert(patent.inventors?.length === 2, 'inventors is stored correctly');
  assert(!!patent.createdAt, 'Timestamps: createdAt is set');
  assert(!!patent.updatedAt, 'Timestamps: updatedAt is set');
  assert(patent.isDeleted === false, 'Base schema: isDeleted defaults to false');

  // Test 2: Query by patentTitle index
  const byTitle = await Patent.find({ patentTitle: 'IoT-Based Predictive Maintenance System' });
  assert(byTitle.length === 1, 'Query by patentTitle works');

  // Test 3: Query by status index
  const byStatus = await Patent.find({ status: 'Filed' });
  assert(byStatus.length === 1, 'Query by status works');

  // Test 4: Missing patentTitle rejected
  await assertThrows(
    () =>
      Patent.create({
        status: 'Filed',
      } as never),
    'Missing patentTitle is rejected',
  );

  // Test 5: Missing status rejected
  await assertThrows(
    () =>
      Patent.create({
        patentTitle: 'Test Patent',
      } as never),
    'Missing status is rejected',
  );

  // Test 6: Invalid status rejected
  await assertThrows(
    () =>
      Patent.create({
        patentTitle: 'Test Patent',
        status: 'InvalidStatus',
      } as never),
    'Invalid status is rejected',
  );

  // Test 7: Invalid documentUrl rejected
  await assertThrows(
    () =>
      Patent.create({
        patentTitle: 'Test Patent',
        status: 'Granted',
        documentUrl: 'not-a-valid-url',
      }),
    'Invalid documentUrl is rejected',
  );

  // Test 8: Soft delete via base schema
  await patent.softDelete();
  const hidden = await Patent.findById(patent._id);
  assert(!hidden, 'Soft-deleted record excluded from default queries');

  // Cleanup
  await Patent.deleteMany({});
  await disconnectDatabase();

  console.log('\nAll Patent model tests passed.');
};

runTests().catch(async (error) => {
  console.error('\nPatent model tests failed:', error);
  await disconnectDatabase().catch(() => undefined);
  process.exit(1);
});
