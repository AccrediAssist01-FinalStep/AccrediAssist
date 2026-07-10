/**
 * Pending Records API integration tests.
 *
 * Prerequisites:
 *   1. cp backend/.env.example backend/.env (set MONGODB_URI and JWT_SECRET)
 *   2. npm install
 *   3. npm run test:pending-api
 */

import http from 'http';
import dotenv from 'dotenv';
import app from '../app';
import { connectDatabase, disconnectDatabase } from '../database/connection';
import { PendingRecord } from '../models/PendingRecord';
import { createTestUser, cleanupTestUser } from './test-helpers';

dotenv.config();

const ADMIN_EMAIL = 'pending-api-admin@accrediassist.edu';
const HOD_EMAIL = 'pending-api-hod@accrediassist.edu';

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
let hodToken: string;
let pendingRecordId: string;
let approvedRecordId: string;

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

const setup = async (): Promise<void> => {
  await connectDatabase();
  await PendingRecord.deleteMany({});
  await cleanupTestUser(ADMIN_EMAIL);
  await cleanupTestUser(HOD_EMAIL);

  await createTestUser({
    name: 'Pending API Admin',
    email: ADMIN_EMAIL,
    role: 'Admin',
  });

  await createTestUser({
    name: 'Pending API HOD',
    email: HOD_EMAIL,
    role: 'HOD',
  });

  const pending = await PendingRecord.create({
    originalMessage: 'Rahul Patil secured placement at Infosys.',
    groupName: 'Training & Placement',
    senderName: 'Placement Officer',
    category: 'Placement',
    extractedData: { studentName: 'Rahul Patil', company: 'Infosys' },
    confidenceScore: 92,
    status: 'Pending',
  });
  pendingRecordId = pending._id.toString();

  const approved = await PendingRecord.create({
    originalMessage: 'Already approved record.',
    category: 'Internship',
    confidenceScore: 80,
    status: 'Approved',
  });
  approvedRecordId = approved._id.toString();

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
  hodToken = await login(HOD_EMAIL, 'Test@12345');
};

const teardown = async (): Promise<void> => {
  await PendingRecord.deleteMany({});
  await cleanupTestUser(ADMIN_EMAIL);
  await cleanupTestUser(HOD_EMAIL);

  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) reject(error);
      else resolve();
    });
  });

  await disconnectDatabase();
};

const runTests = async (): Promise<void> => {
  console.log('Running Pending Records API tests...\n');

  await setup();

  // Test 1: Unauthorized access
  const unauthorized = await request('GET', '/api/v1/pending');
  assert(unauthorized.status === 401, 'GET /pending rejects missing token');

  // Test 2: List pending records with pagination
  const list = await request('GET', '/api/v1/pending?page=1&limit=10', undefined, adminToken);
  assert(list.status === 200, 'GET /pending returns 200 for admin');
  assert(list.body.success === true, 'GET /pending returns success true');
  const listData = list.body.data as { items: unknown[]; meta: { total: number } };
  assert(Array.isArray(listData.items), 'GET /pending returns items array');
  assert(listData.meta.total >= 2, 'GET /pending returns correct total count');

  // Test 3: Filter by status
  const filtered = await request(
    'GET',
    '/api/v1/pending?status=Pending',
    undefined,
    adminToken,
  );
  assert(filtered.status === 200, 'GET /pending filters by status');
  const filteredItems = (filtered.body.data as { items: { status: string }[] }).items;
  assert(
    filteredItems.every((item) => item.status === 'Pending'),
    'GET /pending status filter returns only Pending records',
  );

  // Test 4: Get by ID
  const byId = await request('GET', `/api/v1/pending/${pendingRecordId}`, undefined, adminToken);
  assert(byId.status === 200, 'GET /pending/:id returns 200');
  assert(
    (byId.body.data as { _id: string })._id === pendingRecordId,
    'GET /pending/:id returns correct record',
  );

  // Test 5: HOD can view
  const hodView = await request('GET', '/api/v1/pending', undefined, hodToken);
  assert(hodView.status === 200, 'HOD can list pending records');

  // Test 6: HOD cannot approve
  const hodApprove = await request(
    'PUT',
    `/api/v1/pending/${pendingRecordId}/approve`,
    undefined,
    hodToken,
  );
  assert(hodApprove.status === 403, 'HOD cannot approve pending records');

  // Test 7: Update pending record
  const updated = await request(
    'PUT',
    `/api/v1/pending/${pendingRecordId}`,
    {
      extractedData: { studentName: 'Rahul Patil', company: 'TCS' },
      confidenceScore: 95,
    },
    adminToken,
  );
  assert(updated.status === 200, 'PUT /pending/:id updates record');
  assert(
    (updated.body.data as { confidenceScore: number }).confidenceScore === 95,
    'PUT /pending/:id persists updates',
  );

  // Test 8: Approve pending record
  const approved = await request(
    'PUT',
    `/api/v1/pending/${pendingRecordId}/approve`,
    undefined,
    adminToken,
  );
  assert(approved.status === 200, 'PUT /pending/:id/approve succeeds');
  assert(
    (approved.body.data as { status: string }).status === 'Approved',
    'PUT /pending/:id/approve sets status to Approved',
  );

  // Test 9: Cannot approve already approved record
  const reApprove = await request(
    'PUT',
    `/api/v1/pending/${pendingRecordId}/approve`,
    undefined,
    adminToken,
  );
  assert(reApprove.status === 400, 'Cannot approve an already approved record');

  // Test 10: Reject a pending record
  const toReject = await PendingRecord.create({
    originalMessage: 'Record to reject.',
    category: 'Workshop',
    confidenceScore: 70,
    status: 'Pending',
  });

  const rejected = await request(
    'PUT',
    `/api/v1/pending/${toReject._id.toString()}/reject`,
    { reason: 'Insufficient evidence' },
    adminToken,
  );
  assert(rejected.status === 200, 'PUT /pending/:id/reject succeeds');
  assert(
    (rejected.body.data as { status: string }).status === 'Rejected',
    'PUT /pending/:id/reject sets status to Rejected',
  );

  // Test 11: Cannot update approved record
  const updateApproved = await request(
    'PUT',
    `/api/v1/pending/${approvedRecordId}`,
    { confidenceScore: 50 },
    adminToken,
  );
  assert(updateApproved.status === 400, 'Cannot update an approved record');

  // Test 12: Invalid ID format
  const invalidId = await request('GET', '/api/v1/pending/invalid-id', undefined, adminToken);
  assert(invalidId.status === 422, 'Invalid ID format returns 422');

  // Test 13: Not found
  const notFound = await request(
    'GET',
    `/api/v1/pending/${'0'.repeat(24)}`,
    undefined,
    adminToken,
  );
  assert(notFound.status === 404, 'Non-existent record returns 404');

  await teardown();

  console.log('\nAll Pending Records API tests passed.');
};

runTests().catch(async (error) => {
  console.error('\nPending Records API tests failed:', error);
  await teardown().catch(() => undefined);
  process.exit(1);
});
