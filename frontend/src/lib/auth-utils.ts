import type { UserRole } from '@/types';

export type AuthErrorCode =
  | 'invalid_credentials'
  | 'network'
  | 'server'
  | 'session_expired'
  | 'unknown';

export interface ParsedAuthError {
  code: AuthErrorCode;
  message: string;
  title: string;
}

const ERROR_TITLES: Record<AuthErrorCode, string> = {
  invalid_credentials: 'Invalid credentials',
  network: 'Network unavailable',
  server: 'Server unavailable',
  session_expired: 'Session expired',
  unknown: 'Authentication failed',
};

export const REMEMBER_EMAIL_KEY = 'accrediassist-remember-email';

const ROLE_HOME: Record<UserRole, string> = {
  Admin: '/dashboard',
  HOD: '/dashboard',
  Faculty: '/pending-reviews',
  AccreditationCommittee: '/analytics',
};

export const getRoleHomePath = (role?: UserRole): string => {
  if (!role) return '/dashboard';
  return ROLE_HOME[role] ?? '/dashboard';
};

export const resolvePostLoginPath = (
  role: UserRole | undefined,
  redirectParam?: string | null,
): string => {
  if (redirectParam && redirectParam.startsWith('/') && !redirectParam.startsWith('/login')) {
    return redirectParam;
  }
  return getRoleHomePath(role);
};

export const getRememberedEmail = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REMEMBER_EMAIL_KEY);
};

export const setRememberedEmail = (email: string | null): void => {
  if (typeof window === 'undefined') return;
  if (email) {
    localStorage.setItem(REMEMBER_EMAIL_KEY, email);
  } else {
    localStorage.removeItem(REMEMBER_EMAIL_KEY);
  }
};

export const parseAuthError = (error: unknown): ParsedAuthError => {
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'title' in error &&
    'message' in error &&
    typeof (error as ParsedAuthError).code === 'string' &&
    (error as ParsedAuthError).code in ERROR_TITLES
  ) {
    return error as ParsedAuthError;
  }

  const axiosError = error as {
    response?: { status?: number; data?: { message?: string } };
    message?: string;
    code?: string;
  };

  if (!axiosError.response) {
    return {
      code: 'network',
      title: ERROR_TITLES.network,
      message: 'Unable to reach the server. Check your internet connection and try again.',
    };
  }

  const status = axiosError.response.status ?? 0;

  if (status >= 500) {
    return {
      code: 'server',
      title: ERROR_TITLES.server,
      message: 'Our servers are temporarily unavailable. Please try again in a few minutes.',
    };
  }

  if (status === 401) {
    return {
      code: 'invalid_credentials',
      title: ERROR_TITLES.invalid_credentials,
      message:
        axiosError.response.data?.message ??
        'The email or password you entered is incorrect. Please try again.',
    };
  }

  return {
    code: 'unknown',
    title: ERROR_TITLES.unknown,
    message: axiosError.response.data?.message ?? 'Something went wrong. Please try again.',
  };
};

export const createSessionExpiredError = (): ParsedAuthError => ({
  code: 'session_expired',
  title: ERROR_TITLES.session_expired,
  message: 'Your session has expired for security reasons. Please sign in again.',
});
