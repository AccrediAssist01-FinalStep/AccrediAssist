import { Router } from 'express';
import { login } from '../controllers/auth.controller';
import { validate } from '../middleware/validate.middleware';
import { loginSchema } from '../validations/auth.validation';
import { authRateLimiter } from '../middleware/rateLimit.middleware';

const authRouter = Router();

authRouter.post('/login', authRateLimiter, validate(loginSchema), login);

export default authRouter;
