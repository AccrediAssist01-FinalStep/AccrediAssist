import { Router } from 'express';
import authRouter from './auth.routes';
import userRouter from './user.routes';
import pendingRouter from './pending.routes';

const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/users', userRouter);
apiRouter.use('/pending', pendingRouter);

export default apiRouter;
