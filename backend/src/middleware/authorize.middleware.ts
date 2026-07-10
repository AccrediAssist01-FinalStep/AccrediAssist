import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../database/enums';
import { AppError } from '../utils/AppError';
import { logger } from '../utils/logger';
import {
  Permission,
  ROLE_PERMISSIONS,
} from '../types/auth.types';

/**
 * Restrict access to one or more explicit roles.
 *
 * @example
 * router.get('/users', authenticate, authorize('Admin'), getUsers);
 */
export const authorize =
  (...allowedRoles: UserRole[]) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AppError('Authentication required', 401));
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.warn('Authorization denied', {
        userId: req.user.id,
        role: req.user.role,
        requiredRoles: allowedRoles,
        path: req.originalUrl,
        method: req.method,
      });
      next(new AppError('You do not have permission to perform this action', 403));
      return;
    }

    next();
  };

/**
 * Restrict access using the RBAC permission map from Document 8.
 *
 * @example
 * router.put('/pending/:id/approve', authenticate, authorizePermission('pending_records_approve'), approveRecord);
 */
export const authorizePermission =
  (permission: Permission) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const allowedRoles = ROLE_PERMISSIONS[permission];
    return authorize(...allowedRoles)(req, _res, next);
  };

/** Shorthand: Admin only */
export const adminOnly = authorize('Admin');

/** Shorthand: Admin or Faculty (record approval) */
export const approverOnly = authorize('Admin', 'Faculty');
