import { Router } from 'express';
import authRouter from './auth.routes';
import userRouter from './user.routes';
import pendingRouter from './pending.routes';
import studentAchievementRouter from './studentAchievement.routes';
import facultyAchievementRouter from './facultyAchievement.routes';
import placementRouter from './placement.routes';

const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/users', userRouter);
apiRouter.use('/pending', pendingRouter);
apiRouter.use('/student-achievements', studentAchievementRouter);
apiRouter.use('/faculty-achievements', facultyAchievementRouter);
apiRouter.use('/placements', placementRouter);

export default apiRouter;
