/**
 * Dashboard analytics API tests (Document 17).
 *
 * Verifies dashboard endpoints using MongoDB aggregation.
 *
 * Run: npm run test:dashboard-api
 */

import http from 'http';
import dotenv from 'dotenv';
import app from '../app';
import { connectDatabase, disconnectDatabase } from '../database/connection';
import { AuditLog } from '../models/AuditLog';
import { FacultyAchievement } from '../models/FacultyAchievement';
import { Internship } from '../models/Internship';
import { Patent } from '../models/Patent';
import { PendingRecord } from '../models/PendingRecord';
import { Placement } from '../models/Placement';
import { Publication } from '../models/Publication';
import { StudentAchievement } from '../models/StudentAchievement';
import { createTestUser, cleanupTestUser } from './test-helpers';

dotenv.config();

const ADMIN_EMAIL = 'dashboard-api-admin@accrediassist.edu';

const ENDPOINTS = [
  { method: 'GET', path: '/api/v1/dashboard/summary' },
  { method: 'GET', path: '/api/v1/dashboard/totals/students' },
  { method: 'GET', path: '/api/v1/dashboard/totals/faculty-achievements' },
  { method: 'GET', path: '/api/v1/dashboard/totals/placements' },
  { method: 'GET', path: '/api/v1/dashboard/totals/internships' },
  { method: 'GET', path: '/api/v1/dashboard/totals/publications' },
  { method: 'GET', path: '/api/v1/dashboard/totals/patents' },
  { method: 'GET', path: '/api/v1/dashboard/totals/pending-reviews' },
  { method: 'GET', path: '/api/v1/dashboard/statistics/monthly?year=2026&month=7' },
  { method: 'GET', path: '/api/v1/dashboard/statistics/yearly?year=2026' },
  { method: 'GET', path: '/api/v1/dashboard/activities/recent?limit=5' },
] as const;

interface ApiResult {
  status: number;
  body: {
    success: boolean;
    message: string;
    data?: Record<string, unknown>;
    errors?: string[];
  };
}

let server: http.Server;
let baseUrl: string;
let adminToken: string;
let adminUserId: string;

const assert = (condition: boolean, message: string): void => {
  if (!condition) {
    throw new Error(`FAIL: ${message}`);
  }
  console.log(`PASS: ${message}`);
};

const request = async (
  method: string,
  path: string,
  token?: string,
): Promise<ApiResult> => {
  const headers: Record<string, string> = {};

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
  });

  const responseBody = (await response.json()) as ApiResult['body'];
  return { status: response.status, body: responseBody };
};

const login = async (email: string): Promise<string> => {
  const response = await fetch(`${baseUrl}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'Test@12345' }),
  });

  const body = (await response.json()) as ApiResult['body'] & {
    data?: { token: string };
  };

  assert(response.status === 200, `Login succeeds for ${email}`);
  return body.data!.token;
};

const seedDashboardData = async (): Promise<void> => {
  await Promise.all([
    Placement.deleteMany({}),
    Internship.deleteMany({}),
    StudentAchievement.deleteMany({}),
    FacultyAchievement.deleteMany({}),
    Publication.deleteMany({}),
    Patent.deleteMany({}),
    PendingRecord.deleteMany({}),
    AuditLog.deleteMany({}),
  ]);

  await Placement.insertMany([
    {
      studentName: 'Rahul Patil',
      company: 'TCS',
      joiningDate: new Date('2026-07-01'),
    },
    {
      studentName: 'Ananya Deshmukh',
      company: 'Infosys',
      joiningDate: new Date('2026-07-05'),
    },
  ]);

  await Internship.insertMany([
    {
      studentName: 'Rahul Patil',
      company: 'Google',
      endDate: new Date('2026-07-10'),
    },
    {
      studentName: 'Priya Nair',
      company: 'Microsoft',
      endDate: new Date('2026-06-15'),
    },
  ]);

  await StudentAchievement.insertMany([
    {
      studentName: 'Vikram Singh',
      achievementType: 'Sports',
      title: 'Cricket Winner',
      date: new Date('2026-07-08'),
      photos: [],
    },
  ]);

  await FacultyAchievement.insertMany([
    {
      facultyName: 'Dr. Sharma',
      achievementType: 'Research',
      title: 'Best Paper Award',
      date: new Date('2026-07-02'),
      photos: [],
    },
    {
      facultyName: 'Dr. Rao',
      achievementType: 'Award',
      title: 'Outstanding Faculty',
      date: new Date('2026-07-03'),
      photos: [],
    },
  ]);

  await Publication.insertMany([
    {
      facultyName: 'Dr. Sharma',
      paperTitle: 'AI in Education',
      authors: ['Dr. Sharma'],
      publicationDate: new Date('2026-07-04'),
    },
  ]);

  await Patent.insertMany([
    {
      patentTitle: 'Smart Attendance System',
      inventors: ['Dr. Sharma'],
      status: 'Granted',
      filingDate: new Date('2026-07-06'),
    },
    {
      patentTitle: 'IoT Sensor',
      inventors: ['Dr. Rao'],
      status: 'Filed',
      filingDate: new Date('2026-07-07'),
    },
  ]);

  await PendingRecord.insertMany([
    {
      originalMessage: 'Pending placement record',
      category: 'Placement',
      status: 'Pending',
      extractedData: { company: 'TCS' },
      confidenceScore: 80,
    },
    {
      originalMessage: 'Needs review internship',
      category: 'Internship',
      status: 'Needs Review',
      extractedData: { company: 'Google' },
      confidenceScore: 70,
    },
    {
      originalMessage: 'Approved record',
      category: 'Placement',
      status: 'Approved',
      extractedData: { company: 'Infosys' },
      confidenceScore: 95,
    },
  ]);

  await AuditLog.insertMany([
    {
      userId: adminUserId,
      action: 'CREATE',
      module: 'Placement',
      description: 'Created placement record',
      timestamp: new Date('2026-07-09T10:00:00.000Z'),
    },
    {
      userId: adminUserId,
      action: 'APPROVE',
      module: 'PendingRecord',
      description: 'Approved pending record',
      timestamp: new Date('2026-07-09T11:00:00.000Z'),
    },
  ]);
};

const testAuthentication = async (): Promise<void> => {
  console.log('\n--- Authentication ---');

  for (const endpoint of ENDPOINTS) {
    const unauthorized = await request(endpoint.method, endpoint.path);
    assert(unauthorized.status === 401, `${endpoint.method} ${endpoint.path} requires authentication`);
  }
};

const testTotalEndpoints = async (): Promise<void> => {
  console.log('\n--- Total count endpoints ---');

  const students = await request('GET', '/api/v1/dashboard/totals/students', adminToken);
  assert(students.status === 200, 'GET /dashboard/totals/students returns 200');
  assert(students.body.data?.total === 4, 'Total students counts unique names across collections');

  const faculty = await request('GET', '/api/v1/dashboard/totals/faculty-achievements', adminToken);
  assert(faculty.body.data?.total === 2, 'Total faculty achievements is correct');

  const placements = await request('GET', '/api/v1/dashboard/totals/placements', adminToken);
  assert(placements.body.data?.total === 2, 'Total placements is correct');

  const internships = await request('GET', '/api/v1/dashboard/totals/internships', adminToken);
  assert(internships.body.data?.total === 2, 'Total internships is correct');

  const publications = await request('GET', '/api/v1/dashboard/totals/publications', adminToken);
  assert(publications.body.data?.total === 1, 'Total publications is correct');

  const patents = await request('GET', '/api/v1/dashboard/totals/patents', adminToken);
  assert(patents.body.data?.total === 2, 'Total patents is correct');

  const pending = await request('GET', '/api/v1/dashboard/totals/pending-reviews', adminToken);
  assert(pending.body.data?.total === 2, 'Pending reviews excludes approved records');
};

const testSummary = async (): Promise<void> => {
  console.log('\n--- Dashboard summary ---');

  const summary = await request('GET', '/api/v1/dashboard/summary', adminToken);
  assert(summary.status === 200, 'GET /dashboard/summary returns 200');
  assert(summary.body.data?.totalStudents === 4, 'Summary includes total students');
  assert(summary.body.data?.pendingReviews === 2, 'Summary includes pending reviews');
  assert(summary.body.data?.totalPlacements === 2, 'Summary includes placements');
};

const testStatistics = async (): Promise<void> => {
  console.log('\n--- Monthly and yearly statistics ---');

  const monthly = await request(
    'GET',
    '/api/v1/dashboard/statistics/monthly?year=2026&month=7',
    adminToken,
  );

  assert(monthly.status === 200, 'GET /dashboard/statistics/monthly returns 200');
  assert(monthly.body.data?.year === 2026, 'Monthly statistics include year');
  assert(monthly.body.data?.month === 7, 'Monthly statistics include month');
  assert((monthly.body.data?.placements as number) >= 2, 'Monthly statistics include placement counts');
  assert((monthly.body.data?.facultyAchievements as number) >= 2, 'Monthly statistics include faculty achievements');

  const yearly = await request('GET', '/api/v1/dashboard/statistics/yearly?year=2026', adminToken);
  assert(yearly.status === 200, 'GET /dashboard/statistics/yearly returns 200');
  assert(yearly.body.data?.year === 2026, 'Yearly statistics include year');
  assert(Array.isArray(yearly.body.data?.monthlyBreakdown), 'Yearly statistics include monthly breakdown');
  assert((yearly.body.data?.monthlyBreakdown as unknown[]).length === 12, 'Monthly breakdown has 12 months');
};

const testRecentActivities = async (): Promise<void> => {
  console.log('\n--- Recent activities ---');

  const activities = await request(
    'GET',
    '/api/v1/dashboard/activities/recent?limit=5',
    adminToken,
  );

  assert(activities.status === 200, 'GET /dashboard/activities/recent returns 200');
  assert(Array.isArray(activities.body.data?.activities), 'Recent activities returns activities array');
  assert((activities.body.data?.activities as unknown[]).length === 2, 'Recent activities returns seeded audit logs');
};

const setup = async (): Promise<void> => {
  await connectDatabase();
  await cleanupTestUser(ADMIN_EMAIL);

  const admin = await createTestUser({
    name: 'Dashboard API Admin',
    email: ADMIN_EMAIL,
    role: 'Admin',
  });

  adminUserId = admin._id.toString();

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
  await seedDashboardData();
};

const teardown = async (): Promise<void> => {
  await Promise.all([
    Placement.deleteMany({}),
    Internship.deleteMany({}),
    StudentAchievement.deleteMany({}),
    FacultyAchievement.deleteMany({}),
    Publication.deleteMany({}),
    Patent.deleteMany({}),
    PendingRecord.deleteMany({}),
    AuditLog.deleteMany({}),
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
  console.log('Running dashboard analytics API tests...');

  await setup();

  try {
    await testAuthentication();
    await testTotalEndpoints();
    await testSummary();
    await testStatistics();
    await testRecentActivities();
  } finally {
    await teardown();
  }

  console.log('\nAll dashboard analytics API tests passed.');
};

runTests().catch((error) => {
  console.error('\nDashboard analytics API tests failed:', error);
  process.exit(1);
});
