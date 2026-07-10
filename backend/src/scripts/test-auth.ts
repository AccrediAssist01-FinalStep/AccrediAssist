/**
 * Authentication integration test script.
 *
 * Prerequisites:
 *   1. cp backend/.env.example backend/.env (set MONGODB_URI and JWT_SECRET)
 *   2. npm install (from project root or backend)
 *   3. npm run seed (create test admin user)
 *   4. npm run dev (start server in another terminal)
 *   5. npm run test:auth
 */

const API_BASE = process.env.API_BASE_URL ?? 'http://localhost:5000/api/v1';
const TEST_EMAIL = process.env.TEST_EMAIL ?? 'admin@accrediassist.edu';
const TEST_PASSWORD = process.env.TEST_PASSWORD ?? 'Admin@12345';

interface ApiResult {
  status: number;
  body: {
    success: boolean;
    message: string;
    data?: unknown;
    errors?: string[];
  };
}

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

  const response = await fetch(`${API_BASE}${path}`, {
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

const runTests = async (): Promise<void> => {
  console.log('Running authentication tests...\n');

  // Test 1: Login with invalid credentials
  const invalidLogin = await request('POST', '/auth/login', {
    email: TEST_EMAIL,
    password: 'wrong-password',
  });
  assert(invalidLogin.status === 401, 'Login rejects invalid password');
  assert(invalidLogin.body.success === false, 'Invalid login returns success: false');

  // Test 2: Login with valid credentials
  const validLogin = await request('POST', '/auth/login', {
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  });
  assert(validLogin.status === 200, 'Login succeeds with valid credentials');
  assert(validLogin.body.success === true, 'Valid login returns success: true');
  assert(
    typeof (validLogin.body.data as { token?: string })?.token === 'string',
    'Login returns JWT token',
  );

  const token = (validLogin.body.data as { token: string }).token;

  // Test 3: Protected route without token
  const noToken = await request('GET', '/auth/profile');
  assert(noToken.status === 401, 'Protected route rejects missing token');

  // Test 4: Protected route with invalid token
  const badToken = await request('GET', '/auth/profile', undefined, 'invalid.token.here');
  assert(badToken.status === 401, 'Protected route rejects invalid token');

  // Test 5: Protected route with valid token
  const profile = await request('GET', '/auth/profile', undefined, token);
  assert(profile.status === 200, 'Protected route accepts valid JWT');
  assert(profile.body.success === true, 'Profile returns success: true');
  assert(
    (profile.body.data as { email?: string })?.email === TEST_EMAIL,
    'Profile returns authenticated user email',
  );

  console.log('\nAll authentication tests passed.');
};

runTests().catch((error) => {
  console.error('\nAuthentication tests failed:', error);
  process.exit(1);
});
