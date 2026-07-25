/**
 * Pending record notification service tests.
 *
 * Verifies faculty notifications on pending create, approve, and reject.
 * Notifications are stored in MongoDB only (no email delivery).
 *
 * Run: npm run test:pending-notifications
 */

import dotenv from 'dotenv';
import { connectDatabase, disconnectDatabase } from '../database/connection';
import { Notification } from '../models/Notification';
import { Placement } from '../models/Placement';
import { PendingRecord } from '../models/PendingRecord';
import { pendingReviewService } from '../services/pendingReview.service';
import { pendingRecordApprovalService } from '../services/pendingRecordApproval.service';
import { pendingRecordRejectionService } from '../services/pendingRecordRejection.service';
import { createTestUser, cleanupTestUser } from './test-helpers';

dotenv.config();

const TEST_PREFIX = 'NOTIFY_TEST';
const FACULTY_A_EMAIL = 'pending-notify-faculty-a@accrediassist.edu';
const FACULTY_B_EMAIL = 'pending-notify-faculty-b@accrediassist.edu';
const ADMIN_EMAIL = 'pending-notify-admin@accrediassist.edu';

const assert = (condition: boolean, message: string): void => {
  if (!condition) {
    throw new Error(`FAIL: ${message}`);
  }
  console.log(`PASS: ${message}`);
};

const cleanup = async (): Promise<void> => {
  await Notification.deleteMany({ title: new RegExp(TEST_PREFIX) });
  await Notification.deleteMany({ message: new RegExp(TEST_PREFIX) });
  await PendingRecord.deleteMany({ originalMessage: new RegExp(TEST_PREFIX) });
  await Placement.deleteMany({ company: new RegExp(TEST_PREFIX) });
};

let facultyAId: string;
let facultyBId: string;
let adminId: string;

const setup = async (): Promise<void> => {
  await connectDatabase();
  await cleanup();
  await cleanupTestUser(FACULTY_A_EMAIL);
  await cleanupTestUser(FACULTY_B_EMAIL);
  await cleanupTestUser(ADMIN_EMAIL);

  const facultyA = await createTestUser({
    name: `${TEST_PREFIX} Faculty A`,
    email: FACULTY_A_EMAIL,
    role: 'Faculty',
  });
  facultyAId = facultyA._id.toString();

  const facultyB = await createTestUser({
    name: `${TEST_PREFIX} Faculty B`,
    email: FACULTY_B_EMAIL,
    role: 'Faculty',
  });
  facultyBId = facultyB._id.toString();

  const admin = await createTestUser({
    name: `${TEST_PREFIX} Admin`,
    email: ADMIN_EMAIL,
    role: 'Admin',
  });
  adminId = admin._id.toString();
};

const teardown = async (): Promise<void> => {
  await cleanup();
  await cleanupTestUser(FACULTY_A_EMAIL);
  await cleanupTestUser(FACULTY_B_EMAIL);
  await cleanupTestUser(ADMIN_EMAIL);
  await disconnectDatabase();
};

const runTests = async (): Promise<void> => {
  console.log('Running Pending Record notification tests...\n');

  await setup();

  const created = await pendingReviewService.createPendingRecord({
    originalMessage: `${TEST_PREFIX} Rahul Patil secured placement at Infosys`,
    category: 'Placement',
    extractedData: {
      title: `${TEST_PREFIX} Infosys Placement`,
      studentName: `${TEST_PREFIX} Rahul Patil`,
      company: `${TEST_PREFIX} Infosys`,
    },
    confidenceScore: 90,
    status: 'Pending',
  });

  const createdNotifications = await Notification.find({
    type: 'AI',
    message: new RegExp(`${TEST_PREFIX} Infosys Placement`),
  });
  assert(createdNotifications.length === 2, 'New pending record notifies all faculty users');
  assert(
    createdNotifications.every((item) => item.title === 'New Pending Record'),
    'Pending create notification uses expected title',
  );
  assert(
    createdNotifications.some((item) => item.userId.toString() === facultyAId),
    'Faculty A receives pending create notification',
  );
  assert(
    createdNotifications.some((item) => item.userId.toString() === facultyBId),
    'Faculty B receives pending create notification',
  );
  assert(
    !createdNotifications.some((item) => item.userId.toString() === adminId),
    'Admin is not notified on pending create',
  );

  await pendingRecordApprovalService.approvePendingRecord(created._id.toString(), facultyAId);

  const approvedNotifications = await Notification.find({
    type: 'Approval',
    message: new RegExp(`${TEST_PREFIX} Infosys Placement`),
  });
  assert(approvedNotifications.length === 2, 'Approval notifies all faculty users');
  assert(
    approvedNotifications.every((item) => item.title === 'Pending Record Approved'),
    'Approval notification uses expected title',
  );

  const toReject = await pendingReviewService.createPendingRecord({
    originalMessage: `${TEST_PREFIX} Workshop notice`,
    category: 'Workshop',
    extractedData: {
      title: `${TEST_PREFIX} Cloud Workshop`,
    },
    confidenceScore: 70,
    status: 'Pending',
  });

  await pendingRecordRejectionService.rejectPendingRecord(toReject._id.toString(), facultyBId, {
    reason: `${TEST_PREFIX} Insufficient evidence`,
  });

  const rejectedNotifications = await Notification.find({
    type: 'System',
    message: new RegExp(`${TEST_PREFIX} Cloud Workshop`),
  });
  assert(rejectedNotifications.length === 2, 'Rejection notifies all faculty users');
  assert(
    rejectedNotifications.every((item) => item.title === 'Pending Record Rejected'),
    'Rejection notification uses expected title',
  );
  assert(
    rejectedNotifications.every((item) =>
      item.message.includes(`${TEST_PREFIX} Insufficient evidence`),
    ),
    'Rejection notification includes rejection reason',
  );

  const storedCount = await Notification.countDocuments({
    $or: [{ message: new RegExp(TEST_PREFIX) }, { title: new RegExp(TEST_PREFIX) }],
  });
  assert(storedCount === 8, 'All faculty notifications are stored in MongoDB');

  await teardown();

  console.log('\nAll Pending Record notification tests passed.');
};

runTests().catch(async (error) => {
  console.error('\nPending Record notification tests failed:', error);
  await teardown().catch(() => undefined);
  process.exit(1);
});
