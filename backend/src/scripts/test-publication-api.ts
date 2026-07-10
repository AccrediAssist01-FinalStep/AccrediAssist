/**
 * Publications API integration tests.
 *
 * Prerequisites:
 *   1. cp backend/.env.example backend/.env (set MONGODB_URI and JWT_SECRET)
 *   2. npm install
 *   3. npm run test:publication-api
 */

import http from 'http';
import dotenv from 'dotenv';
import app from '../app';
import { connectDatabase, disconnectDatabase } from '../database/connection';
import { Publication } from '../models/Publication';
import { createTestUser, cleanupTestUser } from './test-helpers';

dotenv.config();

const ADMIN_EMAIL = 'publication-api-admin@accrediassist.edu';
const HOD_EMAIL = 'publication-api-hod@accrediassist.edu';

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
let publicationId: string;

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
  await Publication.deleteMany({});
  await cleanupTestUser(ADMIN_EMAIL);
  await cleanupTestUser(HOD_EMAIL);

  await createTestUser({
    name: 'Publication API Admin',
    email: ADMIN_EMAIL,
    role: 'Admin',
  });

  await createTestUser({
    name: 'Publication API HOD',
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
  await Publication.deleteMany({});
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
  console.log('Running Publications API tests...\n');

  await setup();

  const unauthorized = await request('GET', '/api/v1/publications');
  assert(unauthorized.status === 401, 'GET /publications rejects missing token');

  const created = await request(
    'POST',
    '/api/v1/publications',
    {
      facultyName: 'Dr. Mehta',
      paperTitle: 'Machine Learning in Healthcare Diagnostics',
      journal: 'IEEE Transactions on Biomedical Engineering',
      authors: ['Dr. Mehta', 'Dr. Patel', 'A. Kumar'],
      doi: '10.1109/TBME.2025.1234567',
      publicationDate: '2025-11-20',
      documentUrl: 'https://cloudinary.com/publications/ml-healthcare.pdf',
    },
    adminToken,
  );
  assert(created.status === 201, 'POST /publications creates record');
  assert(created.body.success === true, 'Create returns success true');
  publicationId = (created.body.data as { _id: string })._id;
  assert(!!publicationId, 'Create returns record ID');

  const hodCreate = await request(
    'POST',
    '/api/v1/publications',
    {
      facultyName: 'Dr. Test',
      paperTitle: 'Test Paper',
    },
    hodToken,
  );
  assert(hodCreate.status === 403, 'HOD cannot create publications');

  const list = await request('GET', '/api/v1/publications?page=1&limit=10', undefined, hodToken);
  assert(list.status === 200, 'GET /publications returns 200 for HOD');
  const listData = list.body.data as { items: unknown[]; meta: { total: number } };
  assert(listData.items.length >= 1, 'GET /publications returns items');
  assert(listData.meta.total >= 1, 'GET /publications returns meta total');

  const byFaculty = await request(
    'GET',
    '/api/v1/publications?facultyName=Mehta',
    undefined,
    adminToken,
  );
  assert(byFaculty.status === 200, 'GET /publications filters by facultyName');
  const facultyItems = (byFaculty.body.data as { items: { facultyName: string }[] }).items;
  assert(
    facultyItems.every((item) => item.facultyName.toLowerCase().includes('mehta')),
    'Faculty name filter returns matching records',
  );

  const searched = await request(
    'GET',
    '/api/v1/publications?search=Healthcare',
    undefined,
    adminToken,
  );
  assert(searched.status === 200, 'GET /publications supports search');
  const searchItems = (searched.body.data as { items: { paperTitle: string }[] }).items;
  assert(searchItems.length >= 1, 'Search returns matching records');

  const byId = await request(
    'GET',
    `/api/v1/publications/${publicationId}`,
    undefined,
    adminToken,
  );
  assert(byId.status === 200, 'GET /publications/:id returns 200');
  assert(
    (byId.body.data as { _id: string })._id === publicationId,
    'GET /publications/:id returns correct record',
  );

  const updated = await request(
    'PUT',
    `/api/v1/publications/${publicationId}`,
    {
      conference: 'International Conference on AI in Medicine',
      journal: undefined,
    },
    adminToken,
  );
  assert(updated.status === 200, 'PUT /publications/:id updates record');
  assert(
    (updated.body.data as { conference: string }).conference ===
      'International Conference on AI in Medicine',
    'PUT /publications/:id persists updates',
  );

  const deleted = await request(
    'DELETE',
    `/api/v1/publications/${publicationId}`,
    undefined,
    adminToken,
  );
  assert(deleted.status === 200, 'DELETE /publications/:id soft deletes record');

  const afterDelete = await request(
    'GET',
    `/api/v1/publications/${publicationId}`,
    undefined,
    adminToken,
  );
  assert(afterDelete.status === 404, 'Soft-deleted record is not returned');

  const invalid = await request(
    'POST',
    '/api/v1/publications',
    {
      facultyName: 'Dr. Test',
    },
    adminToken,
  );
  assert(invalid.status === 422, 'Missing paperTitle returns 422');

  const notFound = await request(
    'GET',
    `/api/v1/publications/${'0'.repeat(24)}`,
    undefined,
    adminToken,
  );
  assert(notFound.status === 404, 'Non-existent record returns 404');

  await teardown();

  console.log('\nAll Publications API tests passed.');
};

runTests().catch(async (error) => {
  console.error('\nPublications API tests failed:', error);
  await teardown().catch(() => undefined);
  process.exit(1);
});
