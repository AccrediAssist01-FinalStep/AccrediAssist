/**
 * Frontend authentication flow verification.
 *
 * Run with backend running:
 *   npm run test:auth-flow
 *
 * Requires valid credentials via environment variables or defaults for local dev.
 */

import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api/v1';
const TEST_EMAIL = process.env.TEST_AUTH_EMAIL ?? 'dashboard-api-admin@accrediassist.edu';
const TEST_PASSWORD = process.env.TEST_AUTH_PASSWORD ?? 'Test@12345';

const assert = (condition: boolean, message: string): void => {
  if (!condition) throw new Error(`FAIL: ${message}`);
  console.log(`PASS: ${message}`);
};

const run = async (): Promise<void> => {
  console.log('Running frontend auth flow verification...\n');

  // 1. Login via existing backend API
  let token: string;
  try {
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });
    assert(loginResponse.status === 200, 'Login API returns 200');
    assert(Boolean(loginResponse.data?.data?.token), 'Login API returns JWT token');
    assert(Boolean(loginResponse.data?.data?.user?.role), 'Login API returns user with role');
    token = loginResponse.data.data.token;
  } catch (error) {
    if (axios.isAxiosError(error) && !error.response) {
      console.warn('SKIP: Backend not reachable — start backend to run live auth tests');
      process.exit(0);
    }
    throw error;
  }

  // 2. Session restore via profile
  const profileResponse = await axios.get(`${API_BASE_URL}/auth/profile`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert(profileResponse.status === 200, 'Profile API validates JWT (session restore)');
  assert(profileResponse.data?.data?.email === TEST_EMAIL, 'Profile returns authenticated user');

  // 3. Protected route rejection without token
  try {
    await axios.get(`${API_BASE_URL}/dashboard/summary`);
    throw new Error('Expected 401 without token');
  } catch (error) {
    if (axios.isAxiosError(error)) {
      assert(error.response?.status === 401, 'Protected API rejects unauthenticated requests');
    } else {
      throw error;
    }
  }

  // 4. Protected route with token
  const dashboardResponse = await axios.get(`${API_BASE_URL}/dashboard/summary`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert(dashboardResponse.status === 200, 'Protected API accepts valid JWT');

  // 5. Invalid credentials
  try {
    await axios.post(`${API_BASE_URL}/auth/login`, {
      email: TEST_EMAIL,
      password: 'wrong-password',
    });
    throw new Error('Expected 401 for invalid credentials');
  } catch (error) {
    if (axios.isAxiosError(error)) {
      assert(error.response?.status === 401, 'Login rejects invalid credentials');
    } else {
      throw error;
    }
  }

  console.log('\nAll frontend auth flow checks passed.');
};

run().catch((error) => {
  console.error('\nAuth flow verification failed:', error.message ?? error);
  process.exit(1);
});
