/**
 * Global Search REST API tests (Document 17).
 *
 * Verifies POST /api/v1/search:
 *   - Authentication
 *   - Gemini query parsing (mocked)
 *   - MongoDB execution
 *   - Pagination
 *   - Filtering
 *   - Error handling
 *
 * Postman collection: docs/postman/AccrediAssist-Global-Search.postman_collection.json
 *
 * Run: npm run test:search-api
 */

import http from 'http';
import dotenv from 'dotenv';
import { GeminiProvider } from '../ai/providers/gemini.provider';
import { GeminiGenerativeClient } from '../ai/interfaces/gemini-client.interface';
import { connectDatabase, disconnectDatabase } from '../database/connection';
import { Placement } from '../models/Placement';
import { SearchHistory } from '../models/SearchHistory';
import { SmartSearchAgent } from '../search/agents/smart-search.agent';
import { GlobalSearchApiData } from '../search/interfaces/global-search.interface';
import { createTestUser, cleanupTestUser } from './test-helpers';

dotenv.config();

const ADMIN_EMAIL = 'search-api-admin@accrediassist.edu';
const FACULTY_EMAIL = 'search-api-faculty@accrediassist.edu';

interface ApiResult {
  status: number;
  body: {
    success: boolean;
    message: string;
    data?: GlobalSearchApiData;
    errors?: string[];
  };
}

const MOCK_RESPONSES: Record<string, Record<string, unknown>> = {
  'Students placed in TCS.': {
    collection: 'placements',
    filters: { company: 'TCS' },
    sort: 'latest',
    confidence: 94,
  },
  'Show all internships in Infosys': {
    collection: 'internships',
    filters: { company: 'Infosys' },
    sort: '',
    confidence: 90,
  },
  'Faculty publications on AI.': {
    collection: 'publications',
    filters: { topic: 'AI' },
    sort: '',
    confidence: 88,
  },
};

let server: http.Server;
let baseUrl: string;
let adminToken: string;
let facultyToken: string;
let scenarioQuery = 'Students placed in TCS.';

const assert = (condition: boolean, message: string): void => {
  if (!condition) {
    throw new Error(`FAIL: ${message}`);
  }
  console.log(`PASS: ${message}`);
};

const createMockGeminiClient = (): GeminiGenerativeClient => ({
  models: {
    generateContent: async () => {
      const payload =
        Object.entries(MOCK_RESPONSES).find(([key]) => key === scenarioQuery)?.[1] ??
        MOCK_RESPONSES['Students placed in TCS.'];

      return {
        text: JSON.stringify({
          ...payload,
          sort: payload.sort ?? '',
        }),
      };
    },
  },
});

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

const login = async (email: string): Promise<string> => {
  const result = await request('POST', '/api/v1/auth/login', {
    email,
    password: 'Test@12345',
  });
  assert(result.status === 200, `Login succeeds for ${email}`);
  return (result.body.data as unknown as { token: string }).token;
};

const assertGlobalSearchShape = (data: GlobalSearchApiData, query: string): void => {
  assert(data.query === query, 'Response includes original query');
  assert(Boolean(data.understanding), 'Response includes Gemini understanding');
  assert(data.understanding.source === 'gemini', 'Understanding source is gemini');
  assert(Array.isArray(data.results), 'Response includes Document 17 results array');
  assert(Boolean(data.meta), 'Response includes pagination meta');
  assert(typeof data.meta.total === 'number', 'Pagination meta includes total');
  assert(Boolean(data.filters), 'Response includes applied filters');
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
    {
      studentName: 'Ananya Deshmukh',
      department: 'Computer Science',
      company: 'Infosys',
      role: 'Systems Engineer',
      joiningDate: new Date('2025-07-15'),
    },
  ]);
};

const testAuthentication = async (): Promise<void> => {
  console.log('\n--- Authentication ---');

  const unauthorized = await request('POST', '/api/v1/search', {
    query: 'Students placed in TCS.',
  });
  assert(unauthorized.status === 401, 'POST /search requires authentication');
  assert(unauthorized.body.success === false, 'Unauthorized response uses standard error format');

  scenarioQuery = 'Students placed in TCS.';
  const authorized = await request(
    'POST',
    '/api/v1/search',
    { query: scenarioQuery },
    facultyToken,
  );
  assert(authorized.status === 200, 'Faculty with search permission can access POST /search');
};

const testGlobalSearchSuccess = async (): Promise<void> => {
  console.log('\n--- POST /search success ---');

  scenarioQuery = 'Students placed in TCS.';
  const result = await request(
    'POST',
    '/api/v1/search',
    { query: scenarioQuery },
    adminToken,
  );

  assert(result.status === 200, 'POST /search returns 200');
  assert(result.body.success === true, 'Success response follows Document 17 format');
  assert(result.body.message.includes('Global search completed'), 'Success message is returned');

  if (!result.body.data) {
    throw new Error('FAIL: POST /search missing data payload');
  }

  assertGlobalSearchShape(result.body.data, scenarioQuery);
  assert(result.body.data.results.length === 2, 'MongoDB execution returns matching records');
  assert(result.body.data.understanding.collection === 'placements', 'Gemini maps query to placements');
};

const testPagination = async (): Promise<void> => {
  console.log('\n--- Pagination ---');

  scenarioQuery = 'Students placed in TCS.';
  const result = await request(
    'POST',
    '/api/v1/search',
    {
      query: scenarioQuery,
      page: 1,
      limit: 1,
    },
    adminToken,
  );

  assert(result.status === 200, 'Paginated global search returns 200');
  assert(result.body.data?.results.length === 1, 'Pagination limit is applied');
  assert(result.body.data?.meta.total === 2, 'Pagination meta total reflects all matches');
  assert(result.body.data?.meta.totalPages === 2, 'Pagination meta includes totalPages');
};

const testFiltering = async (): Promise<void> => {
  console.log('\n--- Filtering ---');

  scenarioQuery = 'Students placed in TCS.';
  const result = await request(
    'POST',
    '/api/v1/search',
    {
      query: scenarioQuery,
      filters: {
        department: 'Electronics',
      },
    },
    adminToken,
  );

  assert(result.status === 200, 'Filtered global search returns 200');
  assert(result.body.data?.filters.department === 'Electronics', 'Request filters are merged into response');
  assert(result.body.data?.results.length === 1, 'Merged filters refine MongoDB results');
};

const testValidationErrors = async (): Promise<void> => {
  console.log('\n--- Error handling ---');

  const emptyQuery = await request('POST', '/api/v1/search', { query: '   ' }, adminToken);
  assert(
    emptyQuery.status === 400 || emptyQuery.status === 422,
    'Empty query returns validation error status',
  );
  assert(emptyQuery.body.success === false, 'Validation error uses standard error format');
  assert(Boolean(emptyQuery.body.message), 'Validation error includes message');

  const missingQuery = await request('POST', '/api/v1/search', {}, adminToken);
  assert(
    missingQuery.status === 400 || missingQuery.status === 422,
    'Missing query returns validation error status',
  );
};

const testAdditionalScenarios = async (): Promise<void> => {
  console.log('\n--- Additional search scenarios ---');

  scenarioQuery = 'Show all internships in Infosys';
  const internshipSearch = await request(
    'POST',
    '/api/v1/search',
    { query: scenarioQuery },
    adminToken,
  );
  assert(internshipSearch.status === 200, 'Internship query scenario returns 200');
  assert(
    internshipSearch.body.data?.understanding.collection === 'internships',
    'Internship query maps to internships collection',
  );
};

const setup = async (): Promise<void> => {
  await connectDatabase();
  await cleanupTestUser(ADMIN_EMAIL);
  await cleanupTestUser(FACULTY_EMAIL);

  await createTestUser({
    name: 'Search API Admin',
    email: ADMIN_EMAIL,
    role: 'Admin',
  });

  await createTestUser({
    name: 'Search API Faculty',
    email: FACULTY_EMAIL,
    role: 'Faculty',
  });

  await seedPlacements();

  const mockAgent = new SmartSearchAgent(new GeminiProvider(createMockGeminiClient()));
  const { searchService } = await import('../search/services/search.service');
  (searchService as unknown as { agent: SmartSearchAgent }).agent = mockAgent;

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

  adminToken = await login(ADMIN_EMAIL);
  facultyToken = await login(FACULTY_EMAIL);
};

const teardown = async (): Promise<void> => {
  await Placement.deleteMany({});
  await SearchHistory.deleteMany({});
  await cleanupTestUser(ADMIN_EMAIL);
  await cleanupTestUser(FACULTY_EMAIL);

  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) reject(error);
      else resolve();
    });
  });

  await disconnectDatabase();
};

const runTests = async (): Promise<void> => {
  console.log('Running Global Search API tests (Document 17)...');

  await setup();

  try {
    await testAuthentication();
    await testGlobalSearchSuccess();
    await testPagination();
    await testFiltering();
    await testValidationErrors();
    await testAdditionalScenarios();
  } finally {
    await teardown();
  }

  console.log('\nAll Global Search API tests passed.');
  console.log('Import docs/postman/AccrediAssist-Global-Search.postman_collection.json into Postman for manual testing.');
};

runTests().catch((error) => {
  console.error('\nGlobal Search API tests failed:', error);
  process.exit(1);
});
