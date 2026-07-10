/**
 * Notifications API integration tests.
 *
 * Prerequisites:
 *   1. cp backend/.env.example backend/.env (set MONGODB_URI and JWT_SECRET)
 *   2. npm install
 *   3. npm run test:notification-api
 */

import http from 'http';
import dotenv from 'dotenv';
import app from '../app';
import { connectDatabase, disconnectDatabase } from '../database/connection';
import { Notification } from '../models/Notification';
import { createTestUser, cleanupTestUser } from './test-helpers';

dotenv.config();

const USER_A_EMAIL = 'notification-api-user-a@accrediassist.edu';
const USER_B_EMAIL = 'notification-api-user-b@accrediassist.edu';

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
let userAToken: string;
let userBToken: string;
let userAId: string;
let notificationId: string;

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
  await Notification.deleteMany({});
  await cleanupTestUser(USER_A_EMAIL);
  await cleanupTestUser(USER_B_EMAIL);

  const userA = await createTestUser({
    name: 'Notification User A',
    email: USER_A_EMAIL,
    role: 'Faculty',
  });

  const userB = await createTestUser({
    name: 'Notification User B',
    email: USER_B_EMAIL,
    role: 'HOD',
  });

  userAId = userA._id.toString();

  await Notification.create([
    {
      title: 'Pending record approved',
      message: 'Your student achievement record was approved.',
      userId: userA._id,
      isRead: false,
      type: 'Approval',
    },
    {
      title: 'Report ready',
      message: 'Your monthly report is ready to download.',
      userId: userA._id,
      isRead: true,
      type: 'Report',
    },
    {
      title: 'System maintenance',
      message: 'Scheduled maintenance tonight at 11 PM.',
      userId: userB._id,
      isRead: false,
      type: 'System',
    },
  ]);

  const userANotification = await Notification.findOne({ userId: userA._id, isRead: false });
  if (!userANotification) {
    throw new Error('Failed to seed notification for user A');
  }
  notificationId = userANotification._id.toString();

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

  userAToken = await login(USER_A_EMAIL, 'Test@12345');
  userBToken = await login(USER_B_EMAIL, 'Test@12345');
};

const teardown = async (): Promise<void> => {
  await Notification.deleteMany({});
  await cleanupTestUser(USER_A_EMAIL);
  await cleanupTestUser(USER_B_EMAIL);

  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) reject(error);
      else resolve();
    });
  });

  await disconnectDatabase();
};

const runTests = async (): Promise<void> => {
  console.log('Running Notifications API tests...\n');

  await setup();

  const unauthorized = await request('GET', '/api/v1/notifications');
  assert(unauthorized.status === 401, 'GET /notifications rejects missing token');

  const list = await request('GET', '/api/v1/notifications?page=1&limit=10', undefined, userAToken);
  assert(list.status === 200, 'GET /notifications returns 200');
  const listData = list.body.data as {
    items: { userId: string; isRead: boolean }[];
    meta: { total: number; unreadCount: number };
  };
  assert(listData.items.length === 2, 'User A sees only their notifications');
  assert(
    listData.items.every((item) => item.userId === userAId),
    'Notifications are scoped to authenticated user',
  );
  assert(listData.meta.unreadCount === 1, 'Unread count is returned in meta');

  const unreadOnly = await request(
    'GET',
    '/api/v1/notifications?isRead=false',
    undefined,
    userAToken,
  );
  assert(unreadOnly.status === 200, 'GET /notifications filters by isRead');
  const unreadItems = (unreadOnly.body.data as { items: { isRead: boolean }[] }).items;
  assert(
    unreadItems.every((item) => item.isRead === false),
    'isRead=false filter returns unread notifications',
  );

  const marked = await request(
    'PUT',
    `/api/v1/notifications/${notificationId}/read`,
    undefined,
    userAToken,
  );
  assert(marked.status === 200, 'PUT /notifications/:id/read marks notification as read');
  assert(
    (marked.body.data as { isRead: boolean }).isRead === true,
    'Mark as read persists isRead=true',
  );

  const otherUserMark = await request(
    'PUT',
    `/api/v1/notifications/${notificationId}/read`,
    undefined,
    userBToken,
  );
  assert(otherUserMark.status === 404, 'User cannot mark another user notification as read');

  const afterRead = await request('GET', '/api/v1/notifications', undefined, userAToken);
  assert(
    (afterRead.body.data as { meta: { unreadCount: number } }).meta.unreadCount === 0,
    'Unread count decreases after mark as read',
  );

  const notFound = await request(
    'PUT',
    `/api/v1/notifications/${'0'.repeat(24)}/read`,
    undefined,
    userAToken,
  );
  assert(notFound.status === 404, 'Non-existent notification returns 404');

  await teardown();

  console.log('\nAll Notifications API tests passed.');
};

runTests().catch(async (error) => {
  console.error('\nNotifications API tests failed:', error);
  await teardown().catch(() => undefined);
  process.exit(1);
});
