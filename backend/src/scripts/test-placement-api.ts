/**
 * Placements API integration tests.
 *
 * Prerequisites:
 *   1. cp backend/.env.example backend/.env (set MONGODB_URI and JWT_SECRET)
 *   2. npm install
 *   3. npm run test:placement-api
 */

import http from 'http';
import dotenv from 'dotenv';
import app from '../app';
import { connectDatabase, disconnectDatabase } from '../database/connection';
import { Placement } from '../models/Placement';
import { createTestUser, cleanupTestUser } from './test-helpers';

dotenv.config();

const ADMIN_EMAIL = 'placement-api-admin@accrediassist.edu';
const HOD_EMAIL = 'placement-api-hod@accrediassist.edu';

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
let placementId: string;

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
  await Placement.deleteMany({});
  await cleanupTestUser(ADMIN_EMAIL);
  await cleanupTestUser(HOD_EMAIL);

  await createTestUser({
    name: 'Placement API Admin',
    email: ADMIN_EMAIL,
    role: 'Admin',
  });

  await createTestUser({
    name: 'Placement API HOD',
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
  await Placement.deleteMany({});
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
  console.log('Running Placements API tests...\n');

  await setup();

  // Test 1: Unauthorized access
  const unauthorized = await request('GET', '/api/v1/placements');
  assert(unauthorized.status === 401, 'GET /placements rejects missing token');

  // Test 2: Create placement
  const created = await request(
    'POST',
    '/api/v1/placements',
    {
      studentName: 'Rahul Patil',
      rollNumber: 'CS2021001',
      department: 'Computer Science',
      company: 'Infosys',
      role: 'Software Engineer',
      package: '12 LPA',
      joiningDate: '2026-07-01',
      offerLetter: 'https://cloudinary.com/offers/rahul.pdf',
    },
    adminToken,
  );
  assert(created.status === 201, 'POST /placements creates record');
  assert(created.body.success === true, 'Create returns success true');
  placementId = (created.body.data as { _id: string })._id;
  assert(!!placementId, 'Create returns record ID');

  // Test 3: HOD cannot create
  const hodCreate = await request(
    'POST',
    '/api/v1/placements',
    {
      studentName: 'Test Student',
      company: 'TCS',
    },
    hodToken,
  );
  assert(hodCreate.status === 403, 'HOD cannot create placements');

  // Test 4: List with pagination
  const list = await request('GET', '/api/v1/placements?page=1&limit=10', undefined, hodToken);
  assert(list.status === 200, 'GET /placements returns 200 for HOD');
  const listData = list.body.data as { items: unknown[]; meta: { total: number } };
  assert(listData.items.length >= 1, 'GET /placements returns items');
  assert(listData.meta.total >= 1, 'GET /placements returns meta total');

  // Test 5: Filter by company
  const byCompany = await request(
    'GET',
    '/api/v1/placements?company=Infosys',
    undefined,
    adminToken,
  );
  assert(byCompany.status === 200, 'GET /placements filters by company');
  const companyItems = (byCompany.body.data as { items: { company: string }[] }).items;
  assert(
    companyItems.every((item) => item.company.toLowerCase().includes('infosys')),
    'Company filter returns matching records',
  );

  // Test 6: Filter by department
  const byDepartment = await request(
    'GET',
    '/api/v1/placements?department=Computer Science',
    undefined,
    adminToken,
  );
  assert(byDepartment.status === 200, 'GET /placements filters by department');
  const deptItems = (byDepartment.body.data as { items: { department: string }[] }).items;
  assert(
    deptItems.every((item) => item.department?.toLowerCase().includes('computer')),
    'Department filter returns matching records',
  );

  // Test 7: Search
  const searched = await request(
    'GET',
    '/api/v1/placements?search=Rahul',
    undefined,
    adminToken,
  );
  assert(searched.status === 200, 'GET /placements supports search');
  const searchItems = (searched.body.data as { items: { studentName: string }[] }).items;
  assert(searchItems.length >= 1, 'Search returns matching records');

  // Test 8: Get by ID
  const byId = await request('GET', `/api/v1/placements/${placementId}`, undefined, adminToken);
  assert(byId.status === 200, 'GET /placements/:id returns 200');
  assert(
    (byId.body.data as { _id: string })._id === placementId,
    'GET /placements/:id returns correct record',
  );

  // Test 9: Update
  const updated = await request(
    'PUT',
    `/api/v1/placements/${placementId}`,
    {
      package: '14 LPA',
      role: 'Senior Software Engineer',
    },
    adminToken,
  );
  assert(updated.status === 200, 'PUT /placements/:id updates record');
  assert(
    (updated.body.data as { package: string }).package === '14 LPA',
    'PUT /placements/:id persists updates',
  );

  // Test 10: Soft delete
  const deleted = await request(
    'DELETE',
    `/api/v1/placements/${placementId}`,
    undefined,
    adminToken,
  );
  assert(deleted.status === 200, 'DELETE /placements/:id soft deletes record');

  const afterDelete = await request(
    'GET',
    `/api/v1/placements/${placementId}`,
    undefined,
    adminToken,
  );
  assert(afterDelete.status === 404, 'Soft-deleted record is not returned');

  // Test 11: Validation error
  const invalid = await request(
    'POST',
    '/api/v1/placements',
    {
      studentName: 'Test Student',
    },
    adminToken,
  );
  assert(invalid.status === 422, 'Missing company returns 422');

  // Test 12: Not found
  const notFound = await request(
    'GET',
    `/api/v1/placements/${'0'.repeat(24)}`,
    undefined,
    adminToken,
  );
  assert(notFound.status === 404, 'Non-existent record returns 404');

  await teardown();

  console.log('\nAll Placements API tests passed.');
};

runTests().catch(async (error) => {
  console.error('\nPlacements API tests failed:', error);
  await teardown().catch(() => undefined);
  process.exit(1);
});
