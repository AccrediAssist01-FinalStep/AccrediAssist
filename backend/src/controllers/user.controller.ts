import { Request, Response, NextFunction } from 'express';
import { userService } from '../services/user.service';
import { sendSuccess } from '../utils/apiResponse';

export const createUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const user = await userService.createUser(req.body);
    sendSuccess(res, 'User created successfully', user, 201);
  } catch (error) {
    next(error);
  }
};
