/**
 * Pending record edit workflow tests.
 *
 * Verifies PATCH /api/v1/pending/:id validates extracted fields,
 * maintains edit history, updates confidence, and does not auto-approve.
 *
 * Run: npm run test:pending-edit-api
 */

import http from 'http';
import dotenv from 'dotenv';
import app from '../app';
import { connectDatabase, disconnectDatabase } from '../database/connection';
import { PendingRecord } from '../models/PendingRecord';
import { Placement } from '../models/Placement';
import { AuditLog } from '../models/AuditLog';
import { createTestUser, cleanupTestUser } from './test-helpers';

dotenv.config();

const TEST_PREFIX = 'EDIT_TEST';
const ADMIN_EMAIL = 'pending-edit-admin@accrediassist.edu';
const FACULTY_EMAIL = 'pending-edit-faculty@accrediassist.edu';
const HOD_EMAIL = 'pending-edit-hod@accrediassist.edu';

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
let facultyUserId: string;
let pendingRecordId: string;

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

const cleanupTestData = async (): Promise<void> => {
  await PendingRecord.deleteMany({ originalMessage: new RegExp(TEST_PREFIX) });
  await Placement.deleteMany({ company: new RegExp(TEST_PREFIX) });
  await AuditLog.deleteMany({ description: new RegExp(TEST_PREFIX) });
};

const setup = async (): Promise<void> => {
  await connectDatabase();
  await cleanupTestData();
  await cleanupTestUser(ADMIN_EMAIL);
  await cleanupTestUser(FACULTY_EMAIL);
  await cleanupTestUser(HOD_EMAIL);

  await createTestUser({
    name: 'Pending Edit Admin',
    email: ADMIN_EMAIL,
    role: 'Admin',
  });

  const faculty = await createTestUser({
    name: 'Pending Edit Faculty',
    email: FACULTY_EMAIL,
    role: 'Faculty',
  });
  facultyUserId = faculty._id.toString();

  await createTestUser({
    name: 'Pending Edit HOD',
    email: HOD_EMAIL,
    role: 'HOD',
  });

  const pending = await PendingRecord.create({
    originalMessage: `${TEST_PREFIX} Rahul Patil placement at Infosys`,
    category: 'Placement',
    extractedData: {
      title: `${TEST_PREFIX} Placement at Infosys`,
      studentName: `${TEST_PREFIX} Rahul Patil`,
      company: `${TEST_PREFIX} Infosys`,
      aiPipeline: { classification: { category: 'Placement' } },
    },
    confidenceScore: 82,
    status: 'Pending',
  });
  pendingRecordId = pending._id.toString();

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

const runTests = async (): Promise<void> => {
  console.log('Running Pending Record Edit workflow tests...\n');

  await setup();

  const emptyEdit = await request('PATCH', `/api/v1/pending/${pendingRecordId}`, {}, facultyToken);
  assert(emptyEdit.status === 422, 'Edit requires at least one editable field');

  const invalidField = await request(
    'PATCH',
    `/api/v1/pending/${pendingRecordId}`,
    {
      extractedData: {
        unknownField: 'value',
      },
    },
    facultyToken,
  );
  assert(invalidField.status === 422, 'Edit validates extracted field names');

  const invalidConfidence = await request(
    'PATCH',
    `/api/v1/pending/${pendingRecordId}`,
    { confidenceScore: 150 },
    facultyToken,
  );
  assert(invalidConfidence.status === 422, 'Edit validates confidence score range');

  const edited = await request(
    'PATCH',
    `/api/v1/pending/${pendingRecordId}`,
    {
      extractedData: {
        title: `${TEST_PREFIX} Updated Placement Title`,
        company: `${TEST_PREFIX} TCS`,
        studentName: `${TEST_PREFIX} Rahul Patil`,
      },
      confidenceScore: 96,
    },
    facultyToken,
  );
  assert(edited.status === 200, 'Faculty can edit pending record extracted fields');

  const editedData = edited.body.data as {
    status: string;
    confidenceScore: number;
    extractedData: { title: string; company: string; aiPipeline: unknown };
    editHistory: Array<{
      editedBy: string;
      editedAt: string;
      changes: Array<{ field: string; previousValue: unknown; newValue: unknown }>;
      previousConfidenceScore?: number;
      newConfidenceScore?: number;
    }>;
  };

  assert(editedData.status === 'Pending', 'Edit does not auto-approve pending record');
  assert(editedData.confidenceScore === 96, 'Edit updates confidence score');
  assert(
    editedData.extractedData.title === `${TEST_PREFIX} Updated Placement Title`,
    'Edit merges extracted field updates',
  );
  assert(
    editedData.extractedData.company === `${TEST_PREFIX} TCS`,
    'Edit persists company change',
  );
  assert(
    Boolean(editedData.extractedData.aiPipeline),
    'Edit preserves existing extracted metadata such as aiPipeline',
  );
  assert(editedData.editHistory.length === 1, 'Edit appends edit history entry');
  assert(
    editedData.editHistory[0].editedBy === facultyUserId,
    'Edit history records faculty editor',
  );
  assert(Boolean(editedData.editHistory[0].editedAt), 'Edit history records edit timestamp');
  assert(
    editedData.editHistory[0].changes.some((change) => change.field === 'extractedData.company'),
    'Edit history tracks extracted field changes',
  );
  assert(
    editedData.editHistory[0].previousConfidenceScore === 82,
    'Edit history stores previous confidence score',
  );
  assert(editedData.editHistory[0].newConfidenceScore === 96, 'Edit history stores new confidence score');

  const storedRecord = await PendingRecord.findById(pendingRecordId);
  assert(storedRecord?.editHistory?.length === 1, 'Edit history persisted on pending record');
  assert(storedRecord?.isDeleted !== true, 'Edited record is not deleted');

  const auditLog = await AuditLog.findOne({
    module: 'PendingRecord',
    action: 'UPDATE',
    description: new RegExp(`${TEST_PREFIX}|${pendingRecordId}`),
  });
  assert(Boolean(auditLog), 'Edit creates audit log entry');

  const secondEdit = await request(
    'PATCH',
    `/api/v1/pending/${pendingRecordId}`,
    {
      category: 'Internship',
      extractedData: {
        company: `${TEST_PREFIX} Wipro`,
      },
    },
    adminToken,
  );
  assert(secondEdit.status === 200, 'Admin can edit category and extracted fields');
  assert(
    (secondEdit.body.data as { category: string }).category === 'Internship',
    'Edit updates category before approval',
  );
  assert(
    ((secondEdit.body.data as { editHistory: unknown[] }).editHistory.length) === 2,
    'Multiple edits append to edit history',
  );

  const noChangeEdit = await request(
    'PATCH',
    `/api/v1/pending/${pendingRecordId}`,
    {
      extractedData: {
        company: `${TEST_PREFIX} Wipro`,
      },
    },
    facultyToken,
  );
  assert(noChangeEdit.status === 400, 'Edit rejects requests with no actual changes');

  const beforeApproveCount = await Placement.countDocuments({
    company: new RegExp(`${TEST_PREFIX}`),
  });
  assert(beforeApproveCount === 0, 'Edit alone does not create target collection records');

  const approveAfterEdit = await request(
    'PUT',
    `/api/v1/pending/${pendingRecordId}/approve`,
    undefined,
    facultyToken,
  );
  assert(approveAfterEdit.status === 200, 'Edited record can be approved separately');
  assert(
    (approveAfterEdit.body.data as { status: string }).status === 'Approved',
    'Separate approve action marks record approved',
  );

  const approvedEdit = await request(
    'PATCH',
    `/api/v1/pending/${pendingRecordId}`,
    { confidenceScore: 50 },
    adminToken,
  );
  assert(approvedEdit.status === 400, 'Cannot edit an approved record');

  const hodEdit = await request(
    'PATCH',
    `/api/v1/pending/${pendingRecordId}`,
    { confidenceScore: 70 },
    hodToken,
  );
  assert(hodEdit.status === 403, 'HOD cannot edit pending records');

  await teardown();

  console.log('\nAll Pending Record Edit workflow tests passed.');
};

runTests().catch(async (error) => {
  console.error('\nPending Record Edit workflow tests failed:', error);
  await teardown().catch(() => undefined);
  process.exit(1);
});
