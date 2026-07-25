/**
 * Smart Search MongoDB execution tests.
 *
 * Seeds sample records and validates structured search execution.
 * Does NOT invoke Gemini.
 *
 * Run: npm run test:search-execution
 */

import http from 'http';
import dotenv from 'dotenv';
import app from '../app';
import { connectDatabase, disconnectDatabase } from '../database/connection';
import { CompletedEventReport } from '../models/CompletedEventReport';
import { FacultyAchievement } from '../models/FacultyAchievement';
import { Internship } from '../models/Internship';
import { Patent } from '../models/Patent';
import { Placement } from '../models/Placement';
import { Publication } from '../models/Publication';
import { StudentAchievement } from '../models/StudentAchievement';
import { searchRepository, searchService } from '../search';
import { createTestUser, cleanupTestUser } from './test-helpers';

dotenv.config();

const ADMIN_EMAIL = 'search-execution-admin@accrediassist.edu';

interface ApiResult {
  status: number;
  body: {
    success: boolean;
    message: string;
    data?: {
      understanding: {
        collection: string;
        filters?: Record<string, unknown>;
        sort?: string;
        source?: string;
      };
      results: {
        items: Array<{ recordId: string; summary: string; data?: Record<string, unknown> }>;
        meta: { total: number; page: number; limit: number; totalPages: number };
      };
    };
  };
}

let server: http.Server;
let baseUrl: string;
let adminToken: string;

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

const seedSampleData = async (): Promise<void> => {
  await Promise.all([
    Placement.deleteMany({}),
    Internship.deleteMany({}),
    Publication.deleteMany({}),
    StudentAchievement.deleteMany({}),
    FacultyAchievement.deleteMany({}),
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
      studentName: 'Ananya Deshmukh',
      department: 'Computer Science',
      company: 'Infosys',
      role: 'Systems Engineer',
      package: '8 LPA',
      joiningDate: new Date('2025-07-15'),
    },
    {
      studentName: 'Vikram Singh',
      department: 'Electronics',
      company: 'TCS',
      role: 'Software Engineer',
      package: '7 LPA',
      joiningDate: new Date('2026-01-10'),
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
      studentName: 'Amit Kumar',
      company: 'Google',
      role: 'Summer Intern',
      duration: '3 months',
      startDate: new Date('2025-05-01'),
      endDate: new Date('2025-08-01'),
    },
    {
      studentName: 'Sneha Rao',
      company: 'Microsoft',
      role: 'Intern',
      duration: '2 months',
      startDate: new Date('2026-02-01'),
      endDate: new Date('2026-04-30'),
    },
  ]);

  await Publication.insertMany([
    {
      facultyName: 'Dr. Sharma',
      paperTitle: 'Deep Learning for Medical Imaging',
      journal: 'IEEE Transactions',
      authors: ['Dr. Sharma', 'Dr. Patel'],
      publicationDate: new Date('2026-03-10'),
    },
    {
      facultyName: 'Dr. Rao',
      paperTitle: 'AI Applications in Smart Cities',
      journal: 'Springer',
      authors: ['Dr. Rao'],
      publicationDate: new Date('2025-11-20'),
    },
    {
      facultyName: 'Dr. Mehta',
      paperTitle: 'Blockchain for Supply Chain',
      conference: 'IEEE Conference',
      authors: ['Dr. Mehta'],
      publicationDate: new Date('2026-01-05'),
    },
  ]);

  await StudentAchievement.insertMany([
    {
      studentName: 'Karan Joshi',
      department: 'Computer Science',
      achievementType: 'Sports',
      title: 'Inter-college Cricket Winner',
      date: new Date('2026-02-15'),
      photos: [],
    },
    {
      studentName: 'Neha Kulkarni',
      department: 'Computer Science',
      achievementType: 'Hackathon',
      title: 'Smart India Hackathon Finalist',
      date: new Date('2025-12-01'),
      photos: [],
    },
  ]);

  await FacultyAchievement.insertMany([
    {
      facultyName: 'Dr. Sharma',
      achievementType: 'Research',
      title: 'Best Research Paper Award',
      date: new Date('2026-04-01'),
      photos: [],
    },
    {
      facultyName: 'Dr. Iyer',
      achievementType: 'Award',
      title: 'Outstanding Faculty Award',
      date: new Date('2025-09-12'),
      photos: [],
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
    {
      eventTitle: 'Technical Symposium',
      eventType: 'Seminar',
      date: new Date('2025-10-05'),
      venue: 'Main Auditorium',
      coordinator: 'Dr. Mehta',
      photoUrls: [],
    },
  ]);

  await Patent.insertMany([
    {
      patentTitle: 'AI-based Attendance System',
      inventors: ['Dr. Sharma', 'Dr. Rao'],
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

const testRepositoryExecution = async (): Promise<void> => {
  console.log('\n--- Repository structured search ---');

  const tcsPlacements = await searchRepository.execute({
    collection: 'placements',
    filters: { company: 'TCS' },
    sort: 'latest',
  });

  assert(tcsPlacements.items.length === 2, 'Company filter returns TCS placements');
  assert(tcsPlacements.meta.total === 2, 'Company filter total count is correct');
  assert(Boolean(tcsPlacements.items[0]?.summary), 'Search results include summaries');
  assert(Boolean(tcsPlacements.items[0]?.data?.studentName), 'Search results include projected data');

  const placements2026 = await searchRepository.execute({
    collection: 'placements',
    filters: { year: 2026 },
  });

  assert(placements2026.items.length === 2, 'Year filter returns 2026 placements');

  const internships2026 = await searchRepository.execute({
    collection: 'internships',
    filters: { year: 2026 },
  });

  assert(internships2026.items.length === 2, 'Year filter returns 2026 internships');

  const paginated = await searchRepository.execute({
    collection: 'placements',
    filters: {},
    pagination: { page: 1, limit: 2 },
  });

  assert(paginated.items.length === 2, 'Pagination limit is applied');
  assert(paginated.meta.total === 3, 'Pagination total reflects full result count');
  assert(paginated.meta.totalPages === 2, 'Pagination totalPages is calculated');

  const pageTwo = await searchRepository.execute({
    collection: 'placements',
    filters: {},
    pagination: { page: 2, limit: 2 },
  });

  assert(pageTwo.items.length === 1, 'Second page returns remaining records');

  const oldestInternships = await searchRepository.execute({
    collection: 'internships',
    filters: { company: 'Microsoft' },
    sort: 'oldest',
  });

  assert(oldestInternships.items.length === 1, 'Sort filter returns matching internships');
  assert(
    oldestInternships.items[0]?.data?.company === 'Microsoft',
    'Sorted internship result matches company filter',
  );

  const projected = await searchRepository.execute({
    collection: 'placements',
    filters: { company: 'TCS' },
    fields: ['studentName', 'company'],
  });

  assert(
    projected.items.every(
      (item) =>
        item.data &&
        'studentName' in item.data &&
        'company' in item.data &&
        !('role' in item.data),
    ),
    'Custom projection limits returned fields',
  );

  const aiPublications = await searchRepository.execute({
    collection: 'publications',
    filters: { topic: 'AI' },
  });

  assert(aiPublications.items.length >= 1, 'Full text topic search finds AI publications');

  const departmentPlacements = await searchRepository.execute({
    collection: 'placements',
    filters: {},
    department: 'Computer Science',
  });

  assert(departmentPlacements.items.length === 2, 'Department context filters placements');

  const grantedPatents = await searchRepository.execute({
    collection: 'patents',
    filters: { status: 'Granted' },
  });

  assert(grantedPatents.items.length === 1, 'Status filter returns granted patents');

  const workshops = await searchRepository.execute({
    collection: 'completed_event_reports',
    filters: { eventType: 'Workshop' },
  });

  assert(workshops.items.length === 1, 'Event type filter returns workshop reports');
};

const testServiceExecution = async (): Promise<void> => {
  console.log('\n--- Service structured search ---');

  const result = await searchService.executeStructuredSearch(
    {
      collection: 'publications',
      filters: { facultyName: 'Dr. Sharma' },
      sort: 'latest',
    },
    'test-user',
  );

  assert(result.understanding.collection === 'publications', 'Service returns requested collection');
  assert(result.understanding.source === 'structured', 'Structured path marks understanding source');
  assert(result.results.items.length === 1, 'Service executes facultyName filter');
  assert(result.results.meta.total === 1, 'Service returns pagination metadata');
};

const testExecuteApi = async (): Promise<void> => {
  console.log('\n--- Execute search API ---');

  const login = await request('POST', '/api/v1/auth/login', {
    email: ADMIN_EMAIL,
    password: 'Test@12345',
  });

  assert(login.status === 200, 'Admin login succeeds for search execution API');
  adminToken = (login.body.data as { token: string }).token;

  const execute = await request(
    'POST',
    '/api/v1/search/execute',
    {
      collection: 'placements',
      filters: { company: 'TCS' },
      sort: 'latest',
      page: 1,
      limit: 10,
      fields: ['studentName', 'company', 'joiningDate'],
    },
    adminToken,
  );

  assert(execute.status === 200, 'POST /search/execute returns 200');
  assert(execute.body.success === true, 'Execute API success flag is true');
  assert(execute.body.data?.understanding.collection === 'placements', 'Execute API returns collection');
  assert(execute.body.data?.results.items.length === 2, 'Execute API returns matching records');
  assert(execute.body.data?.results.meta.total === 2, 'Execute API returns pagination meta');
  assert(
    execute.body.data?.results.items.every((item) => item.data && 'studentName' in item.data),
    'Execute API returns projected record data',
  );

  const textSearch = await request(
    'POST',
    '/api/v1/search/execute',
    {
      collection: 'publications',
      filters: { topic: 'Deep Learning' },
    },
    adminToken,
  );

  assert(textSearch.status === 200, 'Execute API supports full text topic filter');
  assert(
    (textSearch.body.data?.results.items.length ?? 0) >= 1,
    'Execute API full text search returns results',
  );
};

const setup = async (): Promise<void> => {
  await connectDatabase();
  await cleanupTestUser(ADMIN_EMAIL);

  await createTestUser({
    name: 'Search Execution Admin',
    email: ADMIN_EMAIL,
    role: 'Admin',
  });

  await seedSampleData();

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
    StudentAchievement.deleteMany({}),
    FacultyAchievement.deleteMany({}),
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
  console.log('Running Smart Search MongoDB execution tests...');

  await setup();

  try {
    await testRepositoryExecution();
    await testServiceExecution();
    await testExecuteApi();
  } finally {
    await teardown();
  }

  console.log('\nAll Smart Search MongoDB execution tests passed.');
};

runTests().catch((error) => {
  console.error('\nSmart Search MongoDB execution tests failed:', error);
  process.exit(1);
});
