import { Request, Response, NextFunction } from 'express';
import { authService, userService } from '../services/auth.service';
import { sendSuccess } from '../utils/apiResponse';
import { AppError } from '../utils/AppError';

const getClientIp = (req: Request): string | undefined => {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress;
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await authService.login(req.body, getClientIp(req));
    sendSuccess(res, 'Login successful', result);
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }
    await authService.logout(req.user.id, getClientIp(req));
    sendSuccess(res, 'Logout successful');
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }
    const user = await authService.getProfile(req.user.id);
    sendSuccess(res, 'Profile retrieved successfully', user);
  } catch (error) {
    next(error);
  }
};

export const getUsers = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const users = await userService.getAllUsers();
    sendSuccess(res, 'Users retrieved successfully', users);
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await userService.getUserById(req.params.id);
    sendSuccess(res, 'User retrieved successfully', user);
  } catch (error) {
    next(error);
  }
};

export const createUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }
    const user = await userService.createUser(req.body, req.user.id);
    sendSuccess(res, 'User created successfully', user, 201);
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }
    const user = await userService.updateUser(req.params.id, req.body, req.user.id);
    sendSuccess(res, 'User updated successfully', user);
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }
    const user = await userService.deleteUser(req.params.id, req.user.id);
    sendSuccess(res, 'User deleted successfully', user);
  } catch (error) {
    next(error);
  }
};
