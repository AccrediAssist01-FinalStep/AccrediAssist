/**
 * Audit Logs API integration tests.
 *
 * Prerequisites:
 *   1. cp backend/.env.example backend/.env (set MONGODB_URI and JWT_SECRET)
 *   2. npm install
 *   3. npm run test:audit-log-api
 */

import http from 'http';
import dotenv from 'dotenv';
import app from '../app';
import { connectDatabase, disconnectDatabase } from '../database/connection';
import { AuditLog } from '../models/AuditLog';
import { createTestUser, cleanupTestUser } from './test-helpers';

dotenv.config();

const ADMIN_EMAIL = 'audit-log-api-admin@accrediassist.edu';
const HOD_EMAIL = 'audit-log-api-hod@accrediassist.edu';

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
let adminUserId: string;

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
  await AuditLog.deleteMany({});
  await cleanupTestUser(ADMIN_EMAIL);
  await cleanupTestUser(HOD_EMAIL);

  const admin = await createTestUser({
    name: 'Audit Log API Admin',
    email: ADMIN_EMAIL,
    role: 'Admin',
  });

  await createTestUser({
    name: 'Audit Log API HOD',
    email: HOD_EMAIL,
    role: 'HOD',
  });

  adminUserId = admin._id.toString();

  await AuditLog.create([
    {
      userId: admin._id,
      action: 'CREATE',
      module: 'Placement',
      description: 'Placement created for Rahul at Infosys',
      timestamp: new Date('2026-03-01T10:00:00.000Z'),
    },
    {
      userId: admin._id,
      action: 'UPDATE',
      module: 'Publication',
      description: 'Publication record updated',
      timestamp: new Date('2026-03-15T14:30:00.000Z'),
    },
    {
      userId: admin._id,
      action: 'DELETE',
      module: 'Patent',
      description: 'Patent record soft deleted',
      timestamp: new Date('2026-04-01T09:00:00.000Z'),
    },
  ]);

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
  await AuditLog.deleteMany({});
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
  console.log('Running Audit Logs API tests...\n');

  await setup();

  const unauthorized = await request('GET', '/api/v1/audit-logs');
  assert(unauthorized.status === 401, 'GET /audit-logs rejects missing token');

  const forbidden = await request('GET', '/api/v1/audit-logs', undefined, hodToken);
  assert(forbidden.status === 403, 'GET /audit-logs rejects non-admin users');

  const list = await request('GET', '/api/v1/audit-logs?page=1&limit=10', undefined, adminToken);
  assert(list.status === 200, 'GET /audit-logs returns 200 for admin');
  const listData = list.body.data as { items: unknown[]; meta: { total: number } };
  assert(listData.items.length === 3, 'GET /audit-logs returns audit log items');
  assert(listData.meta.total === 3, 'GET /audit-logs returns meta total');

  const byUser = await request(
    'GET',
    `/api/v1/audit-logs?userId=${adminUserId}`,
    undefined,
    adminToken,
  );
  assert(byUser.status === 200, 'GET /audit-logs filters by userId');
  const userItems = (byUser.body.data as { items: { userId: string }[] }).items;
  assert(userItems.length === 3, 'User filter returns matching logs');

  const byModule = await request(
    'GET',
    '/api/v1/audit-logs?module=Placement',
    undefined,
    adminToken,
  );
  assert(byModule.status === 200, 'GET /audit-logs filters by module');
  const moduleItems = (byModule.body.data as { items: { module: string }[] }).items;
  assert(
    moduleItems.every((item) => item.module.toLowerCase().includes('placement')),
    'Module filter returns matching logs',
  );

  const byDate = await request(
    'GET',
    '/api/v1/audit-logs?fromDate=2026-03-10&toDate=2026-03-20',
    undefined,
    adminToken,
  );
  assert(byDate.status === 200, 'GET /audit-logs filters by date range');
  const dateItems = (byDate.body.data as { items: unknown[] }).items;
  assert(dateItems.length === 1, 'Date filter returns logs within range');

  const searched = await request(
    'GET',
    '/api/v1/audit-logs?search=Infosys',
    undefined,
    adminToken,
  );
  assert(searched.status === 200, 'GET /audit-logs supports search');
  const searchItems = (searched.body.data as { items: { description: string }[] }).items;
  assert(searchItems.length >= 1, 'Search returns matching logs');

  await teardown();

  console.log('\nAll Audit Logs API tests passed.');
};

runTests().catch(async (error) => {
  console.error('\nAudit Logs API tests failed:', error);
  await teardown().catch(() => undefined);
  process.exit(1);
});
