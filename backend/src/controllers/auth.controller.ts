import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { sendSuccess } from '../utils/apiResponse';
import { asyncHandler } from '../middleware/asyncHandler';
import { UnauthorizedError } from '../utils/errors';
import { normalizeClientIp } from '../utils/clientIp';

const getClientIp = (req: Request): string | undefined => {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return normalizeClientIp(forwarded.split(',')[0]);
  }
  return normalizeClientIp(req.socket.remoteAddress);
};

export const login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const result = await authService.login(req.body, getClientIp(req));
  sendSuccess(res, 'Login successful', result);
});

export const getProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new UnauthorizedError();
  }

  const user = await authService.getProfile(req.user.id);
  sendSuccess(res, 'Profile retrieved successfully', user);
});
