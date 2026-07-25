/**
 * Pending record rejection workflow tests.
 *
 * Verifies PUT /api/v1/pending/:id/reject stores reason, reviewer, timestamp,
 * audit log, and keeps records in the pending_records collection.
 *
 * Run: npm run test:pending-reject-api
 */

import http from 'http';
import dotenv from 'dotenv';
import app from '../app';
import { connectDatabase, disconnectDatabase } from '../database/connection';
import { PendingRecord } from '../models/PendingRecord';
import { AuditLog } from '../models/AuditLog';
import { createTestUser, cleanupTestUser } from './test-helpers';

dotenv.config();

const TEST_PREFIX = 'REJECT_TEST';
const ADMIN_EMAIL = 'pending-reject-admin@accrediassist.edu';
const FACULTY_EMAIL = 'pending-reject-faculty@accrediassist.edu';
const HOD_EMAIL = 'pending-reject-hod@accrediassist.edu';

interface ApiResult {
  status: number;
  body: {
    success: boolean;
    message: string;
    data?: unknown;
    errors?: string[];
  };
}

let server: http.Server;
let baseUrl: string;
let adminToken: string;
let facultyToken: string;
let hodToken: string;
let facultyUserId: string;

const request = async (
  method: string,
  path: string,
  body?: unknown,
  token?: string,
): Promise<ApiResult> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const responseBody = (await response.json()) as ApiResult['body'];
  return { status: response.status, body: responseBody };
};

const assert = (condition: boolean, message: string): void => {
  if (!condition) {
    throw new Error(`FAIL: ${message}`);
  }
  console.log(`PASS: ${message}`);
};

const login = async (email: string, password: string): Promise<string> => {
  const result = await request('POST', '/api/v1/auth/login', { email, password });
  assert(result.status === 200, `Login succeeds for ${email}`);
  return (result.body.data as { token: string }).token;
};

const cleanupTestData = async (): Promise<void> => {
  await PendingRecord.deleteMany({ originalMessage: new RegExp(TEST_PREFIX) });
  await AuditLog.deleteMany({ description: new RegExp(TEST_PREFIX) });
};

const setup = async (): Promise<void> => {
  await connectDatabase();
  await cleanupTestData();
  await cleanupTestUser(ADMIN_EMAIL);
  await cleanupTestUser(FACULTY_EMAIL);
  await cleanupTestUser(HOD_EMAIL);

  await createTestUser({
    name: 'Pending Reject Admin',
    email: ADMIN_EMAIL,
    role: 'Admin',
  });

  const faculty = await createTestUser({
    name: 'Pending Reject Faculty',
    email: FACULTY_EMAIL,
    role: 'Faculty',
  });
  facultyUserId = faculty._id.toString();

  await createTestUser({
    name: 'Pending Reject HOD',
    email: HOD_EMAIL,
    role: 'HOD',
  });

  await new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        throw new Error('Failed to start test server');
      }
      baseUrl = `http://127.0.0.1:${address.port}`;
      resolve();
    });
  });

  adminToken = await login(ADMIN_EMAIL, 'Test@12345');
  facultyToken = await login(FACULTY_EMAIL, 'Test@12345');
  hodToken = await login(HOD_EMAIL, 'Test@12345');
};

const teardown = async (): Promise<void> => {
  await cleanupTestData();
  await cleanupTestUser(ADMIN_EMAIL);
  await cleanupTestUser(FACULTY_EMAIL);
  await cleanupTestUser(HOD_EMAIL);

  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) reject(error);
      else resolve();
    });
  });

  await disconnectDatabase();
};

const createPendingRecord = async (suffix: string) =>
  PendingRecord.create({
    originalMessage: `${TEST_PREFIX} ${suffix}`,
    category: 'Workshop',
    confidenceScore: 75,
    status: 'Pending',
  });

const runTests = async (): Promise<void> => {
  console.log('Running Pending Record Rejection workflow tests...\n');

  await setup();

  const pending = await createPendingRecord('Faculty rejection');
  const reason = `${TEST_PREFIX} Insufficient evidence provided`;

  const unauthorized = await request(
    'PUT',
    `/api/v1/pending/${pending._id.toString()}/reject`,
    { reason },
  );
  assert(unauthorized.status === 401, 'Reject rejects missing token');

  const hodReject = await request(
    'PUT',
    `/api/v1/pending/${pending._id.toString()}/reject`,
    { reason },
    hodToken,
  );
  assert(hodReject.status === 403, 'HOD cannot reject pending records');

  const missingReason = await request(
    'PUT',
    `/api/v1/pending/${pending._id.toString()}/reject`,
    {},
    facultyToken,
  );
  assert(missingReason.status === 422, 'Reject validates required reason');

  const rejected = await request(
    'PUT',
    `/api/v1/pending/${pending._id.toString()}/reject`,
    { reason },
    facultyToken,
  );
  assert(rejected.status === 200, 'Faculty can reject pending record');

  const rejectedData = rejected.body.data as {
    status: string;
    rejectionReason: string;
    reviewedBy: string;
    reviewedAt: string;
  };
  assert(rejectedData.status === 'Rejected', 'Rejected record status is Rejected');
  assert(rejectedData.rejectionReason === reason, 'Rejected record stores rejection reason');
  assert(
    rejectedData.reviewedBy === facultyUserId,
    'Rejected record stores faculty reviewer',
  );
  assert(Boolean(rejectedData.reviewedAt), 'Rejected record stores rejection timestamp');

  const storedRecord = await PendingRecord.findById(pending._id);
  assert(Boolean(storedRecord), 'Rejected record remains in pending_records collection');
  assert(storedRecord?.isDeleted !== true, 'Rejected record is not deleted');
  assert(storedRecord?.status === 'Rejected', 'Stored pending record status is Rejected');
  assert(storedRecord?.rejectionReason === reason, 'Stored pending record keeps rejection reason');

  const auditLog = await AuditLog.findOne({
    module: 'PendingRecord',
    action: 'REJECT',
    description: new RegExp(`${TEST_PREFIX}|${pending._id.toString()}`),
  });
  assert(Boolean(auditLog), 'Reject creates audit log entry');
  assert(
    auditLog?.userId?.toString() === facultyUserId,
    'Reject audit log records rejecting faculty user',
  );

  const adminPending = await createPendingRecord('Admin rejection');
  const adminReason = `${TEST_PREFIX} Duplicate submission`;
  const adminRejected = await request(
    'PUT',
    `/api/v1/pending/${adminPending._id.toString()}/reject`,
    { reason: adminReason },
    adminToken,
  );
  assert(adminRejected.status === 200, 'Admin can reject pending record');

  const reReject = await request(
    'PUT',
    `/api/v1/pending/${pending._id.toString()}/reject`,
    { reason: `${TEST_PREFIX} Retry rejection` },
    facultyToken,
  );
  assert(reReject.status === 400, 'Cannot reject an already rejected record');

  const approvedPending = await PendingRecord.create({
    originalMessage: `${TEST_PREFIX} Already approved`,
    category: 'Placement',
    confidenceScore: 90,
    status: 'Approved',
  });
  const rejectApproved = await request(
    'PUT',
    `/api/v1/pending/${approvedPending._id.toString()}/reject`,
    { reason: `${TEST_PREFIX} Should fail` },
    adminToken,
  );
  assert(rejectApproved.status === 400, 'Cannot reject an already approved record');

  const notFound = await request(
    'PUT',
    `/api/v1/pending/${'0'.repeat(24)}/reject`,
    { reason: `${TEST_PREFIX} Missing record` },
    adminToken,
  );
  assert(notFound.status === 404, 'Reject returns 404 for missing record');

  const pendingCount = await PendingRecord.countDocuments({
    originalMessage: new RegExp(TEST_PREFIX),
    isDeleted: { $ne: true },
  });
  assert(pendingCount >= 3, 'Rejected records remain queryable in pending_records collection');

  await teardown();

  console.log('\nAll Pending Record Rejection workflow tests passed.');
};

runTests().catch(async (error) => {
  console.error('\nPending Record Rejection workflow tests failed:', error);
  await teardown().catch(() => undefined);
  process.exit(1);
});
