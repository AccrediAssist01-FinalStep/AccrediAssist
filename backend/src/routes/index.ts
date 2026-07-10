import { Router } from 'express';
import authRouter from './auth.routes';
import userRouter from './user.routes';
import pendingRouter from './pending.routes';
import studentAchievementRouter from './studentAchievement.routes';

const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/users', userRouter);
apiRouter.use('/pending', pendingRouter);
apiRouter.use('/student-achievements', studentAchievementRouter);

export default apiRouter;
