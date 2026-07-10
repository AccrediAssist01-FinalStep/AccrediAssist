/**
 * Audit Log model integration tests.
 *
 * Prerequisites:
 *   1. cp backend/.env.example backend/.env (set MONGODB_URI)
 *   2. npm install
 *   3. npm run test:audit-log-model
 */

import dotenv from 'dotenv';
import { connectDatabase, disconnectDatabase } from '../database/connection';
import { AuditLog } from '../models/AuditLog';
import { createTestUser, cleanupTestUser } from './test-helpers';

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
  console.log('Running Audit Log model tests...\n');

  await connectDatabase();
  await AuditLog.deleteMany({});
  await cleanupTestUser('audit-test@accrediassist.edu');

  const user = await createTestUser({
    name: 'Audit Tester',
    email: 'audit-test@accrediassist.edu',
    role: 'Admin',
  });

  const timestamp = new Date('2026-07-10T10:00:00Z');

  // Test 1: Create with required fields
  const auditLog = await AuditLog.create({
    userId: user._id,
    action: 'LOGIN',
    module: 'Auth',
    description: 'User logged in successfully',
    ipAddress: '192.168.1.100',
    timestamp,
  });

  assert(!!auditLog._id, 'Audit log creates successfully');
  assert(auditLog.action === 'LOGIN', 'action is stored correctly');
  assert(auditLog.module === 'Auth', 'module is stored correctly');
  assert(auditLog.userId?.equals(user._id) === true, 'userId is stored correctly');
  assert(auditLog.timestamp.getTime() === timestamp.getTime(), 'timestamp is stored correctly');
  assert(!!auditLog.createdAt, 'Timestamps: createdAt is set');
  assert(!!auditLog.updatedAt, 'Timestamps: updatedAt is set');
  assert(auditLog.isDeleted === false, 'Base schema: isDeleted defaults to false');

  // Test 2: Query by timestamp index
  const byTimestamp = await AuditLog.find({ timestamp: { $gte: new Date('2026-07-01') } });
  assert(byTimestamp.length === 1, 'Query by timestamp works');

  // Test 3: Query by userId index
  const byUser = await AuditLog.find({ userId: user._id });
  assert(byUser.length === 1, 'Query by userId works');

  // Test 4: Query by module index
  const byModule = await AuditLog.find({ module: 'Auth' });
  assert(byModule.length === 1, 'Query by module works');

  // Test 5: Missing action rejected
  await assertThrows(
    () =>
      AuditLog.create({
        module: 'Auth',
        timestamp: new Date(),
      } as never),
    'Missing action is rejected',
  );

  // Test 6: Missing module rejected
  await assertThrows(
    () =>
      AuditLog.create({
        action: 'LOGIN',
        timestamp: new Date(),
      } as never),
    'Missing module is rejected',
  );

  // Test 8: Invalid ipAddress rejected
  await assertThrows(
    () =>
      AuditLog.create({
        action: 'LOGIN',
        module: 'Auth',
        ipAddress: 'not-an-ip',
      }),
    'Invalid ipAddress is rejected',
  );

  // Test 9: Default timestamp applied when omitted
  const autoTimestamp = await AuditLog.create({
    action: 'VIEW',
    module: 'Reports',
  });
  assert(!!autoTimestamp.timestamp, 'timestamp defaults to current date');

  // Test 10: Soft delete via base schema
  await auditLog.softDelete();
  const hidden = await AuditLog.findById(auditLog._id);
  assert(!hidden, 'Soft-deleted record excluded from default queries');

  // Cleanup
  await AuditLog.deleteMany({});
  await cleanupTestUser('audit-test@accrediassist.edu');
  await disconnectDatabase();

  console.log('\nAll Audit Log model tests passed.');
};

runTests().catch(async (error) => {
  console.error('\nAudit Log model tests failed:', error);
  await disconnectDatabase().catch(() => undefined);
  process.exit(1);
});
