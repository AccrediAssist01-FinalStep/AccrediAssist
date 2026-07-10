/**
 * Patents API integration tests.
 *
 * Prerequisites:
 *   1. cp backend/.env.example backend/.env (set MONGODB_URI and JWT_SECRET)
 *   2. npm install
 *   3. npm run test:patent-api
 */

import http from 'http';
import dotenv from 'dotenv';
import app from '../app';
import { connectDatabase, disconnectDatabase } from '../database/connection';
import { Patent } from '../models/Patent';
import { createTestUser, cleanupTestUser } from './test-helpers';

dotenv.config();

const ADMIN_EMAIL = 'patent-api-admin@accrediassist.edu';
const HOD_EMAIL = 'patent-api-hod@accrediassist.edu';

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
let patentId: string;

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
  await Patent.deleteMany({});
  await cleanupTestUser(ADMIN_EMAIL);
  await cleanupTestUser(HOD_EMAIL);

  await createTestUser({
    name: 'Patent API Admin',
    email: ADMIN_EMAIL,
    role: 'Admin',
  });

  await createTestUser({
    name: 'Patent API HOD',
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
  hodToken = await login(HOD_EMAIL, 'Test@12345');
};

const teardown = async (): Promise<void> => {
  await Patent.deleteMany({});
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
  console.log('Running Patents API tests...\n');

  await setup();

  const unauthorized = await request('GET', '/api/v1/patents');
  assert(unauthorized.status === 401, 'GET /patents rejects missing token');

  const created = await request(
    'POST',
    '/api/v1/patents',
    {
      patentTitle: 'AI-Based Smart Irrigation System',
      inventors: ['Dr. Sharma', 'Prof. Kumar'],
      patentNumber: 'IN2025012345',
      status: 'Filed',
      filingDate: '2025-06-10',
      documentUrl: 'https://cloudinary.com/patents/smart-irrigation.pdf',
    },
    adminToken,
  );
  assert(created.status === 201, 'POST /patents creates record');
  assert(created.body.success === true, 'Create returns success true');
  patentId = (created.body.data as { _id: string })._id;
  assert(!!patentId, 'Create returns record ID');

  const hodCreate = await request(
    'POST',
    '/api/v1/patents',
    {
      patentTitle: 'Test Patent',
      status: 'Filed',
    },
    hodToken,
  );
  assert(hodCreate.status === 403, 'HOD cannot create patents');

  const list = await request('GET', '/api/v1/patents?page=1&limit=10', undefined, hodToken);
  assert(list.status === 200, 'GET /patents returns 200 for HOD');
  const listData = list.body.data as { items: unknown[]; meta: { total: number } };
  assert(listData.items.length >= 1, 'GET /patents returns items');
  assert(listData.meta.total >= 1, 'GET /patents returns meta total');

  const byStatus = await request(
    'GET',
    '/api/v1/patents?status=Filed',
    undefined,
    adminToken,
  );
  assert(byStatus.status === 200, 'GET /patents filters by status');
  const statusItems = (byStatus.body.data as { items: { status: string }[] }).items;
  assert(
    statusItems.every((item) => item.status === 'Filed'),
    'Status filter returns matching records',
  );

  const searched = await request(
    'GET',
    '/api/v1/patents?search=Irrigation',
    undefined,
    adminToken,
  );
  assert(searched.status === 200, 'GET /patents supports search');
  const searchItems = (searched.body.data as { items: { patentTitle: string }[] }).items;
  assert(searchItems.length >= 1, 'Search returns matching records');

  const byId = await request('GET', `/api/v1/patents/${patentId}`, undefined, adminToken);
  assert(byId.status === 200, 'GET /patents/:id returns 200');
  assert(
    (byId.body.data as { _id: string })._id === patentId,
    'GET /patents/:id returns correct record',
  );

  const updated = await request(
    'PUT',
    `/api/v1/patents/${patentId}`,
    {
      status: 'Granted',
      patentNumber: 'IN2025012345A1',
    },
    adminToken,
  );
  assert(updated.status === 200, 'PUT /patents/:id updates record');
  assert(
    (updated.body.data as { status: string }).status === 'Granted',
    'PUT /patents/:id persists updates',
  );

  const deleted = await request(
    'DELETE',
    `/api/v1/patents/${patentId}`,
    undefined,
    adminToken,
  );
  assert(deleted.status === 200, 'DELETE /patents/:id soft deletes record');

  const afterDelete = await request(
    'GET',
    `/api/v1/patents/${patentId}`,
    undefined,
    adminToken,
  );
  assert(afterDelete.status === 404, 'Soft-deleted record is not returned');

  const invalid = await request(
    'POST',
    '/api/v1/patents',
    {
      patentTitle: 'Missing Status Patent',
    },
    adminToken,
  );
  assert(invalid.status === 422, 'Missing status returns 422');

  const notFound = await request(
    'GET',
    `/api/v1/patents/${'0'.repeat(24)}`,
    undefined,
    adminToken,
  );
  assert(notFound.status === 404, 'Non-existent record returns 404');

  await teardown();

  console.log('\nAll Patents API tests passed.');
};

runTests().catch(async (error) => {
  console.error('\nPatents API tests failed:', error);
  await teardown().catch(() => undefined);
  process.exit(1);
});
