/**
 * PendingRecord model integration tests.
 *
 * Prerequisites:
 *   1. cp backend/.env.example backend/.env (set MONGODB_URI)
 *   2. npm install
 *   3. npm run test:pending-model
 */

import dotenv from 'dotenv';
import { connectDatabase, disconnectDatabase } from '../database/connection';
import { PendingRecord } from '../models/PendingRecord';

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
  console.log('Running PendingRecord model tests...\n');

  await connectDatabase();
  await PendingRecord.deleteMany({});

  // Test 1: Create with required fields
  const record = await PendingRecord.create({
    originalMessage: 'Rahul Patil secured placement at Infosys.',
    groupName: 'Training & Placement',
    senderName: 'Placement Officer',
    category: 'Placement',
    extractedData: {
      studentName: 'Rahul Patil',
      company: 'Infosys',
    },
    confidenceScore: 96,
  });

  assert(!!record._id, 'PendingRecord creates successfully');
  assert(record.status === 'Pending', 'Default status is Pending');
  assert(record.confidenceScore === 96, 'Confidence score is stored correctly');
  assert(!!record.createdAt, 'Timestamps: createdAt is set');
  assert(!!record.updatedAt, 'Timestamps: updatedAt is set');
  assert(record.isDeleted === false, 'Base schema: isDeleted defaults to false');
  assert(
    (record.extractedData as { company?: string })?.company === 'Infosys',
    'extractedData Mixed field stores JSON',
  );

  // Test 2: Query by status index field
  const byStatus = await PendingRecord.find({ status: 'Pending' });
  assert(byStatus.length === 1, 'Query by status works');

  // Test 3: Query by category index field
  const byCategory = await PendingRecord.find({ category: 'Placement' });
  assert(byCategory.length === 1, 'Query by category works');

  // Test 4: Invalid category rejected
  await assertThrows(
    () =>
      PendingRecord.create({
        originalMessage: 'Test message',
        category: 'InvalidCategory',
        confidenceScore: 80,
      }),
    'Invalid category is rejected',
  );

  // Test 5: Invalid status rejected
  await assertThrows(
    () =>
      PendingRecord.create({
        originalMessage: 'Test message',
        category: 'Internship',
        status: 'InvalidStatus',
        confidenceScore: 80,
      }),
    'Invalid status is rejected',
  );

  // Test 6: Confidence score bounds
  await assertThrows(
    () =>
      PendingRecord.create({
        originalMessage: 'Test message',
        category: 'Internship',
        confidenceScore: 150,
      }),
    'Confidence score above 100 is rejected',
  );

  await assertThrows(
    () =>
      PendingRecord.create({
        originalMessage: 'Test message',
        category: 'Internship',
        confidenceScore: -5,
      }),
    'Confidence score below 0 is rejected',
  );

  // Test 7: Missing originalMessage rejected
  await assertThrows(
    () =>
      PendingRecord.create({
        category: 'Workshop',
        confidenceScore: 70,
      } as never),
    'Missing originalMessage is rejected',
  );

  // Test 8: Status enum values
  const needsReview = await PendingRecord.create({
    originalMessage: 'Unclear message content',
    category: 'Research',
    confidenceScore: 45,
    status: 'Needs Review',
  });
  assert(needsReview.status === 'Needs Review', 'Needs Review status is valid');

  const rejected = await PendingRecord.create({
    originalMessage: 'Spam message',
    category: 'Cultural',
    confidenceScore: 20,
    status: 'Rejected',
  });
  assert(rejected.status === 'Rejected', 'Rejected status is valid');

  // Test 9: Soft delete via base schema plugin
  await record.softDelete();
  const hidden = await PendingRecord.findById(record._id);
  assert(!hidden, 'Soft-deleted record excluded from default queries');

  const included = await PendingRecord.findById(record._id).setOptions({ includeDeleted: true });
  assert(!!included?.isDeleted, 'Soft-deleted record retrievable with includeDeleted');

  // Cleanup
  await PendingRecord.deleteMany({});
  await disconnectDatabase();

  console.log('\nAll PendingRecord model tests passed.');
};

runTests().catch(async (error) => {
  console.error('\nPendingRecord model tests failed:', error);
  await disconnectDatabase().catch(() => undefined);
  process.exit(1);
});
