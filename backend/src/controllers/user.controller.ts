import { Request, Response } from 'express';
import { userService } from '../services/user.service';
import { sendSuccess } from '../utils/apiResponse';
import { asyncHandler } from '../middleware/asyncHandler';

export const createUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = await userService.createUser(req.body);
  sendSuccess(res, 'User created successfully', user, 201);
});
