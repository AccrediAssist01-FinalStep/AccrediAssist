/**
 * Smart Search end-to-end flow tests.
 *
 * User Query -> Gemini Understanding -> Structured JSON -> MongoDB Search -> Results
 *
 * Uses mocked Gemini responses with real MongoDB execution.
 *
 * Run: npm run test:smart-search-flow
 */

import http from 'http';
import dotenv from 'dotenv';
import { GeminiProvider } from '../ai/providers/gemini.provider';
import { GeminiGenerativeClient } from '../ai/interfaces/gemini-client.interface';
import { connectDatabase, disconnectDatabase } from '../database/connection';
import { CompletedEventReport } from '../models/CompletedEventReport';
import { Internship } from '../models/Internship';
import { Patent } from '../models/Patent';
import { Placement } from '../models/Placement';
import { Publication } from '../models/Publication';
import { SmartSearchAgent } from '../search/agents/smart-search.agent';
import { GlobalSearchApiData } from '../search/interfaces/global-search.interface';
import { createTestUser, cleanupTestUser } from './test-helpers';

dotenv.config();

const ADMIN_EMAIL = 'smart-search-flow-admin@accrediassist.edu';

interface FlowScenario {
  name: string;
  query: string;
  mockResponse: {
    collection: string;
    filters: Record<string, unknown>;
    sort?: string;
    confidence?: number;
  };
  expectedCollection: string;
  minResults: number;
  expectedFilterKey?: string;
}

const FLOW_SCENARIOS: FlowScenario[] = [
  {
    name: 'TCS placements',
    query: 'Students placed in TCS.',
    mockResponse: {
      collection: 'placements',
      filters: { company: 'TCS' },
      confidence: 94,
    },
    expectedCollection: 'placements',
    minResults: 2,
    expectedFilterKey: 'company',
  },
  {
    name: '2026 internships',
    query: 'Show all internships completed in 2026.',
    mockResponse: {
      collection: 'internships',
      filters: { year: 2026 },
      confidence: 91,
    },
    expectedCollection: 'internships',
    minResults: 2,
    expectedFilterKey: 'year',
  },
  {
    name: 'AI publications',
    query: 'Faculty publications on AI.',
    mockResponse: {
      collection: 'publications',
      filters: { topic: 'AI' },
      confidence: 89,
    },
    expectedCollection: 'publications',
    minResults: 1,
    expectedFilterKey: 'topic',
  },
  {
    name: 'Granted patents',
    query: 'Patents with status granted.',
    mockResponse: {
      collection: 'patents',
      filters: { status: 'Granted' },
      confidence: 92,
    },
    expectedCollection: 'patents',
    minResults: 1,
    expectedFilterKey: 'status',
  },
  {
    name: 'Workshop events',
    query: 'Completed workshops in CSE department.',
    mockResponse: {
      collection: 'completed_event_reports',
      filters: { eventType: 'Workshop' },
      confidence: 88,
    },
    expectedCollection: 'completed_event_reports',
    minResults: 1,
    expectedFilterKey: 'eventType',
  },
  {
    name: 'Latest TCS placements',
    query: 'TCS placement students in 2026 sorted by latest.',
    mockResponse: {
      collection: 'placements',
      filters: { company: 'TCS', year: 2026 },
      sort: 'latest',
      confidence: 95,
    },
    expectedCollection: 'placements',
    minResults: 2,
    expectedFilterKey: 'company',
  },
];

interface ApiResult {
  status: number;
  body: {
    success: boolean;
    message: string;
    data?: GlobalSearchApiData;
  };
}

let server: http.Server;
let baseUrl: string;
let adminToken: string;
let adminUserId: string;
let flowSearchService: import('../search/services/search.service').SearchService;
let searchRepository: import('../search/repositories/search.repository').SearchRepository;
let scenarioIndex = 0;

const assert = (condition: boolean, message: string): void => {
  if (!condition) {
    throw new Error(`FAIL: ${message}`);
  }
  console.log(`PASS: ${message}`);
};

const createMockGeminiClient = (): GeminiGenerativeClient => ({
  models: {
    generateContent: async () => {
      const scenario = FLOW_SCENARIOS[scenarioIndex] ?? FLOW_SCENARIOS[0];

      return {
        text: JSON.stringify({
          collection: scenario.mockResponse.collection,
          filters: scenario.mockResponse.filters,
          sort: scenario.mockResponse.sort ?? '',
          confidence: scenario.mockResponse.confidence ?? 90,
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

const seedSampleData = async (): Promise<void> => {
  await Promise.all([
    Placement.deleteMany({}),
    Internship.deleteMany({}),
    Publication.deleteMany({}),
    CompletedEventReport.deleteMany({}),
    Patent.deleteMany({}),
  ]);

  await Placement.insertMany([
    {
      studentName: 'Rahul Patil',
      department: 'Computer Science',
      company: 'TCS',
      role: 'Graduate Trainee',
      package: '6 LPA',
      joiningDate: new Date('2026-06-01'),
    },
    {
      studentName: 'Vikram Singh',
      department: 'Electronics',
      company: 'TCS',
      role: 'Software Engineer',
      package: '7 LPA',
      joiningDate: new Date('2026-01-10'),
    },
    {
      studentName: 'Ananya Deshmukh',
      department: 'Computer Science',
      company: 'Infosys',
      role: 'Systems Engineer',
      package: '8 LPA',
      joiningDate: new Date('2025-07-15'),
    },
  ]);

  await Internship.insertMany([
    {
      studentName: 'Priya Nair',
      company: 'TCS',
      role: 'Intern',
      duration: '2 months',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-03-01'),
    },
    {
      studentName: 'Sneha Rao',
      company: 'Microsoft',
      role: 'Intern',
      duration: '2 months',
      startDate: new Date('2026-02-01'),
      endDate: new Date('2026-04-30'),
    },
    {
      studentName: 'Amit Kumar',
      company: 'Google',
      role: 'Summer Intern',
      duration: '3 months',
      startDate: new Date('2025-05-01'),
      endDate: new Date('2025-08-01'),
    },
  ]);

  await Publication.insertMany([
    {
      facultyName: 'Dr. Sharma',
      paperTitle: 'Deep Learning for Medical Imaging',
      journal: 'IEEE Transactions',
      authors: ['Dr. Sharma'],
      publicationDate: new Date('2026-03-10'),
    },
    {
      facultyName: 'Dr. Rao',
      paperTitle: 'AI Applications in Smart Cities',
      journal: 'Springer',
      authors: ['Dr. Rao'],
      publicationDate: new Date('2025-11-20'),
    },
  ]);

  await CompletedEventReport.insertMany([
    {
      eventTitle: 'Cloud Computing Workshop',
      eventType: 'Workshop',
      date: new Date('2026-02-20'),
      venue: 'CSE Seminar Hall',
      coordinator: 'Dr. Rao',
      photoUrls: [],
    },
  ]);

  await Patent.insertMany([
    {
      patentTitle: 'AI-based Attendance System',
      inventors: ['Dr. Sharma'],
      status: 'Granted',
      filingDate: new Date('2026-01-15'),
    },
    {
      patentTitle: 'IoT Water Monitoring Device',
      inventors: ['Dr. Iyer'],
      status: 'Filed',
      filingDate: new Date('2024-08-20'),
    },
  ]);
};

const assertStandardizedResponse = (response: GlobalSearchApiData, scenario: FlowScenario): void => {
  assert(response.query === scenario.query, `${scenario.name}: response includes original query`);
  assert(Boolean(response.understanding), `${scenario.name}: response includes understanding`);
  assert(
    response.understanding.collection === scenario.expectedCollection,
    `${scenario.name}: understanding collection matches`,
  );
  assert(
    response.understanding.source === 'gemini',
    `${scenario.name}: understanding source is gemini`,
  );
  assert(
    typeof response.understanding.confidence === 'number',
    `${scenario.name}: understanding includes confidence`,
  );
  assert(Boolean(response.understanding.filters), `${scenario.name}: understanding includes filters`);

  if (scenario.expectedFilterKey) {
    assert(
      scenario.expectedFilterKey in response.understanding.filters,
      `${scenario.name}: understanding filters include ${scenario.expectedFilterKey}`,
    );
  }

  assert(Array.isArray(response.results), `${scenario.name}: results include results array`);
  assert(Boolean(response.meta), `${scenario.name}: response includes pagination meta`);
  assert(
    response.results.length >= scenario.minResults,
    `${scenario.name}: MongoDB returned at least ${scenario.minResults} result(s)`,
  );
  assert(
    response.results.every((item) => item.collection === scenario.expectedCollection),
    `${scenario.name}: result items reference the expected collection`,
  );
  assert(
    response.results.every((item) => Boolean(item.recordId && item.summary)),
    `${scenario.name}: result items include recordId and summary`,
  );
};

const testServiceFlow = async (): Promise<void> => {
  console.log('\n--- Service end-to-end flow ---');

  for (const [index, scenario] of FLOW_SCENARIOS.entries()) {
    scenarioIndex = index;

    const response = await flowSearchService.globalSearch(
      {
        query: scenario.query,
        page: 1,
        limit: 20,
      },
      adminUserId,
    );

    assertStandardizedResponse(response, scenario);
    console.log(`PASS: ${scenario.name} service flow completed`);
  }
};

const testPaginatedFlow = async (): Promise<void> => {
  console.log('\n--- Paginated smart search flow ---');

  scenarioIndex = 0;

  const response = await flowSearchService.globalSearch(
    {
      query: 'Students placed in TCS.',
      page: 1,
      limit: 1,
      fields: ['studentName', 'company'],
    },
    adminUserId,
  );

  assert(response.results.length === 1, 'Pagination limit applies in integrated flow');
  assert(response.meta.total === 2, 'Pagination meta total reflects all matches');
  assert(response.meta.totalPages === 2, 'Pagination meta totalPages is calculated');
  assert(
    response.results.every(
      (item) => item.data && 'studentName' in item.data && !('role' in item.data),
    ),
    'Field projection applies in integrated flow',
  );
};

const testApiFlow = async (): Promise<void> => {
  console.log('\n--- API end-to-end flow ---');

  const login = await request('POST', '/api/v1/auth/login', {
    email: ADMIN_EMAIL,
    password: 'Test@12345',
  });

  assert(login.status === 200, 'Admin login succeeds for smart search flow API');
  adminToken = (login.body.data as { token: string }).token;

  for (const [index, scenario] of FLOW_SCENARIOS.entries()) {
    scenarioIndex = index;

    const postResult = await request(
      'POST',
      '/api/v1/search',
      { query: scenario.query },
      adminToken,
    );

    assert(postResult.status === 200, `${scenario.name}: POST /search returns 200`);
    assert(postResult.body.success === true, `${scenario.name}: POST /search success flag is true`);

    if (!postResult.body.data) {
      throw new Error(`FAIL: ${scenario.name}: POST /search missing data payload`);
    }

    assertStandardizedResponse(postResult.body.data, scenario);
    console.log(`PASS: ${scenario.name} POST /search flow completed`);
  }

  scenarioIndex = 2;

  const getResult = await request(
    'GET',
    '/api/v1/search?query=Faculty%20publications%20on%20AI.&page=1&limit=10',
    undefined,
    adminToken,
  );

  assert(getResult.status === 200, 'GET /search returns 200');
  assert(getResult.body.success === true, 'GET /search success flag is true');

  if (!getResult.body.data) {
    throw new Error('FAIL: GET /search missing data payload');
  }

  assert(
    getResult.body.data.understanding.collection === 'publications',
    'GET /search understanding maps to publications',
  );
  assert(getResult.body.data.results.length >= 1, 'GET /search returns MongoDB results');
};

const testRepositoryStillIndependent = async (): Promise<void> => {
  console.log('\n--- Repository sanity check ---');

  const direct = await searchRepository.execute({
    collection: 'placements',
    filters: { company: 'Infosys' },
  });

  assert(direct.items.length === 1, 'Direct repository execution still works independently');
};

const setup = async (): Promise<void> => {
  await connectDatabase();
  await cleanupTestUser(ADMIN_EMAIL);

  await createTestUser({
    name: 'Smart Search Flow Admin',
    email: ADMIN_EMAIL,
    role: 'Admin',
  }).then((user) => {
    adminUserId = user._id.toString();
  });

  await seedSampleData();

  const searchModule = await import('../search');
  searchRepository = searchModule.searchRepository;

  const mockAgent = new SmartSearchAgent(new GeminiProvider(createMockGeminiClient()));
  flowSearchService = new searchModule.SearchService(mockAgent, searchRepository);

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
};

const teardown = async (): Promise<void> => {
  await Promise.all([
    Placement.deleteMany({}),
    Internship.deleteMany({}),
    Publication.deleteMany({}),
    CompletedEventReport.deleteMany({}),
    Patent.deleteMany({}),
  ]);

  await cleanupTestUser(ADMIN_EMAIL);

  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) reject(error);
      else resolve();
    });
  });

  await disconnectDatabase();
};

const runTests = async (): Promise<void> => {
  console.log('Running Smart Search end-to-end flow tests...');

  await setup();

  try {
    await testServiceFlow();
    await testPaginatedFlow();
    await testApiFlow();
    await testRepositoryStillIndependent();
  } finally {
    await teardown();
  }

  console.log('\nAll Smart Search end-to-end flow tests passed.');
};

runTests().catch((error) => {
  console.error('\nSmart Search end-to-end flow tests failed:', error);
  process.exit(1);
});
