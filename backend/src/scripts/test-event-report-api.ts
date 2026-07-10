/**
 * Event Reports API integration tests.
 *
 * Prerequisites:
 *   1. cp backend/.env.example backend/.env (set MONGODB_URI and JWT_SECRET)
 *   2. npm install
 *   3. npm run test:event-report-api
 */

import http from 'http';
import dotenv from 'dotenv';
import app from '../app';
import { connectDatabase, disconnectDatabase } from '../database/connection';
import { CompletedEventReport } from '../models/CompletedEventReport';
import { createTestUser, cleanupTestUser } from './test-helpers';

dotenv.config();

const ADMIN_EMAIL = 'event-report-api-admin@accrediassist.edu';
const HOD_EMAIL = 'event-report-api-hod@accrediassist.edu';

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
let eventReportId: string;

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
  await CompletedEventReport.deleteMany({});
  await cleanupTestUser(ADMIN_EMAIL);
  await cleanupTestUser(HOD_EMAIL);

  await createTestUser({
    name: 'Event Report API Admin',
    email: ADMIN_EMAIL,
    role: 'Admin',
  });

  await createTestUser({
    name: 'Event Report API HOD',
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
  await CompletedEventReport.deleteMany({});
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
  console.log('Running Event Reports API tests...\n');

  await setup();

  const unauthorized = await request('GET', '/api/v1/event-reports');
  assert(unauthorized.status === 401, 'GET /event-reports rejects missing token');

  const created = await request(
    'POST',
    '/api/v1/event-reports',
    {
      eventTitle: 'AI in Education Workshop',
      eventType: 'Workshop',
      date: '2026-03-15',
      venue: 'Seminar Hall A',
      coordinator: 'Dr. Sharma',
      participants: 120,
      summary: 'Hands-on workshop on AI tools for teaching.',
      description: 'Faculty and students participated in practical sessions.',
      photoUrls: ['https://cloudinary.com/events/workshop1.jpg'],
    },
    adminToken,
  );
  assert(created.status === 201, 'POST /event-reports creates record');
  assert(created.body.success === true, 'Create returns success true');
  eventReportId = (created.body.data as { _id: string })._id;
  assert(!!eventReportId, 'Create returns record ID');

  const hodCreate = await request(
    'POST',
    '/api/v1/event-reports',
    {
      eventTitle: 'Test Seminar',
      eventType: 'Seminar',
    },
    hodToken,
  );
  assert(hodCreate.status === 403, 'HOD cannot create event reports');

  const list = await request('GET', '/api/v1/event-reports?page=1&limit=10', undefined, hodToken);
  assert(list.status === 200, 'GET /event-reports returns 200 for HOD');
  const listData = list.body.data as { items: unknown[]; meta: { total: number } };
  assert(listData.items.length >= 1, 'GET /event-reports returns items');
  assert(listData.meta.total >= 1, 'GET /event-reports returns meta total');

  const byType = await request(
    'GET',
    '/api/v1/event-reports?eventType=Workshop',
    undefined,
    adminToken,
  );
  assert(byType.status === 200, 'GET /event-reports filters by eventType');
  const typeItems = (byType.body.data as { items: { eventType: string }[] }).items;
  assert(
    typeItems.every((item) => item.eventType === 'Workshop'),
    'Event type filter returns matching records',
  );

  const searched = await request(
    'GET',
    '/api/v1/event-reports?search=Education',
    undefined,
    adminToken,
  );
  assert(searched.status === 200, 'GET /event-reports supports search');
  const searchItems = (searched.body.data as { items: { eventTitle: string }[] }).items;
  assert(searchItems.length >= 1, 'Search returns matching records');

  const byId = await request(
    'GET',
    `/api/v1/event-reports/${eventReportId}`,
    undefined,
    adminToken,
  );
  assert(byId.status === 200, 'GET /event-reports/:id returns 200');
  assert(
    (byId.body.data as { _id: string })._id === eventReportId,
    'GET /event-reports/:id returns correct record',
  );

  const updated = await request(
    'PUT',
    `/api/v1/event-reports/${eventReportId}`,
    {
      participants: 150,
      summary: 'Updated summary with higher attendance.',
    },
    adminToken,
  );
  assert(updated.status === 200, 'PUT /event-reports/:id updates record');
  assert(
    (updated.body.data as { participants: number }).participants === 150,
    'PUT /event-reports/:id persists updates',
  );

  const deleted = await request(
    'DELETE',
    `/api/v1/event-reports/${eventReportId}`,
    undefined,
    adminToken,
  );
  assert(deleted.status === 200, 'DELETE /event-reports/:id soft deletes record');

  const afterDelete = await request(
    'GET',
    `/api/v1/event-reports/${eventReportId}`,
    undefined,
    adminToken,
  );
  assert(afterDelete.status === 404, 'Soft-deleted record is not returned');

  const invalid = await request(
    'POST',
    '/api/v1/event-reports',
    {
      eventTitle: 'Missing Type Event',
    },
    adminToken,
  );
  assert(invalid.status === 422, 'Missing eventType returns 422');

  const notFound = await request(
    'GET',
    `/api/v1/event-reports/${'0'.repeat(24)}`,
    undefined,
    adminToken,
  );
  assert(notFound.status === 404, 'Non-existent record returns 404');

  await teardown();

  console.log('\nAll Event Reports API tests passed.');
};

runTests().catch(async (error) => {
  console.error('\nEvent Reports API tests failed:', error);
  await teardown().catch(() => undefined);
  process.exit(1);
});
