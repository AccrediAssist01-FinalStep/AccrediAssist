import { Router } from 'express';
import { createUser } from '../controllers/user.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorizePermission } from '../middleware/authorize.middleware';
import { validate } from '../middleware/validate.middleware';
import { createUserSchema } from '../validations/auth.validation';

const userRouter = Router();

userRouter.post(
  '/',
  authenticate,
  authorizePermission('user_management'),
  validate(createUserSchema),
  createUser,
);

export default userRouter;
