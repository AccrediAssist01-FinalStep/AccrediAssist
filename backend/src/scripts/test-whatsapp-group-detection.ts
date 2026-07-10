/**
 * WhatsApp group detection tests.
 *
 * Verifies allowed group configuration, joined group fetch logic,
 * private chat filtering, and unknown group filtering.
 * Does NOT save or process WhatsApp messages.
 *
 * Run: npm run test:whatsapp-group-detection
 */

import http from 'http';
import dotenv from 'dotenv';
import {
  GroupService,
  groupFilter,
  groupService,
  messageListener,
  whatsappConfig,
  whatsappService,
} from '../whatsapp';
import app from '../app';
import { connectDatabase, disconnectDatabase } from '../database/connection';
import { createTestUser, cleanupTestUser } from './test-helpers';

dotenv.config();

const ADMIN_EMAIL = 'whatsapp-group-admin@accrediassist.edu';
const FACULTY_EMAIL = 'whatsapp-group-faculty@accrediassist.edu';

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

const testAllowedGroupConfiguration = (): void => {
  console.log('\n--- Allowed group configuration ---');

  const configuration = groupFilter.getConfiguration();
  assert(configuration.source === 'WHATSAPP_ALLOWED_GROUPS', 'Configuration source is env-based');
  assert(configuration.allowedGroups.length > 0, 'Allowed groups are configured');
  assert(
    configuration.allowedGroups.length === whatsappConfig.allowedGroups.length,
    'Configuration matches WhatsApp config',
  );
  assert(
    groupFilter.isAllowedGroup('Computer Department'),
    'Configured group is recognized as allowed',
  );
};

const testPrivateAndUnknownFiltering = (): void => {
  console.log('\n--- Private and unknown chat filtering ---');

  const privateJid = '919876543210@s.whatsapp.net';
  const groupJid = '120363012345678901@g.us';

  assert(groupFilter.isPrivateChat(privateJid), 'Private chat JID is detected');
  assert(!groupFilter.isPrivateChat(groupJid), 'Group chat JID is not treated as private');
  assert(groupFilter.isGroupChat(groupJid), 'Group chat JID is detected');
  assert(!groupFilter.shouldMonitorChat(privateJid, 'Computer Department'), 'Private chats are ignored');
  assert(
    !groupFilter.shouldMonitorChat(groupJid, 'Unknown Group'),
    'Unknown groups are ignored',
  );
  assert(
    groupFilter.shouldMonitorChat(groupJid, 'Computer Department'),
    'Allowed joined groups are marked for monitoring',
  );

  assert(messageListener.classifyChat(privateJid) === 'private', 'Message listener classifies private chats');
  assert(
    messageListener.classifyChat(groupJid, 'Unknown Group') === 'unknown',
    'Message listener classifies unknown groups',
  );
  assert(
    messageListener.classifyChat(groupJid, 'Computer Department') === 'allowed',
    'Message listener classifies allowed groups',
  );
  assert(!messageListener.isListening(), 'Message listener remains inactive');
  assert(!messageListener.shouldProcess(privateJid, 'Computer Department'), 'Private chats are not processed');
  assert(!messageListener.shouldProcess(groupJid, 'Unknown Group'), 'Unknown groups are not processed');
  assert(
    messageListener.shouldProcess(groupJid, 'Computer Department'),
    'Allowed groups would be processed when listening is enabled later',
  );
};

const testJoinedGroupFetch = async (): Promise<void> => {
  console.log('\n--- Joined group fetch ---');

  const mockGroups = {
    '120363012345678901@g.us': {
      id: '120363012345678901@g.us',
      subject: 'Computer Department',
    },
    '120363098765432109@g.us': {
      id: '120363098765432109@g.us',
      subject: 'Random Alumni Group',
    },
    '120363011111111111@g.us': {
      id: '120363011111111111@g.us',
      subject: 'Training & Placement',
    },
  };

  const mockSocket = {
    groupFetchAllParticipating: async () => mockGroups,
  };

  const testGroupService = new GroupService(() => mockSocket as never);
  const originalIsConnected = whatsappService.isConnected.bind(whatsappService);

  whatsappService.isConnected = () => true;

  try {
    const joinedGroups = await testGroupService.fetchJoinedGroups();
    assert(joinedGroups.length === 3, 'Joined groups are fetched from WhatsApp socket');
    assert(
      joinedGroups.some((group) => group.name === 'Computer Department' && group.isAllowed),
      'Allowed joined group is flagged as allowed',
    );
    assert(
      joinedGroups.some((group) => group.name === 'Random Alumni Group' && !group.isAllowed),
      'Unknown joined group is flagged as unknown',
    );

    const detection = await testGroupService.getGroupDetectionStatus();
    assert(detection.monitoredGroups.length === 2, 'Monitored groups include only allowed joined groups');
    assert(detection.unknownGroups.length === 1, 'Unknown joined groups are separated');
    assert(
      detection.missingAllowedGroups.includes('Faculty Updates'),
      'Configured but not joined groups are reported as missing',
    );
  } finally {
    whatsappService.isConnected = originalIsConnected;
  }

  await whatsappService.initialize();
  const disconnectedDetection = await groupService.getGroupDetectionStatus();
  assert(disconnectedDetection.isConnected === false, 'Detection works while disconnected');
  assert(disconnectedDetection.joinedGroups.length === 0, 'No joined groups are fetched while disconnected');
  assert(
    disconnectedDetection.missingAllowedGroups.length === whatsappConfig.allowedGroups.length,
    'All configured groups are missing while disconnected',
  );
};

const testGroupsApi = async (): Promise<void> => {
  console.log('\n--- WhatsApp groups API ---');

  const unauthorized = await request('GET', '/api/v1/whatsapp/groups');
  assert(unauthorized.status === 401, 'Groups endpoint requires authentication');

  const forbidden = await request('GET', '/api/v1/whatsapp/groups', undefined, facultyToken);
  assert(forbidden.status === 403, 'Groups endpoint requires whatsapp_settings permission');

  const adminResult = await request('GET', '/api/v1/whatsapp/groups', undefined, adminToken);
  assert(adminResult.status === 200, 'Admin can access WhatsApp groups endpoint');
  assert(adminResult.body.success === true, 'Groups response is successful');

  const data = adminResult.body.data ?? {};
  assert(typeof data.isConnected === 'boolean', 'Groups payload includes connection state');
  assert(Array.isArray(data.joinedGroups), 'Groups payload includes joinedGroups');
  assert(Array.isArray(data.monitoredGroups), 'Groups payload includes monitoredGroups');
  assert(Array.isArray(data.unknownGroups), 'Groups payload includes unknownGroups');
  assert(Array.isArray(data.missingAllowedGroups), 'Groups payload includes missingAllowedGroups');

  const configuration = data.configuration as { allowedGroups?: string[]; source?: string };
  assert(Array.isArray(configuration?.allowedGroups), 'Groups payload includes allowed group configuration');
  assert(
    configuration?.source === 'WHATSAPP_ALLOWED_GROUPS',
    'Groups payload exposes configuration source',
  );
};

const setup = async (): Promise<void> => {
  await connectDatabase();
  await cleanupTestUser(ADMIN_EMAIL);
  await cleanupTestUser(FACULTY_EMAIL);

  await createTestUser({
    name: 'WhatsApp Group Admin',
    email: ADMIN_EMAIL,
    role: 'Admin',
  });

  await createTestUser({
    name: 'WhatsApp Group Faculty',
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
  console.log('Running WhatsApp group detection tests...');

  testAllowedGroupConfiguration();
  testPrivateAndUnknownFiltering();
  await testJoinedGroupFetch();

  await setup();
  try {
    await testGroupsApi();
  } finally {
    await teardown();
  }

  console.log('\nAll WhatsApp group detection tests passed.');
};

runTests().catch(async (error) => {
  console.error('\nWhatsApp group detection tests failed:', error);
  try {
    await disconnectDatabase();
  } catch {
    // ignore cleanup errors
  }
  process.exit(1);
});
