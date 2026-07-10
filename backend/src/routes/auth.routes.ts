import { Router } from 'express';
import { login, getProfile } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { loginSchema } from '../validations/auth.validation';
import { authRateLimiter } from '../middleware/rateLimit.middleware';

const authRouter = Router();

authRouter.post('/login', authRateLimiter, validate(loginSchema), login);
authRouter.get('/profile', authenticate, getProfile);

export default authRouter;
