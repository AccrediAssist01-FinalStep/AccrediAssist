/**
 * Reports API integration tests.
 *
 * Prerequisites:
 *   1. cp backend/.env.example backend/.env (set MONGODB_URI and JWT_SECRET)
 *   2. npm install
 *   3. npm run test:report-api
 */

import http from 'http';
import dotenv from 'dotenv';
import app from '../app';
import { connectDatabase, disconnectDatabase } from '../database/connection';
import { Report } from '../models/Report';
import { createTestUser, cleanupTestUser } from './test-helpers';

dotenv.config();

const ADMIN_EMAIL = 'report-api-admin@accrediassist.edu';
const HOD_EMAIL = 'report-api-hod@accrediassist.edu';

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
let reportId: string;

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
  await Report.deleteMany({});
  await cleanupTestUser(ADMIN_EMAIL);
  await cleanupTestUser(HOD_EMAIL);

  await createTestUser({
    name: 'Report API Admin',
    email: ADMIN_EMAIL,
    role: 'Admin',
  });

  await createTestUser({
    name: 'Report API HOD',
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
  await Report.deleteMany({});
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
  console.log('Running Reports API tests...\n');

  await setup();

  const unauthorized = await request('GET', '/api/v1/reports');
  assert(unauthorized.status === 401, 'GET /reports rejects missing token');

  const generated = await request(
    'POST',
    '/api/v1/reports/generate',
    {
      reportType: 'Monthly',
      month: 'July',
      year: 2026,
      department: 'Computer',
    },
    adminToken,
  );
  assert(generated.status === 201, 'POST /reports/generate accepts request');
  assert(generated.body.success === true, 'Generate returns success true');

  const generatedData = generated.body.data as {
    _id: string;
    reportTitle: string;
    downloadReady: boolean;
    reportType: string;
  };
  reportId = generatedData._id;
  assert(!!reportId, 'Generate returns report ID');
  assert(generatedData.downloadReady === false, 'Placeholder report is not download-ready');
  assert(
    generatedData.reportTitle.includes('Monthly'),
    'Generate builds report title from type',
  );

  const list = await request('GET', '/api/v1/reports?page=1&limit=10', undefined, hodToken);
  assert(list.status === 200, 'GET /reports returns 200 for HOD');
  const listData = list.body.data as { items: unknown[]; meta: { total: number } };
  assert(listData.items.length >= 1, 'GET /reports returns history items');
  assert(listData.meta.total >= 1, 'GET /reports returns meta total');

  const byType = await request(
    'GET',
    '/api/v1/reports?reportType=Monthly',
    undefined,
    adminToken,
  );
  assert(byType.status === 200, 'GET /reports filters by reportType');

  const byId = await request('GET', `/api/v1/reports/${reportId}`, undefined, adminToken);
  assert(byId.status === 200, 'GET /reports/:id returns 200');

  const pendingDownload = await request(
    'GET',
    `/api/v1/reports/${reportId}/download`,
    undefined,
    adminToken,
  );
  assert(pendingDownload.status === 400, 'Download rejects report without fileUrl');

  await Report.findByIdAndUpdate(reportId, {
    fileUrl: 'https://cloudinary.com/reports/monthly-july-2026.pdf',
  });

  const download = await request(
    'GET',
    `/api/v1/reports/${reportId}/download`,
    undefined,
    adminToken,
  );
  assert(download.status === 200, 'GET /reports/:id/download returns download metadata');
  const downloadData = download.body.data as {
    downloadUrl: string;
    fileName: string;
    contentType: string;
    status: string;
  };
  assert(downloadData.status === 'ready', 'Download metadata status is ready');
  assert(
    downloadData.downloadUrl.includes('cloudinary.com'),
    'Download metadata includes file URL',
  );
  assert(downloadData.contentType === 'application/pdf', 'Download metadata includes content type');

  const invalidDates = await request(
    'POST',
    '/api/v1/reports/generate',
    {
      reportType: 'Placement',
      startDate: '2026-06-01',
      endDate: '2026-01-01',
    },
    adminToken,
  );
  assert(invalidDates.status === 422, 'Invalid date range returns 422');

  const invalidType = await request(
    'POST',
    '/api/v1/reports/generate',
    {
      month: 'July',
      year: 2026,
    },
    adminToken,
  );
  assert(invalidType.status === 422, 'Missing reportType returns 422');

  const notFound = await request(
    'GET',
    `/api/v1/reports/${'0'.repeat(24)}/download`,
    undefined,
    adminToken,
  );
  assert(notFound.status === 404, 'Non-existent report download returns 404');

  await teardown();

  console.log('\nAll Reports API tests passed.');
};

runTests().catch(async (error) => {
  console.error('\nReports API tests failed:', error);
  await teardown().catch(() => undefined);
  process.exit(1);
});
