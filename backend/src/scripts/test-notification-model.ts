/**
 * Notification model integration tests.
 *
 * Prerequisites:
 *   1. cp backend/.env.example backend/.env (set MONGODB_URI)
 *   2. npm install
 *   3. npm run test:notification-model
 */

import dotenv from 'dotenv';
import { connectDatabase, disconnectDatabase } from '../database/connection';
import { Notification } from '../models/Notification';
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
  console.log('Running Notification model tests...\n');

  await connectDatabase();
  await Notification.deleteMany({});
  await User.deleteMany({ email: 'notification-test@accrediassist.edu' });

  const user = await User.create({
    name: 'Notification Tester',
    email: 'notification-test@accrediassist.edu',
    password: 'Test@12345',
    role: 'Faculty',
  });

  // Test 1: Create with required fields
  const notification = await Notification.create({
    title: 'Record Approved',
    message: 'Your student achievement record has been approved.',
    userId: user._id,
    type: 'Approval',
  });

  assert(!!notification._id, 'Notification creates successfully');
  assert(notification.title === 'Record Approved', 'title is stored correctly');
  assert(notification.type === 'Approval', 'type is stored correctly');
  assert(notification.isRead === false, 'isRead defaults to false');
  assert(notification.userId.equals(user._id), 'userId is stored correctly');
  assert(!!notification.createdAt, 'Timestamps: createdAt is set');
  assert(!!notification.updatedAt, 'Timestamps: updatedAt is set');
  assert(notification.isDeleted === false, 'Base schema: isDeleted defaults to false');

  // Test 2: Query by userId index
  const byUser = await Notification.find({ userId: user._id });
  assert(byUser.length === 1, 'Query by userId works');

  // Test 3: Query by isRead index
  const unread = await Notification.find({ isRead: false });
  assert(unread.length === 1, 'Query by isRead works');

  // Test 4: Query by type index
  const byType = await Notification.find({ type: 'Approval' });
  assert(byType.length === 1, 'Query by type works');

  // Test 5: Missing title rejected
  await assertThrows(
    () =>
      Notification.create({
        message: 'Test message',
        userId: user._id,
        type: 'System',
      } as never),
    'Missing title is rejected',
  );

  // Test 6: Missing message rejected
  await assertThrows(
    () =>
      Notification.create({
        title: 'Test',
        userId: user._id,
        type: 'System',
      } as never),
    'Missing message is rejected',
  );

  // Test 7: Missing userId rejected
  await assertThrows(
    () =>
      Notification.create({
        title: 'Test',
        message: 'Test message',
        type: 'System',
      } as never),
    'Missing userId is rejected',
  );

  // Test 8: Invalid type rejected
  await assertThrows(
    () =>
      Notification.create({
        title: 'Test',
        message: 'Test message',
        userId: user._id,
        type: 'InvalidType',
      } as never),
    'Invalid type is rejected',
  );

  // Test 9: Soft delete via base schema
  await notification.softDelete();
  const hidden = await Notification.findById(notification._id);
  assert(!hidden, 'Soft-deleted record excluded from default queries');

  // Cleanup
  await Notification.deleteMany({});
  await User.deleteMany({ email: 'notification-test@accrediassist.edu' });
  await disconnectDatabase();

  console.log('\nAll Notification model tests passed.');
};

runTests().catch(async (error) => {
  console.error('\nNotification model tests failed:', error);
  await disconnectDatabase().catch(() => undefined);
  process.exit(1);
});
