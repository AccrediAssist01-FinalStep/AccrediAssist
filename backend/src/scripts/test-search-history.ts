/**
 * Search history API tests.
 *
 * Verifies history is recorded on search and history APIs work.
 *
 * Run: npm run test:search-history
 */

import http from 'http';
import dotenv from 'dotenv';
import { connectDatabase, disconnectDatabase } from '../database/connection';
import { Placement } from '../models/Placement';
import { SearchHistory } from '../models/SearchHistory';
import { searchHistoryService } from '../search/services/search-history.service';
import { createTestUser, cleanupTestUser } from './test-helpers';

dotenv.config();

const ADMIN_EMAIL = 'search-history-admin@accrediassist.edu';
const OTHER_EMAIL = 'search-history-other@accrediassist.edu';

interface ApiResult {
  status: number;
  body: {
    success: boolean;
    message: string;
    data?: unknown;
  };
}

let server: http.Server;
let baseUrl: string;
let adminToken: string;
let otherToken: string;

const assert = (condition: boolean, message: string): void => {
  if (!condition) {
    throw new Error(`FAIL: ${message}`);
  }
  console.log(`PASS: ${message}`);
};

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

const login = async (email: string, password: string): Promise<string> => {
  const result = await request('POST', '/api/v1/auth/login', { email, password });
  assert(result.status === 200, `Login succeeds for ${email}`);
  return (result.body.data as { token: string }).token;
};

const seedPlacements = async (): Promise<void> => {
  await Placement.deleteMany({});
  await SearchHistory.deleteMany({});

  await Placement.insertMany([
    {
      studentName: 'Rahul Patil',
      department: 'Computer Science',
      company: 'TCS',
      role: 'Graduate Trainee',
      joiningDate: new Date('2026-06-01'),
    },
    {
      studentName: 'Vikram Singh',
      department: 'Electronics',
      company: 'TCS',
      role: 'Software Engineer',
      joiningDate: new Date('2026-01-10'),
    },
  ]);
};

const testHistoryRecording = async (): Promise<void> => {
  console.log('\n--- History recording ---');

  const execute = await request(
    'POST',
    '/api/v1/search/execute',
    {
      collection: 'placements',
      filters: { company: 'TCS' },
    },
    adminToken,
  );

  assert(execute.status === 200, 'Structured search executes successfully');

  const history = await request('GET', '/api/v1/search/history', undefined, adminToken);
  assert(history.status === 200, 'GET /search/history returns 200');

  const historyData = history.body.data as {
    items: Array<{
      query: string;
      resultCount: number;
      searchedAt: string;
      userId: string;
    }>;
    meta: { total: number };
  };

  assert(history.body.success === true, 'History response success flag is true');
  assert(historyData.items.length === 1, 'Search execution creates one history entry');
  assert(historyData.meta.total === 1, 'History meta total is 1');
  assert(
    historyData.items[0].query.includes('placements'),
    'History stores query label',
  );
  assert(historyData.items[0].resultCount === 2, 'History stores result count');
  assert(Boolean(historyData.items[0].searchedAt), 'History stores searchedAt timestamp');
  assert(Boolean(historyData.items[0].userId), 'History stores user reference');
};

const testMultipleEntries = async (): Promise<void> => {
  console.log('\n--- Multiple history entries ---');

  await request(
    'POST',
    '/api/v1/search/execute',
    {
      collection: 'placements',
      filters: { department: 'Electronics' },
    },
    adminToken,
  );

  const history = await request('GET', '/api/v1/search/history?page=1&limit=10', undefined, adminToken);
  const historyData = history.body.data as {
    items: Array<{ query: string; resultCount: number }>;
    meta: { total: number };
  };

  assert(historyData.items.length === 2, 'Multiple searches accumulate in history');
  assert(historyData.meta.total === 2, 'History total reflects multiple entries');
  assert(
    historyData.items.some((entry) => entry.resultCount === 1),
    'History entries store per-search result counts',
  );
};

const testServiceHistory = async (): Promise<void> => {
  console.log('\n--- Search history service ---');

  const recorded = await searchHistoryService.recordSearch(
    (await createTestUser({
      name: 'History Service User',
      email: 'search-history-service@accrediassist.edu',
      role: 'Faculty',
    }))._id.toString(),
    'Internships at Google',
    3,
  );

  assert(recorded.query === 'Internships at Google', 'Service records query text');
  assert(recorded.resultCount === 3, 'Service records result count');
  assert(Boolean(recorded.searchedAt), 'Service exposes searchedAt timestamp');

  await cleanupTestUser('search-history-service@accrediassist.edu');
};

const testClearHistory = async (): Promise<void> => {
  console.log('\n--- Clear search history ---');

  const cleared = await request('DELETE', '/api/v1/search/history', undefined, adminToken);
  assert(cleared.status === 200, 'DELETE /search/history returns 200');
  assert(cleared.body.success === true, 'Delete history success flag is true');
  assert(
    (cleared.body.data as { deletedCount: number }).deletedCount === 2,
    'Delete history reports deleted count',
  );

  const history = await request('GET', '/api/v1/search/history', undefined, adminToken);
  const historyData = history.body.data as { items: unknown[]; meta: { total: number } };

  assert(historyData.items.length === 0, 'History is empty after delete');
  assert(historyData.meta.total === 0, 'History total is zero after delete');
};

const testUserIsolation = async (): Promise<void> => {
  console.log('\n--- User-scoped history ---');

  await request(
    'POST',
    '/api/v1/search/execute',
    {
      collection: 'placements',
      filters: { company: 'TCS' },
    },
    adminToken,
  );

  const otherHistory = await request('GET', '/api/v1/search/history', undefined, otherToken);
  const otherData = otherHistory.body.data as { items: unknown[]; meta: { total: number } };

  assert(otherData.items.length === 0, 'Other users do not see admin search history');
  assert(otherData.meta.total === 0, 'Other user history total is zero');
};

const setup = async (): Promise<void> => {
  await connectDatabase();
  await cleanupTestUser(ADMIN_EMAIL);
  await cleanupTestUser(OTHER_EMAIL);
  await SearchHistory.deleteMany({});

  await createTestUser({
    name: 'Search History Admin',
    email: ADMIN_EMAIL,
    role: 'Admin',
  });

  await createTestUser({
    name: 'Search History Other',
    email: OTHER_EMAIL,
    role: 'Faculty',
  });

  await seedPlacements();

  const appModule = await import('../app');
  const app = appModule.default;

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
  otherToken = await login(OTHER_EMAIL, 'Test@12345');
};

const teardown = async (): Promise<void> => {
  await Placement.deleteMany({});
  await SearchHistory.deleteMany({});
  await cleanupTestUser(ADMIN_EMAIL);
  await cleanupTestUser(OTHER_EMAIL);

  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) reject(error);
      else resolve();
    });
  });

  await disconnectDatabase();
};

const runTests = async (): Promise<void> => {
  console.log('Running search history tests...');

  await setup();

  try {
    await testHistoryRecording();
    await testMultipleEntries();
    await testServiceHistory();
    await testClearHistory();
    await testUserIsolation();
  } finally {
    await teardown();
  }

  console.log('\nAll search history tests passed.');
};

runTests().catch((error) => {
  console.error('\nSearch history tests failed:', error);
  process.exit(1);
});
