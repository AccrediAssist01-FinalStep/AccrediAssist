/**
 * User API integration tests (POST /api/v1/users authorization).
 */

import http from 'http';
import dotenv from 'dotenv';
import app from '../app';
import { connectDatabase, disconnectDatabase } from '../database/connection';
import { createTestUser, cleanupTestUser } from './test-helpers';

dotenv.config();

const ADMIN_EMAIL = 'user-api-admin@accrediassist.edu';
const FACULTY_EMAIL = 'user-api-faculty@accrediassist.edu';
const NEW_USER_EMAIL = 'user-api-created@accrediassist.edu';

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
  await cleanupTestUser(ADMIN_EMAIL);
  await cleanupTestUser(FACULTY_EMAIL);
  await cleanupTestUser(NEW_USER_EMAIL);

  await createTestUser({
    name: 'User API Admin',
    email: ADMIN_EMAIL,
    role: 'Admin',
  });

  await createTestUser({
    name: 'User API Faculty',
    email: FACULTY_EMAIL,
    role: 'Faculty',
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
};

const teardown = async (): Promise<void> => {
  await cleanupTestUser(NEW_USER_EMAIL);
  await cleanupTestUser(FACULTY_EMAIL);
  await cleanupTestUser(ADMIN_EMAIL);

  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });

  await disconnectDatabase();
};

const runTests = async (): Promise<void> => {
  console.log('Running user API tests...\n');

  const unauthenticated = await request('POST', '/api/v1/users', {
    name: 'Blocked User',
    email: NEW_USER_EMAIL,
    password: 'Test@12345',
    role: 'Faculty',
  });
  assert(unauthenticated.status === 401, 'POST /users returns 401 without authentication');

  const forbidden = await request(
    'POST',
    '/api/v1/users',
    {
      name: 'Blocked User',
      email: NEW_USER_EMAIL,
      password: 'Test@12345',
      role: 'Faculty',
    },
    facultyToken,
  );
  assert(forbidden.status === 403, 'POST /users returns 403 for non-Admin user');

  const created = await request(
    'POST',
    '/api/v1/users',
    {
      name: 'Created Faculty',
      email: NEW_USER_EMAIL,
      password: 'Test@12345',
      role: 'Faculty',
      department: 'Computer Science',
    },
    adminToken,
  );
  assert(created.status === 201, 'POST /users returns 201 for authorized Admin');
  assert(created.body.success === true, 'Admin user creation returns success: true');
  assert(
    (created.body.data as { email?: string })?.email === NEW_USER_EMAIL,
    'Admin user creation returns created user email',
  );

  console.log('\nAll user API tests passed.');
};

const main = async (): Promise<void> => {
  try {
    await setup();
    await runTests();
  } finally {
    await teardown();
  }
};

main().catch((error) => {
  console.error('\nUser API tests failed:', error);
  process.exit(1);
});
