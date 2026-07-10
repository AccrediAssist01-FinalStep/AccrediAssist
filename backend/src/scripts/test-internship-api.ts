/**
 * Internships API integration tests.
 *
 * Prerequisites:
 *   1. cp backend/.env.example backend/.env (set MONGODB_URI and JWT_SECRET)
 *   2. npm install
 *   3. npm run test:internship-api
 */

import http from 'http';
import dotenv from 'dotenv';
import app from '../app';
import { connectDatabase, disconnectDatabase } from '../database/connection';
import { Internship } from '../models/Internship';
import { createTestUser, cleanupTestUser } from './test-helpers';

dotenv.config();

const ADMIN_EMAIL = 'internship-api-admin@accrediassist.edu';
const HOD_EMAIL = 'internship-api-hod@accrediassist.edu';

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
let internshipId: string;

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
  await Internship.deleteMany({});
  await cleanupTestUser(ADMIN_EMAIL);
  await cleanupTestUser(HOD_EMAIL);

  await createTestUser({
    name: 'Internship API Admin',
    email: ADMIN_EMAIL,
    role: 'Admin',
  });

  await createTestUser({
    name: 'Internship API HOD',
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
  await Internship.deleteMany({});
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
  console.log('Running Internships API tests...\n');

  await setup();

  const unauthorized = await request('GET', '/api/v1/internships');
  assert(unauthorized.status === 401, 'GET /internships rejects missing token');

  const created = await request(
    'POST',
    '/api/v1/internships',
    {
      studentName: 'Rahul Patil',
      rollNumber: 'CS2021001',
      company: 'Infosys',
      role: 'Software Development Intern',
      duration: '3 months',
      startDate: '2026-01-15',
      endDate: '2026-04-15',
      certificateUrl: 'https://cloudinary.com/certificates/rahul-intern.pdf',
    },
    adminToken,
  );
  assert(created.status === 201, 'POST /internships creates record');
  assert(created.body.success === true, 'Create returns success true');
  internshipId = (created.body.data as { _id: string })._id;
  assert(!!internshipId, 'Create returns record ID');

  const hodCreate = await request(
    'POST',
    '/api/v1/internships',
    {
      studentName: 'Test Student',
      company: 'TCS',
      startDate: '2026-01-01',
      endDate: '2026-03-01',
    },
    hodToken,
  );
  assert(hodCreate.status === 403, 'HOD cannot create internships');

  const list = await request('GET', '/api/v1/internships?page=1&limit=10', undefined, hodToken);
  assert(list.status === 200, 'GET /internships returns 200 for HOD');
  const listData = list.body.data as { items: unknown[]; meta: { total: number } };
  assert(listData.items.length >= 1, 'GET /internships returns items');
  assert(listData.meta.total >= 1, 'GET /internships returns meta total');

  const byCompany = await request(
    'GET',
    '/api/v1/internships?company=Infosys',
    undefined,
    adminToken,
  );
  assert(byCompany.status === 200, 'GET /internships filters by company');
  const companyItems = (byCompany.body.data as { items: { company: string }[] }).items;
  assert(
    companyItems.every((item) => item.company.toLowerCase().includes('infosys')),
    'Company filter returns matching records',
  );

  const searched = await request(
    'GET',
    '/api/v1/internships?search=Rahul',
    undefined,
    adminToken,
  );
  assert(searched.status === 200, 'GET /internships supports search');
  const searchItems = (searched.body.data as { items: { studentName: string }[] }).items;
  assert(searchItems.length >= 1, 'Search returns matching records');

  const byId = await request('GET', `/api/v1/internships/${internshipId}`, undefined, adminToken);
  assert(byId.status === 200, 'GET /internships/:id returns 200');
  assert(
    (byId.body.data as { _id: string })._id === internshipId,
    'GET /internships/:id returns correct record',
  );

  const updated = await request(
    'PUT',
    `/api/v1/internships/${internshipId}`,
    {
      duration: '4 months',
      role: 'Full Stack Intern',
    },
    adminToken,
  );
  assert(updated.status === 200, 'PUT /internships/:id updates record');
  assert(
    (updated.body.data as { duration: string }).duration === '4 months',
    'PUT /internships/:id persists updates',
  );

  const invalidDates = await request(
    'POST',
    '/api/v1/internships',
    {
      studentName: 'Test Student',
      company: 'Wipro',
      startDate: '2026-06-01',
      endDate: '2026-01-01',
    },
    adminToken,
  );
  assert(invalidDates.status === 422, 'Invalid date range returns 422');

  const deleted = await request(
    'DELETE',
    `/api/v1/internships/${internshipId}`,
    undefined,
    adminToken,
  );
  assert(deleted.status === 200, 'DELETE /internships/:id soft deletes record');

  const afterDelete = await request(
    'GET',
    `/api/v1/internships/${internshipId}`,
    undefined,
    adminToken,
  );
  assert(afterDelete.status === 404, 'Soft-deleted record is not returned');

  const invalid = await request(
    'POST',
    '/api/v1/internships',
    {
      studentName: 'Test Student',
    },
    adminToken,
  );
  assert(invalid.status === 422, 'Missing company returns 422');

  const notFound = await request(
    'GET',
    `/api/v1/internships/${'0'.repeat(24)}`,
    undefined,
    adminToken,
  );
  assert(notFound.status === 404, 'Non-existent record returns 404');

  await teardown();

  console.log('\nAll Internships API tests passed.');
};

runTests().catch(async (error) => {
  console.error('\nInternships API tests failed:', error);
  await teardown().catch(() => undefined);
  process.exit(1);
});
