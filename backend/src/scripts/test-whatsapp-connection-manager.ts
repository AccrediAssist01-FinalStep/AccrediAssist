/**
 * WhatsApp connection manager tests.
 *
 * Verifies connected/disconnected detection, auto-reconnect scheduling,
 * and the GET /api/v1/whatsapp/status endpoint.
 * Does NOT process WhatsApp messages.
 *
 * Run: npm run test:whatsapp-connection-manager
 */

import http from 'http';
import dotenv from 'dotenv';
import {
  ReconnectService,
  WhatsAppConnectionStatus,
  whatsappConnectionManager,
  whatsappService,
} from '../whatsapp';
import app from '../app';
import { connectDatabase, disconnectDatabase } from '../database/connection';
import { createTestUser, cleanupTestUser } from './test-helpers';

dotenv.config();

const ADMIN_EMAIL = 'whatsapp-manager-admin@accrediassist.edu';
const FACULTY_EMAIL = 'whatsapp-manager-faculty@accrediassist.edu';

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

const testReconnectService = async (): Promise<void> => {
  console.log('\n--- Reconnect service ---');

  const reconnectService = new ReconnectService();
  let handlerCalls = 0;

  reconnectService.setReconnectHandler(async () => {
    handlerCalls += 1;
  });

  reconnectService.markDisconnected(true);
  assert(reconnectService.shouldAttemptReconnect(), 'Reconnect service marks disconnect for retry');

  reconnectService.scheduleReconnect();
  assert(reconnectService.isScheduled(), 'Reconnect is scheduled after unexpected disconnect');
  assert(reconnectService.getAttemptCount() === 1, 'Reconnect attempt count increments');

  reconnectService.cancel();
  assert(!reconnectService.isScheduled(), 'Scheduled reconnect can be cancelled');

  reconnectService.reset();
  assert(reconnectService.getAttemptCount() === 0, 'Reconnect attempts reset after successful connection');
  assert(!reconnectService.shouldAttemptReconnect(), 'Reconnect flag clears on reset');
  assert(handlerCalls === 0, 'Cancelled reconnect does not invoke handler');
};

const testConnectionManagerState = async (): Promise<void> => {
  console.log('\n--- Connection manager state ---');

  await whatsappConnectionManager.stop();
  await whatsappConnectionManager.initialize();

  const initialStatus = await whatsappConnectionManager.getStatus();
  assert(
    initialStatus.status === WhatsAppConnectionStatus.DISCONNECTED,
    'Manager reports disconnected state after initialize',
  );
  assert(initialStatus.isDisconnected === true, 'isDisconnected is true when disconnected');
  assert(initialStatus.isConnected === false, 'isConnected is false when disconnected');
  assert(initialStatus.managerStarted === false, 'Manager is not started by default');
  assert(initialStatus.autoReconnectEnabled === false, 'Auto-reconnect is disabled by default');

  await whatsappConnectionManager.start();
  const startedStatus = await whatsappConnectionManager.getStatus();
  assert(startedStatus.managerStarted === true, 'Manager reports started after start()');
  assert(startedStatus.autoReconnectEnabled === true, 'Auto-reconnect enabled after start()');

  await whatsappConnectionManager.stop();
  const stoppedStatus = await whatsappConnectionManager.getStatus();
  assert(stoppedStatus.managerStarted === false, 'Manager reports stopped after stop()');
  assert(
    stoppedStatus.status === WhatsAppConnectionStatus.DISCONNECTED,
    'Manager reports disconnected after stop()',
  );
};

const testConnectedStateDetection = (): void => {
  console.log('\n--- Connected state detection ---');

  whatsappService.setStatus(WhatsAppConnectionStatus.CONNECTED);
  assert(whatsappService.isConnected(), 'Service detects connected state');
  assert(
    whatsappService.getStatus() === WhatsAppConnectionStatus.CONNECTED,
    'Service status reflects connected',
  );

  whatsappService.setStatus(WhatsAppConnectionStatus.DISCONNECTED);
  assert(!whatsappService.isConnected(), 'Service detects disconnected state');
  assert(
    whatsappService.getStatus() === WhatsAppConnectionStatus.DISCONNECTED,
    'Service status reflects disconnected',
  );
};

const testStatusApi = async (): Promise<void> => {
  console.log('\n--- WhatsApp status API ---');

  const unauthorized = await request('GET', '/api/v1/whatsapp/status');
  assert(unauthorized.status === 401, 'Status endpoint requires authentication');

  const forbidden = await request('GET', '/api/v1/whatsapp/status', undefined, facultyToken);
  assert(forbidden.status === 403, 'Status endpoint requires whatsapp_settings permission');

  const adminResult = await request('GET', '/api/v1/whatsapp/status', undefined, adminToken);
  assert(adminResult.status === 200, 'Admin can access WhatsApp status endpoint');
  assert(adminResult.body.success === true, 'Status response is successful');

  const data = adminResult.body.data ?? {};
  assert(typeof data.status === 'string', 'Status payload includes connection status');
  assert(typeof data.isConnected === 'boolean', 'Status payload includes isConnected');
  assert(typeof data.isDisconnected === 'boolean', 'Status payload includes isDisconnected');
  assert(typeof data.autoReconnectEnabled === 'boolean', 'Status payload includes autoReconnectEnabled');
  assert(typeof data.reconnectAttempts === 'number', 'Status payload includes reconnectAttempts');
  assert(Array.isArray(data.allowedGroups), 'Status payload includes allowedGroups');

  const connectResult = await request('POST', '/api/v1/whatsapp/connect', undefined, adminToken);
  assert(connectResult.status === 200, 'Admin can start WhatsApp connection manager');

  const connectedStatus = await request('GET', '/api/v1/whatsapp/status', undefined, adminToken);
  assert(connectedStatus.status === 200, 'Status endpoint works after connect');
  assert(
    (connectedStatus.body.data?.managerStarted as boolean) === true,
    'Status reports manager started after connect API',
  );

  const disconnectResult = await request(
    'POST',
    '/api/v1/whatsapp/disconnect',
    undefined,
    adminToken,
  );
  assert(disconnectResult.status === 200, 'Admin can stop WhatsApp connection manager');
  assert(
    (disconnectResult.body.data?.managerStarted as boolean) === false,
    'Status reports manager stopped after disconnect API',
  );
};

const setup = async (): Promise<void> => {
  await connectDatabase();
  await cleanupTestUser(ADMIN_EMAIL);
  await cleanupTestUser(FACULTY_EMAIL);

  await createTestUser({
    name: 'WhatsApp Admin',
    email: ADMIN_EMAIL,
    role: 'Admin',
  });

  await createTestUser({
    name: 'WhatsApp Faculty',
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
  console.log('Running WhatsApp connection manager tests...');

  await testReconnectService();
  testConnectedStateDetection();
  await testConnectionManagerState();

  await setup();
  try {
    await testStatusApi();
  } finally {
    await teardown();
  }

  console.log('\nAll WhatsApp connection manager tests passed.');
};

runTests().catch(async (error) => {
  console.error('\nWhatsApp connection manager tests failed:', error);
  try {
    await whatsappConnectionManager.stop();
    await disconnectDatabase();
  } catch {
    // ignore cleanup errors
  }
  process.exit(1);
});
