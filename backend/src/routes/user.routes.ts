import { Router } from 'express';
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/authorize.middleware';
import { validate } from '../middleware/validate.middleware';
import { createUserSchema, updateUserSchema } from '../validations/auth.validation';

const userRouter = Router();

userRouter.use(authenticate);
userRouter.use(authorize('Admin'));

userRouter.get('/', getUsers);
userRouter.get('/:id', getUserById);
userRouter.post('/', validate(createUserSchema), createUser);
userRouter.put('/:id', validate(updateUserSchema), updateUser);
userRouter.delete('/:id', deleteUser);

export default userRouter;
