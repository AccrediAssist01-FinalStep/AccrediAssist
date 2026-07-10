/**
 * Completed Event Report model integration tests.
 *
 * Prerequisites:
 *   1. cp backend/.env.example backend/.env (set MONGODB_URI)
 *   2. npm install
 *   3. npm run test:completed-event-report-model
 */

import dotenv from 'dotenv';
import { connectDatabase, disconnectDatabase } from '../database/connection';
import { CompletedEventReport } from '../models/CompletedEventReport';

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
  console.log('Running Completed Event Report model tests...\n');

  await connectDatabase();
  await CompletedEventReport.deleteMany({});

  // Test 1: Create with required fields
  const report = await CompletedEventReport.create({
    eventTitle: 'Industry 4.0 Workshop',
    eventType: 'Workshop',
    date: new Date('2026-03-15'),
    venue: 'Seminar Hall A',
    coordinator: 'Dr. Sharma',
    participants: 120,
    summary: 'Hands-on workshop on smart manufacturing.',
    description: 'Students learned about IoT, robotics, and automation in manufacturing.',
    photoUrls: [
      'https://cloudinary.com/events/workshop-1.jpg',
      'https://cloudinary.com/events/workshop-2.jpg',
    ],
    generatedReportUrl: 'https://cloudinary.com/reports/workshop-report.pdf',
  });

  assert(!!report._id, 'Completed event report creates successfully');
  assert(report.eventTitle === 'Industry 4.0 Workshop', 'eventTitle is stored correctly');
  assert(report.eventType === 'Workshop', 'eventType is stored correctly');
  assert(report.participants === 120, 'participants is stored correctly');
  assert(report.photoUrls.length === 2, 'photoUrls is stored correctly');
  assert(!!report.createdAt, 'Timestamps: createdAt is set');
  assert(!!report.updatedAt, 'Timestamps: updatedAt is set');
  assert(report.isDeleted === false, 'Base schema: isDeleted defaults to false');

  // Test 2: Query by eventTitle index
  const byTitle = await CompletedEventReport.find({ eventTitle: 'Industry 4.0 Workshop' });
  assert(byTitle.length === 1, 'Query by eventTitle works');

  // Test 3: Query by eventType index
  const byType = await CompletedEventReport.find({ eventType: 'Workshop' });
  assert(byType.length === 1, 'Query by eventType works');

  // Test 4: Missing eventTitle rejected
  await assertThrows(
    () =>
      CompletedEventReport.create({
        eventType: 'Seminar',
      } as never),
    'Missing eventTitle is rejected',
  );

  // Test 5: Missing eventType rejected
  await assertThrows(
    () =>
      CompletedEventReport.create({
        eventTitle: 'Test Event',
      } as never),
    'Missing eventType is rejected',
  );

  // Test 6: Invalid eventType rejected
  await assertThrows(
    () =>
      CompletedEventReport.create({
        eventTitle: 'Test Event',
        eventType: 'InvalidType',
      } as never),
    'Invalid eventType is rejected',
  );

  // Test 7: Invalid photoUrls rejected
  await assertThrows(
    () =>
      CompletedEventReport.create({
        eventTitle: 'Test Event',
        eventType: 'Seminar',
        photoUrls: ['not-a-valid-url'],
      }),
    'Invalid photoUrls are rejected',
  );

  // Test 8: Invalid generatedReportUrl rejected
  await assertThrows(
    () =>
      CompletedEventReport.create({
        eventTitle: 'Test Event',
        eventType: 'Seminar',
        generatedReportUrl: 'not-a-valid-url',
      }),
    'Invalid generatedReportUrl is rejected',
  );

  // Test 9: Negative participants rejected
  await assertThrows(
    () =>
      CompletedEventReport.create({
        eventTitle: 'Test Event',
        eventType: 'Seminar',
        participants: -5,
      }),
    'Negative participants is rejected',
  );

  // Test 10: Soft delete via base schema
  await report.softDelete();
  const hidden = await CompletedEventReport.findById(report._id);
  assert(!hidden, 'Soft-deleted record excluded from default queries');

  // Cleanup
  await CompletedEventReport.deleteMany({});
  await disconnectDatabase();

  console.log('\nAll Completed Event Report model tests passed.');
};

runTests().catch(async (error) => {
  console.error('\nCompleted Event Report model tests failed:', error);
  await disconnectDatabase().catch(() => undefined);
  process.exit(1);
});
