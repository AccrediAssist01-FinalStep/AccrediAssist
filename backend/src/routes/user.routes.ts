import { Router } from 'express';
import { createUser } from '../controllers/user.controller';
import { validate } from '../middleware/validate.middleware';
import { createUserSchema } from '../validations/auth.validation';

const userRouter = Router();

userRouter.post('/', validate(createUserSchema), createUser);

export default userRouter;
