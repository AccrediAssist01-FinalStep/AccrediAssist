/**
 * Faculty Achievements API integration tests.
 *
 * Prerequisites:
 *   1. cp backend/.env.example backend/.env (set MONGODB_URI and JWT_SECRET)
 *   2. npm install
 *   3. npm run test:faculty-achievement-api
 */

import http from 'http';
import dotenv from 'dotenv';
import app from '../app';
import { connectDatabase, disconnectDatabase } from '../database/connection';
import { FacultyAchievement } from '../models/FacultyAchievement';
import { createTestUser, cleanupTestUser } from './test-helpers';

dotenv.config();

const ADMIN_EMAIL = 'faculty-achievement-admin@accrediassist.edu';
const HOD_EMAIL = 'faculty-achievement-hod@accrediassist.edu';

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
let achievementId: string;

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
  await FacultyAchievement.deleteMany({});
  await cleanupTestUser(ADMIN_EMAIL);
  await cleanupTestUser(HOD_EMAIL);

  await createTestUser({
    name: 'Faculty Achievement Admin',
    email: ADMIN_EMAIL,
    role: 'Admin',
  });

  await createTestUser({
    name: 'Faculty Achievement HOD',
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
  await FacultyAchievement.deleteMany({});
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
  console.log('Running Faculty Achievements API tests...\n');

  await setup();

  // Test 1: Unauthorized access
  const unauthorized = await request('GET', '/api/v1/faculty-achievements');
  assert(unauthorized.status === 401, 'GET /faculty-achievements rejects missing token');

  // Test 2: Create faculty achievement
  const created = await request(
    'POST',
    '/api/v1/faculty-achievements',
    {
      facultyName: 'Dr. Anjali Desai',
      designation: 'Associate Professor',
      achievementType: 'Research',
      title: 'Best Paper Award - IEEE Conference',
      description: 'Awarded for research on machine learning.',
      organization: 'IEEE',
      certificateUrl: 'https://cloudinary.com/certificates/anjali-ieee.pdf',
      photos: ['https://cloudinary.com/photos/anjali-award.jpg'],
      date: '2025-09-20',
    },
    adminToken,
  );
  assert(created.status === 201, 'POST /faculty-achievements creates record');
  assert(created.body.success === true, 'Create returns success true');
  achievementId = (created.body.data as { _id: string })._id;
  assert(!!achievementId, 'Create returns record ID');

  // Test 3: HOD cannot create
  const hodCreate = await request(
    'POST',
    '/api/v1/faculty-achievements',
    {
      facultyName: 'Dr. Test',
      achievementType: 'Award',
      title: 'Test',
      date: '2025-01-01',
    },
    hodToken,
  );
  assert(hodCreate.status === 403, 'HOD cannot create faculty achievements');

  // Test 4: List with pagination
  const list = await request(
    'GET',
    '/api/v1/faculty-achievements?page=1&limit=10',
    undefined,
    hodToken,
  );
  assert(list.status === 200, 'GET /faculty-achievements returns 200 for HOD');
  const listData = list.body.data as { items: unknown[]; meta: { total: number } };
  assert(listData.items.length >= 1, 'GET /faculty-achievements returns items');
  assert(listData.meta.total >= 1, 'GET /faculty-achievements returns meta total');

  // Test 5: Filter by achievementType
  const filtered = await request(
    'GET',
    '/api/v1/faculty-achievements?achievementType=Research',
    undefined,
    adminToken,
  );
  assert(filtered.status === 200, 'GET /faculty-achievements filters by achievementType');
  const filteredItems = (filtered.body.data as { items: { achievementType: string }[] }).items;
  assert(
    filteredItems.every((item) => item.achievementType === 'Research'),
    'Filter returns only Research achievements',
  );

  // Test 6: Search
  const searched = await request(
    'GET',
    '/api/v1/faculty-achievements?search=IEEE',
    undefined,
    adminToken,
  );
  assert(searched.status === 200, 'GET /faculty-achievements supports search');
  const searchItems = (searched.body.data as { items: { title: string }[] }).items;
  assert(searchItems.length >= 1, 'Search returns matching records');

  // Test 7: Sorting
  await request(
    'POST',
    '/api/v1/faculty-achievements',
    {
      facultyName: 'Dr. Sharma',
      achievementType: 'Certification',
      title: 'AWS Solutions Architect',
      date: '2024-03-10',
    },
    adminToken,
  );

  const sorted = await request(
    'GET',
    '/api/v1/faculty-achievements?sortBy=facultyName&sortOrder=asc',
    undefined,
    adminToken,
  );
  assert(sorted.status === 200, 'GET /faculty-achievements supports sorting');
  const sortedItems = (sorted.body.data as { items: { facultyName: string }[] }).items;
  assert(
    sortedItems[0].facultyName <= sortedItems[sortedItems.length - 1].facultyName,
    'Sort by facultyName ascending works',
  );

  // Test 8: Get by ID
  const byId = await request(
    'GET',
    `/api/v1/faculty-achievements/${achievementId}`,
    undefined,
    adminToken,
  );
  assert(byId.status === 200, 'GET /faculty-achievements/:id returns 200');
  assert(
    (byId.body.data as { _id: string })._id === achievementId,
    'GET /faculty-achievements/:id returns correct record',
  );

  // Test 9: Update
  const updated = await request(
    'PUT',
    `/api/v1/faculty-achievements/${achievementId}`,
    {
      title: 'Best Paper Award - IEEE International Conference',
      description: 'Updated description.',
    },
    adminToken,
  );
  assert(updated.status === 200, 'PUT /faculty-achievements/:id updates record');
  assert(
    (updated.body.data as { title: string }).title === 'Best Paper Award - IEEE International Conference',
    'PUT /faculty-achievements/:id persists updates',
  );

  // Test 10: Soft delete
  const deleted = await request(
    'DELETE',
    `/api/v1/faculty-achievements/${achievementId}`,
    undefined,
    adminToken,
  );
  assert(deleted.status === 200, 'DELETE /faculty-achievements/:id soft deletes record');

  const afterDelete = await request(
    'GET',
    `/api/v1/faculty-achievements/${achievementId}`,
    undefined,
    adminToken,
  );
  assert(afterDelete.status === 404, 'Soft-deleted record is not returned');

  // Test 11: Validation error
  const invalid = await request(
    'POST',
    '/api/v1/faculty-achievements',
    {
      facultyName: 'Dr. Test',
      achievementType: 'InvalidType',
      title: 'Test',
      date: '2025-01-01',
    },
    adminToken,
  );
  assert(invalid.status === 422, 'Invalid achievement type returns 422');

  // Test 12: Not found
  const notFound = await request(
    'GET',
    `/api/v1/faculty-achievements/${'0'.repeat(24)}`,
    undefined,
    adminToken,
  );
  assert(notFound.status === 404, 'Non-existent record returns 404');

  await teardown();

  console.log('\nAll Faculty Achievements API tests passed.');
};

runTests().catch(async (error) => {
  console.error('\nFaculty Achievements API tests failed:', error);
  await teardown().catch(() => undefined);
  process.exit(1);
});
