/**
 * Pending record approval workflow tests.
 *
 * Verifies PUT /api/v1/pending/:id/approve moves data into target collections,
 * marks pending records as Approved, and writes audit logs.
 *
 * Run: npm run test:pending-approve-api
 */

import http from 'http';
import dotenv from 'dotenv';
import app from '../app';
import { connectDatabase, disconnectDatabase } from '../database/connection';
import { PendingRecord } from '../models/PendingRecord';
import { StudentAchievement } from '../models/StudentAchievement';
import { FacultyAchievement } from '../models/FacultyAchievement';
import { Placement } from '../models/Placement';
import { Internship } from '../models/Internship';
import { Publication } from '../models/Publication';
import { Patent } from '../models/Patent';
import { CompletedEventReport } from '../models/CompletedEventReport';
import { AuditLog } from '../models/AuditLog';
import { createTestUser, cleanupTestUser } from './test-helpers';

dotenv.config();

const TEST_PREFIX = 'APPROVE_TEST';
const ADMIN_EMAIL = 'pending-approve-admin@accrediassist.edu';
const FACULTY_EMAIL = 'pending-approve-faculty@accrediassist.edu';
const HOD_EMAIL = 'pending-approve-hod@accrediassist.edu';

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
let hodToken: string;
let adminUserId: string;

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

const approvePendingRecord = async (pendingRecordId: string, token = facultyToken): Promise<void> => {
  const result = await request('PUT', `/api/v1/pending/${pendingRecordId}/approve`, undefined, token);
  assert(result.status === 200, `Approve succeeds for pending record ${pendingRecordId}`);
  assert(
    (result.body.data as { status: string }).status === 'Approved',
    `Pending record ${pendingRecordId} marked as Approved`,
  );
};

const cleanupTestData = async (): Promise<void> => {
  await PendingRecord.deleteMany({ originalMessage: new RegExp(TEST_PREFIX) });
  await StudentAchievement.deleteMany({ title: new RegExp(TEST_PREFIX) });
  await FacultyAchievement.deleteMany({ title: new RegExp(TEST_PREFIX) });
  await Placement.deleteMany({ company: new RegExp(TEST_PREFIX) });
  await Internship.deleteMany({ company: new RegExp(TEST_PREFIX) });
  await Publication.deleteMany({ paperTitle: new RegExp(TEST_PREFIX) });
  await Patent.deleteMany({ patentTitle: new RegExp(TEST_PREFIX) });
  await CompletedEventReport.deleteMany({ eventTitle: new RegExp(TEST_PREFIX) });
  await AuditLog.deleteMany({ description: new RegExp(TEST_PREFIX) });
};

const setup = async (): Promise<void> => {
  await connectDatabase();
  await cleanupTestData();
  await cleanupTestUser(ADMIN_EMAIL);
  await cleanupTestUser(FACULTY_EMAIL);
  await cleanupTestUser(HOD_EMAIL);

  const admin = await createTestUser({
    name: 'Pending Approve Admin',
    email: ADMIN_EMAIL,
    role: 'Admin',
  });
  adminUserId = admin._id.toString();

  await createTestUser({
    name: 'Pending Approve Faculty',
    email: FACULTY_EMAIL,
    role: 'Faculty',
  });

  await createTestUser({
    name: 'Pending Approve HOD',
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
  facultyToken = await login(FACULTY_EMAIL, 'Test@12345');
  hodToken = await login(HOD_EMAIL, 'Test@12345');
};

const teardown = async (): Promise<void> => {
  await cleanupTestData();
  await cleanupTestUser(ADMIN_EMAIL);
  await cleanupTestUser(FACULTY_EMAIL);
  await cleanupTestUser(HOD_EMAIL);

  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) reject(error);
      else resolve();
    });
  });

  await disconnectDatabase();
};

const testPlacementApproval = async (): Promise<void> => {
  const pending = await PendingRecord.create({
    originalMessage: `${TEST_PREFIX} Rahul Patil placed at Infosys`,
    category: 'Placement',
    extractedData: {
      studentName: `${TEST_PREFIX} Rahul Patil`,
      company: `${TEST_PREFIX} Infosys`,
      role: 'Software Engineer',
    },
    confidenceScore: 90,
    status: 'Pending',
  });

  await approvePendingRecord(pending._id.toString(), adminToken);

  const placement = await Placement.findOne({ company: `${TEST_PREFIX} Infosys` });
  assert(Boolean(placement), 'Placement record created from approved pending record');
  assert(
    placement?.studentName === `${TEST_PREFIX} Rahul Patil`,
    'Placement student name mapped correctly',
  );
};

const testInternshipApproval = async (): Promise<void> => {
  const pending = await PendingRecord.create({
    originalMessage: `${TEST_PREFIX} Priya internship at TCS`,
    category: 'Internship',
    extractedData: {
      studentNames: [`${TEST_PREFIX} Priya Sharma`],
      company: `${TEST_PREFIX} TCS`,
      duration: '2 months',
    },
    confidenceScore: 88,
    status: 'Pending',
  });

  await approvePendingRecord(pending._id.toString());

  const internship = await Internship.findOne({ company: `${TEST_PREFIX} TCS` });
  assert(Boolean(internship), 'Internship record created from approved pending record');
};

const testStudentAchievementApproval = async (): Promise<void> => {
  const pending = await PendingRecord.create({
    originalMessage: `${TEST_PREFIX} Student won hackathon`,
    category: 'Student Achievement',
    extractedData: {
      studentNames: [`${TEST_PREFIX} Arjun Mehta`],
      title: `${TEST_PREFIX} Hackathon Winner`,
      achievementType: 'Hackathon',
      date: '2025-01-15',
    },
    confidenceScore: 91,
    status: 'Pending',
  });

  await approvePendingRecord(pending._id.toString());

  const achievement = await StudentAchievement.findOne({ title: `${TEST_PREFIX} Hackathon Winner` });
  assert(Boolean(achievement), 'StudentAchievement record created from approved pending record');
  assert(achievement?.achievementType === 'Hackathon', 'Student achievement type mapped correctly');
};

const testFacultyAchievementApproval = async (): Promise<void> => {
  const pending = await PendingRecord.create({
    originalMessage: `${TEST_PREFIX} Faculty received award`,
    category: 'Faculty Achievement',
    extractedData: {
      facultyNames: [`${TEST_PREFIX} Dr. Anita Desai`],
      title: `${TEST_PREFIX} Best Paper Award`,
      achievementType: 'Award',
      date: '2025-02-01',
    },
    confidenceScore: 93,
    status: 'Needs Review',
  });

  await approvePendingRecord(pending._id.toString());

  const achievement = await FacultyAchievement.findOne({ title: `${TEST_PREFIX} Best Paper Award` });
  assert(Boolean(achievement), 'FacultyAchievement record created from approved pending record');
};

const testPublicationApproval = async (): Promise<void> => {
  const pending = await PendingRecord.create({
    originalMessage: `${TEST_PREFIX} Faculty published paper`,
    category: 'Publication',
    extractedData: {
      facultyNames: [`${TEST_PREFIX} Dr. Ravi Kumar`],
      publicationTitle: `${TEST_PREFIX} AI in Education`,
      journal: 'IEEE Transactions',
      date: '2025-03-10',
    },
    confidenceScore: 94,
    status: 'Pending',
  });

  await approvePendingRecord(pending._id.toString());

  const publication = await Publication.findOne({ paperTitle: `${TEST_PREFIX} AI in Education` });
  assert(Boolean(publication), 'Publication record created from approved pending record');
};

const testPatentApproval = async (): Promise<void> => {
  const pending = await PendingRecord.create({
    originalMessage: `${TEST_PREFIX} Patent filed for smart grid`,
    category: 'Patent',
    extractedData: {
      patentTitle: `${TEST_PREFIX} Smart Grid Controller`,
      facultyNames: [`${TEST_PREFIX} Dr. Suresh Iyer`],
      patentStatus: 'Filed',
      date: '2025-04-01',
    },
    confidenceScore: 89,
    status: 'Pending',
  });

  await approvePendingRecord(pending._id.toString());

  const patent = await Patent.findOne({ patentTitle: `${TEST_PREFIX} Smart Grid Controller` });
  assert(Boolean(patent), 'Patent record created from approved pending record');
  assert(patent?.status === 'Filed', 'Patent status mapped correctly');
};

const testCompletedEventApproval = async (): Promise<void> => {
  const pending = await PendingRecord.create({
    originalMessage: `${TEST_PREFIX} Workshop on cloud computing`,
    category: 'Workshop',
    senderName: `${TEST_PREFIX} Coordinator`,
    extractedData: {
      eventName: `${TEST_PREFIX} Cloud Computing Workshop`,
      eventType: 'Workshop',
      location: 'Seminar Hall A',
      date: '2025-05-20',
      description: 'Hands-on cloud workshop',
    },
    confidenceScore: 87,
    status: 'Pending',
  });

  await approvePendingRecord(pending._id.toString());

  const eventReport = await CompletedEventReport.findOne({
    eventTitle: `${TEST_PREFIX} Cloud Computing Workshop`,
  });
  assert(Boolean(eventReport), 'CompletedEventReport created from approved pending record');
  assert(eventReport?.eventType === 'Workshop', 'Event type mapped correctly');
};

const testAuthorizationAndGuards = async (): Promise<void> => {
  const pending = await PendingRecord.create({
    originalMessage: `${TEST_PREFIX} Guard test placement`,
    category: 'Placement',
    extractedData: {
      studentName: `${TEST_PREFIX} Guard Student`,
      company: `${TEST_PREFIX} Guard Company`,
    },
    confidenceScore: 80,
    status: 'Pending',
  });

  const unauthorized = await request(
    'PUT',
    `/api/v1/pending/${pending._id.toString()}/approve`,
  );
  assert(unauthorized.status === 401, 'Approve rejects missing token');

  const hodApprove = await request(
    'PUT',
    `/api/v1/pending/${pending._id.toString()}/approve`,
    undefined,
    hodToken,
  );
  assert(hodApprove.status === 403, 'HOD cannot approve pending records');

  await approvePendingRecord(pending._id.toString());

  const reApprove = await request(
    'PUT',
    `/api/v1/pending/${pending._id.toString()}/approve`,
    undefined,
    facultyToken,
  );
  assert(reApprove.status === 400, 'Cannot approve an already approved record');

  const unsupported = await PendingRecord.create({
    originalMessage: `${TEST_PREFIX} Unsupported research record`,
    category: 'Research',
    extractedData: {
      title: `${TEST_PREFIX} Research Project`,
    },
    confidenceScore: 75,
    status: 'Pending',
  });

  const unsupportedApprove = await request(
    'PUT',
    `/api/v1/pending/${unsupported._id.toString()}/approve`,
    undefined,
    adminToken,
  );
  assert(unsupportedApprove.status === 400, 'Unsupported category cannot be approved');

  const missingFields = await PendingRecord.create({
    originalMessage: `${TEST_PREFIX} Missing company placement`,
    category: 'Placement',
    extractedData: {
      studentName: `${TEST_PREFIX} Missing Company Student`,
    },
    confidenceScore: 70,
    status: 'Pending',
  });

  const invalidApprove = await request(
    'PUT',
    `/api/v1/pending/${missingFields._id.toString()}/approve`,
    undefined,
    adminToken,
  );
  assert(invalidApprove.status === 400, 'Missing required mapped fields reject approval');
};

const testAuditLogs = async (): Promise<void> => {
  const pending = await PendingRecord.create({
    originalMessage: `${TEST_PREFIX} Audit log placement`,
    category: 'Placement',
    extractedData: {
      studentName: `${TEST_PREFIX} Audit Student`,
      company: `${TEST_PREFIX} Audit Company`,
    },
    confidenceScore: 85,
    status: 'Pending',
  });

  await approvePendingRecord(pending._id.toString(), adminToken);

  const approveLog = await AuditLog.findOne({
    module: 'PendingRecord',
    action: 'APPROVE',
    description: new RegExp(`${TEST_PREFIX}|${pending._id.toString()}`),
  });
  assert(Boolean(approveLog), 'Audit log created for pending record approval');

  const createLog = await AuditLog.findOne({
    module: 'Placement',
    action: 'CREATE',
    description: new RegExp(`${TEST_PREFIX}|${pending._id.toString()}`),
  });
  assert(Boolean(createLog), 'Audit log created for target collection record');
  assert(
    approveLog?.userId?.toString() === adminUserId,
    'Approval audit log records approving user',
  );
};

const runTests = async (): Promise<void> => {
  console.log('Running Pending Record Approval workflow tests...\n');

  await setup();

  await testPlacementApproval();
  await testInternshipApproval();
  await testStudentAchievementApproval();
  await testFacultyAchievementApproval();
  await testPublicationApproval();
  await testPatentApproval();
  await testCompletedEventApproval();
  await testAuthorizationAndGuards();
  await testAuditLogs();

  await teardown();

  console.log('\nAll Pending Record Approval workflow tests passed.');
};

runTests().catch(async (error) => {
  console.error('\nPending Record Approval workflow tests failed:', error);
  await teardown().catch(() => undefined);
  process.exit(1);
});
