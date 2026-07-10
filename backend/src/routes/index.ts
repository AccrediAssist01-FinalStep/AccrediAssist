import { Router } from 'express';
import authRouter from './auth.routes';
import userRouter from './user.routes';
import pendingRouter from './pending.routes';
import studentAchievementRouter from './studentAchievement.routes';
import facultyAchievementRouter from './facultyAchievement.routes';
import placementRouter from './placement.routes';
import internshipRouter from './internship.routes';
import eventReportRouter from './eventReport.routes';
import publicationRouter from './publication.routes';
import patentRouter from './patent.routes';

const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/users', userRouter);
apiRouter.use('/pending', pendingRouter);
apiRouter.use('/student-achievements', studentAchievementRouter);
apiRouter.use('/faculty-achievements', facultyAchievementRouter);
apiRouter.use('/placements', placementRouter);
apiRouter.use('/internships', internshipRouter);
apiRouter.use('/event-reports', eventReportRouter);
apiRouter.use('/publications', publicationRouter);
apiRouter.use('/patents', patentRouter);

export default apiRouter;
