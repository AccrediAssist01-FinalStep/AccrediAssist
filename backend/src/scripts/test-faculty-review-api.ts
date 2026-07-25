/**
 * Faculty Review API tests.
 *
 * Covers GET /pending, GET /pending/:id, PATCH /pending/:id
 * Admin and Faculty only. Does not test approval.
 *
 * Run: npm run test:faculty-review-api
 */

import http from 'http';
import dotenv from 'dotenv';
import app from '../app';
import { connectDatabase, disconnectDatabase } from '../database/connection';
import { PendingRecord } from '../models/PendingRecord';
import { createTestUser, cleanupTestUser } from './test-helpers';

dotenv.config();

const ADMIN_EMAIL = 'faculty-review-admin@accrediassist.edu';
const FACULTY_EMAIL = 'faculty-review-faculty@accrediassist.edu';
const HOD_EMAIL = 'faculty-review-hod@accrediassist.edu';

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
  await cleanupTestUser(FACULTY_EMAIL);
  await cleanupTestUser(HOD_EMAIL);

  await createTestUser({
    name: 'Faculty Review Admin',
    email: ADMIN_EMAIL,
    role: 'Admin',
  });

  await createTestUser({
    name: 'Faculty Review Faculty',
    email: FACULTY_EMAIL,
    role: 'Faculty',
  });

  await createTestUser({
    name: 'Faculty Review HOD',
    email: HOD_EMAIL,
    role: 'HOD',
  });

  const pending = await PendingRecord.create({
    originalMessage: 'FACULTY_REVIEW_TEST Rahul Patil secured placement at Infosys.',
    groupName: 'Training & Placement',
    senderName: 'Placement Officer',
    category: 'Placement',
    extractedData: {
      title: 'FACULTY_REVIEW_TEST Placement at Infosys',
      studentNames: ['Rahul Patil'],
      company: 'Infosys',
    },
    confidenceScore: 92,
    status: 'Pending',
  });
  pendingRecordId = pending._id.toString();

  await PendingRecord.create({
    originalMessage: 'FACULTY_REVIEW_TEST Workshop on AI.',
    category: 'Workshop',
    extractedData: {
      title: 'FACULTY_REVIEW_TEST AI Workshop',
    },
    confidenceScore: 88,
    status: 'Needs Review',
  });

  const approved = await PendingRecord.create({
    originalMessage: 'FACULTY_REVIEW_TEST Approved record.',
    category: 'Internship',
    extractedData: {
      title: 'FACULTY_REVIEW_TEST Approved Internship',
    },
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
  facultyToken = await login(FACULTY_EMAIL, 'Test@12345');
  hodToken = await login(HOD_EMAIL, 'Test@12345');
};

const teardown = async (): Promise<void> => {
  await PendingRecord.deleteMany({ originalMessage: /FACULTY_REVIEW_TEST/ });
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

const runTests = async (): Promise<void> => {
  console.log('Running Faculty Review API tests...\n');

  await setup();

  const unauthorized = await request('GET', '/api/v1/pending');
  assert(unauthorized.status === 401, 'GET /pending rejects missing token');

  const hodList = await request('GET', '/api/v1/pending', undefined, hodToken);
  assert(hodList.status === 403, 'HOD cannot access faculty review list');

  const adminList = await request('GET', '/api/v1/pending?page=1&limit=10', undefined, adminToken);
  assert(adminList.status === 200, 'Admin can list pending records');
  const adminListData = adminList.body.data as { items: unknown[]; meta: { total: number } };
  assert(Array.isArray(adminListData.items), 'GET /pending returns items array');
  assert(adminListData.meta.total >= 3, 'GET /pending returns pagination meta');

  const facultyList = await request('GET', '/api/v1/pending?page=1&limit=10', undefined, facultyToken);
  assert(facultyList.status === 200, 'Faculty can list pending records');

  const filtered = await request(
    'GET',
    '/api/v1/pending?status=Pending&category=Placement',
    undefined,
    facultyToken,
  );
  assert(filtered.status === 200, 'GET /pending supports status and category filters');
  const filteredItems = (filtered.body.data as { items: { status: string; category: string }[] })
    .items;
  assert(
    filteredItems.every((item) => item.status === 'Pending' && item.category === 'Placement'),
    'GET /pending filters by status and category',
  );

  const searched = await request(
    'GET',
    '/api/v1/pending?search=Infosys',
    undefined,
    adminToken,
  );
  assert(searched.status === 200, 'GET /pending supports search');
  assert(
    (searched.body.data as { items: unknown[] }).items.length >= 1,
    'GET /pending search returns matching records',
  );

  const titleSearch = await request(
    'GET',
    '/api/v1/pending?title=AI%20Workshop',
    undefined,
    adminToken,
  );
  assert(titleSearch.status === 200, 'GET /pending supports title search');

  const byId = await request('GET', `/api/v1/pending/${pendingRecordId}`, undefined, facultyToken);
  assert(byId.status === 200, 'GET /pending/:id returns 200 for faculty');
  assert(
    (byId.body.data as { _id: string })._id === pendingRecordId,
    'GET /pending/:id returns the requested record',
  );

  const invalidId = await request('GET', '/api/v1/pending/invalid-id', undefined, adminToken);
  assert(invalidId.status === 422, 'GET /pending/:id validates id format');

  const notFound = await request(
    'GET',
    `/api/v1/pending/${'0'.repeat(24)}`,
    undefined,
    adminToken,
  );
  assert(notFound.status === 404, 'GET /pending/:id returns 404 for missing record');

  const invalidPatch = await request(
    'PATCH',
    `/api/v1/pending/${pendingRecordId}`,
    { confidenceScore: 150 },
    adminToken,
  );
  assert(invalidPatch.status === 422, 'PATCH /pending/:id validates request body');

  const patched = await request(
    'PATCH',
    `/api/v1/pending/${pendingRecordId}`,
    {
      extractedData: {
        title: 'FACULTY_REVIEW_TEST Updated Placement Title',
        company: 'TCS',
      },
      confidenceScore: 97,
    },
    facultyToken,
  );
  assert(patched.status === 200, 'PATCH /pending/:id updates record for faculty');
  assert(
    (patched.body.data as { confidenceScore: number }).confidenceScore === 97,
    'PATCH /pending/:id persists updates',
  );
  assert(
    Array.isArray((patched.body.data as { editHistory: unknown[] }).editHistory) &&
      (patched.body.data as { editHistory: unknown[] }).editHistory.length >= 1,
    'PATCH /pending/:id maintains edit history',
  );

  const patchApproved = await request(
    'PATCH',
    `/api/v1/pending/${approvedRecordId}`,
    { confidenceScore: 50 },
    adminToken,
  );
  assert(patchApproved.status === 400, 'PATCH /pending/:id rejects approved records');

  const hodPatch = await request(
    'PATCH',
    `/api/v1/pending/${pendingRecordId}`,
    { confidenceScore: 80 },
    hodToken,
  );
  assert(hodPatch.status === 403, 'HOD cannot patch pending records');

  await teardown();

  console.log('\nAll Faculty Review API tests passed.');
};

runTests().catch(async (error) => {
  console.error('\nFaculty Review API tests failed:', error);
  await teardown().catch(() => undefined);
  process.exit(1);
});
