/**
 * WhatsApp REST API integration tests.
 *
 * Verifies all Document 17 WhatsApp endpoints:
 *   GET  /api/v1/whatsapp/status
 *   GET  /api/v1/whatsapp/qr
 *   POST /api/v1/whatsapp/connect
 *   POST /api/v1/whatsapp/disconnect
 *   GET  /api/v1/whatsapp/groups
 *
 * Run: npm run test:whatsapp-api
 */

import http from 'http';
import dotenv from 'dotenv';
import app from '../app';
import { connectDatabase, disconnectDatabase } from '../database/connection';
import { whatsappConnectionManager } from '../whatsapp/connection.manager';
import { createTestUser, cleanupTestUser } from './test-helpers';

dotenv.config();

const ADMIN_EMAIL = 'whatsapp-api-admin@accrediassist.edu';
const FACULTY_EMAIL = 'whatsapp-api-faculty@accrediassist.edu';

const ENDPOINTS = [
  { method: 'GET', path: '/api/v1/whatsapp/status' },
  { method: 'GET', path: '/api/v1/whatsapp/qr' },
  { method: 'GET', path: '/api/v1/whatsapp/groups' },
  { method: 'POST', path: '/api/v1/whatsapp/connect' },
  { method: 'POST', path: '/api/v1/whatsapp/disconnect' },
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
let facultyToken: string;

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

const login = async (email: string): Promise<string> => {
  const result = await request('POST', '/api/v1/auth/login', {
    email,
    password: 'Test@12345',
  });
  assert(result.status === 200, `Login succeeds for ${email}`);
  return (result.body.data as { token: string }).token;
};

const testAuthForAllEndpoints = async (): Promise<void> => {
  console.log('\n--- Authentication and authorization ---');

  for (const endpoint of ENDPOINTS) {
    const unauthorized = await request(endpoint.method, endpoint.path);
    assert(unauthorized.status === 401, `${endpoint.method} ${endpoint.path} requires authentication`);

    const forbidden = await request(endpoint.method, endpoint.path, undefined, facultyToken);
    assert(forbidden.status === 403, `${endpoint.method} ${endpoint.path} requires whatsapp_settings permission`);
  }
};

const testStatusEndpoint = async (): Promise<void> => {
  console.log('\n--- GET /whatsapp/status ---');

  const result = await request('GET', '/api/v1/whatsapp/status', undefined, adminToken);
  assert(result.status === 200, 'Admin can retrieve WhatsApp status');
  assert(result.body.success === true, 'Status response is successful');

  const data = result.body.data ?? {};
  assert(typeof data.status === 'string', 'Status payload includes connection status');
  assert(typeof data.isConnected === 'boolean', 'Status payload includes isConnected');
  assert(typeof data.managerStarted === 'boolean', 'Status payload includes managerStarted');
  assert(Array.isArray(data.allowedGroups), 'Status payload includes allowedGroups');
};

const testQrEndpoint = async (): Promise<void> => {
  console.log('\n--- GET /whatsapp/qr ---');

  const result = await request('GET', '/api/v1/whatsapp/qr', undefined, adminToken);
  assert(result.status === 200, 'Admin can retrieve WhatsApp QR state');
  assert(result.body.success === true, 'QR response is successful');

  const data = result.body.data ?? {};
  assert(typeof data.hasQrCode === 'boolean', 'QR payload includes hasQrCode');
  assert(typeof data.status === 'string', 'QR payload includes connection status');
  assert(typeof data.isConnected === 'boolean', 'QR payload includes isConnected');
  assert(data.qrCode === null || typeof data.qrCode === 'string', 'QR payload includes qrCode when available');
};

const testConnectEndpoint = async (): Promise<void> => {
  console.log('\n--- POST /whatsapp/connect ---');

  const result = await request('POST', '/api/v1/whatsapp/connect', undefined, adminToken);
  assert(result.status === 200, 'Admin can start WhatsApp connection');
  assert(result.body.success === true, 'Connect response is successful');
  assert(
    (result.body.data?.managerStarted as boolean) === true,
    'Connect response reports manager started',
  );
  assert(typeof result.body.data?.status === 'string', 'Connect response includes connection status');
};

const testDisconnectEndpoint = async (): Promise<void> => {
  console.log('\n--- POST /whatsapp/disconnect ---');

  const result = await request('POST', '/api/v1/whatsapp/disconnect', undefined, adminToken);
  assert(result.status === 200, 'Admin can stop WhatsApp connection');
  assert(result.body.success === true, 'Disconnect response is successful');
  assert(
    (result.body.data?.managerStarted as boolean) === false,
    'Disconnect response reports manager stopped',
  );

  const logoutResult = await request(
    'POST',
    '/api/v1/whatsapp/disconnect?logout=false',
    undefined,
    adminToken,
  );
  assert(logoutResult.status === 200, 'Disconnect accepts logout query parameter');
};

const testGroupsEndpoint = async (): Promise<void> => {
  console.log('\n--- GET /whatsapp/groups ---');

  const result = await request('GET', '/api/v1/whatsapp/groups', undefined, adminToken);
  assert(result.status === 200, 'Admin can retrieve WhatsApp groups');
  assert(result.body.success === true, 'Groups response is successful');

  const data = result.body.data ?? {};
  assert(typeof data.isConnected === 'boolean', 'Groups payload includes connection state');
  assert(Array.isArray(data.joinedGroups), 'Groups payload includes joinedGroups');
  assert(Array.isArray(data.monitoredGroups), 'Groups payload includes monitoredGroups');
  assert(Array.isArray(data.unknownGroups), 'Groups payload includes unknownGroups');
  assert(Array.isArray(data.missingAllowedGroups), 'Groups payload includes missingAllowedGroups');

  const configuration = data.configuration as { allowedGroups?: string[]; source?: string };
  assert(Array.isArray(configuration?.allowedGroups), 'Groups payload includes allowed group configuration');
  assert(configuration?.source === 'WHATSAPP_ALLOWED_GROUPS', 'Groups payload exposes configuration source');
};

const testConnectDisconnectFlow = async (): Promise<void> => {
  console.log('\n--- Connect and disconnect flow ---');

  await request('POST', '/api/v1/whatsapp/disconnect', undefined, adminToken);

  const connectResult = await request('POST', '/api/v1/whatsapp/connect', undefined, adminToken);
  assert(connectResult.status === 200, 'Connect succeeds in flow test');

  const statusAfterConnect = await request('GET', '/api/v1/whatsapp/status', undefined, adminToken);
  assert(statusAfterConnect.status === 200, 'Status is available after connect');
  assert(
    (statusAfterConnect.body.data?.managerStarted as boolean) === true,
    'Status reports manager started after connect',
  );

  const qrAfterConnect = await request('GET', '/api/v1/whatsapp/qr', undefined, adminToken);
  assert(qrAfterConnect.status === 200, 'QR endpoint is available after connect');

  const disconnectResult = await request('POST', '/api/v1/whatsapp/disconnect', undefined, adminToken);
  assert(disconnectResult.status === 200, 'Disconnect succeeds in flow test');

  const statusAfterDisconnect = await request('GET', '/api/v1/whatsapp/status', undefined, adminToken);
  assert(
    (statusAfterDisconnect.body.data?.managerStarted as boolean) === false,
    'Status reports manager stopped after disconnect',
  );
};

const setup = async (): Promise<void> => {
  await connectDatabase();
  await whatsappConnectionManager.stop();
  await cleanupTestUser(ADMIN_EMAIL);
  await cleanupTestUser(FACULTY_EMAIL);

  await createTestUser({
    name: 'WhatsApp API Admin',
    email: ADMIN_EMAIL,
    role: 'Admin',
  });

  await createTestUser({
    name: 'WhatsApp API Faculty',
    email: FACULTY_EMAIL,
    role: 'Faculty',
  });

  server = http.createServer(app);
  await new Promise<void>((resolve) => {
    server.listen(0, resolve);
  });

  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Failed to start test server');
  }

  baseUrl = `http://127.0.0.1:${address.port}`;

  adminToken = await login(ADMIN_EMAIL);
  facultyToken = await login(FACULTY_EMAIL);
};

const teardown = async (): Promise<void> => {
  await whatsappConnectionManager.stop();
  await cleanupTestUser(ADMIN_EMAIL);
  await cleanupTestUser(FACULTY_EMAIL);

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
  console.log('Running WhatsApp REST API tests...');

  await setup();
  try {
    await testAuthForAllEndpoints();
    await testStatusEndpoint();
    await testQrEndpoint();
    await testConnectEndpoint();
    await testDisconnectEndpoint();
    await testGroupsEndpoint();
    await testConnectDisconnectFlow();
  } finally {
    await teardown();
  }

  console.log('\nAll WhatsApp REST API tests passed.');
};

runTests().catch(async (error) => {
  console.error('\nWhatsApp REST API tests failed:', error);
  try {
    await whatsappConnectionManager.stop();
    await disconnectDatabase();
  } catch {
    // ignore cleanup errors
  }
  process.exit(1);
});
