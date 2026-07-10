import type { SignOptions } from 'jsonwebtoken';
import jwt, { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { env } from '../config/env';
import { JwtPayload, JwtSignOptions } from '../types/jwt.types';
import { AppError } from './AppError';

const getJwtSecret = (): string => {
  if (!env.JWT_SECRET) {
    throw new AppError('JWT_SECRET is not configured', 500);
  }

  return env.JWT_SECRET;
};

/**
 * Generate a signed JWT for an authenticated user.
 */
export const generateToken = (payload: JwtPayload, options?: JwtSignOptions): string => {
  const secret = getJwtSecret();
  const expiresIn = (options?.expiresIn ?? env.JWT_EXPIRES_IN) as SignOptions['expiresIn'];

  return jwt.sign(payload, secret, { expiresIn });
};

/**
 * Verify and decode a JWT. Throws AppError on invalid or expired tokens.
 */
export const verifyToken = (token: string): JwtPayload => {
  if (!token || token.trim().length === 0) {
    throw new AppError('Token is required', 401);
  }

  try {
    const secret = getJwtSecret();
    const decoded = jwt.verify(token, secret);

    if (typeof decoded === 'string' || !decoded) {
      throw new AppError('Invalid token payload', 401);
    }

    const { id, email, role } = decoded as JwtPayload;

    if (!id || !email || !role) {
      throw new AppError('Invalid token payload', 401);
    }

    return { id, email, role };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    if (error instanceof TokenExpiredError) {
      throw new AppError('Token has expired', 401);
    }

    if (error instanceof JsonWebTokenError) {
      throw new AppError('Invalid token', 401);
    }

    throw error;
  }
};

/**
 * Decode a JWT without verifying its signature.
 * Use only for non-security purposes such as debugging.
 */
export const decodeToken = (token: string): JwtPayload | null => {
  const decoded = jwt.decode(token);

  if (!decoded || typeof decoded === 'string') {
    return null;
  }

  const { id, email, role } = decoded as JwtPayload;

  if (!id || !email || !role) {
    return null;
  }

  return { id, email, role };
};
