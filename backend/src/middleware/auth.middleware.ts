import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { AppError } from '../utils/AppError';
import { AuthenticatedUser } from '../types/auth.types';
import { logger } from '../utils/logger';

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

const BEARER_PREFIX = 'Bearer ';

/**
 * Extract JWT from Authorization header.
 */
export const extractBearerToken = (authHeader?: string): string | null => {
  if (!authHeader || !authHeader.startsWith(BEARER_PREFIX)) {
    return null;
  }

  const token = authHeader.slice(BEARER_PREFIX.length).trim();
  return token.length > 0 ? token : null;
};

/**
 * Require a valid JWT. Attaches decoded user to req.user.
 */
export const authenticate = (req: Request, _res: Response, next: NextFunction): void => {
  try {
    const token = extractBearerToken(req.headers.authorization);

    if (!token) {
      throw new AppError('Authentication required', 401);
    }

    const decoded = verifyToken(token);

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    if (error instanceof AppError) {
      logger.warn('Authentication failed', {
        message: error.message,
        path: req.originalUrl,
        method: req.method,
      });
      next(error);
      return;
    }

    logger.warn('Authentication failed', {
      message: 'Invalid or expired token',
      path: req.originalUrl,
      method: req.method,
    });
    next(new AppError('Invalid or expired token', 401));
  }
};

/**
 * Attach user when a valid token is present; continue without user if absent.
 */
export const optionalAuthenticate = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  try {
    const token = extractBearerToken(req.headers.authorization);

    if (!token) {
      next();
      return;
    }

    const decoded = verifyToken(token);
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch {
    next();
  }
};
