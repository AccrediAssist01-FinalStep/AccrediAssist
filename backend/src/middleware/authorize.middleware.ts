import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../types';
import { AppError } from '../utils/AppError';

export const authorize =
  (...allowedRoles: UserRole[]) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AppError('Authentication required', 401));
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      next(new AppError('You do not have permission to perform this action', 403));
      return;
    }

    next();
  };
