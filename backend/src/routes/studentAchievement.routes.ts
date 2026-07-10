import { Router } from 'express';
import { studentAchievementController } from '../controllers/studentAchievement.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorizePermission } from '../middleware/authorize.middleware';
import { validate, validateParams, validateQuery } from '../middleware/validate.middleware';
import { idParamSchema } from '../validations/common.validation';
import {
  createStudentAchievementSchema,
  studentAchievementListQuerySchema,
  updateStudentAchievementSchema,
} from '../validations/studentAchievement.validation';

const studentAchievementRouter = Router();

studentAchievementRouter.use(authenticate);

studentAchievementRouter.get(
  '/',
  authorizePermission('search'),
  validateQuery(studentAchievementListQuerySchema),
  studentAchievementController.list,
);

studentAchievementRouter.get(
  '/:id',
  authorizePermission('search'),
  validateParams(idParamSchema),
  studentAchievementController.getById,
);

studentAchievementRouter.post(
  '/',
  authorizePermission('pending_records_approve'),
  validate(createStudentAchievementSchema),
  studentAchievementController.create,
);

studentAchievementRouter.put(
  '/:id',
  authorizePermission('pending_records_approve'),
  validateParams(idParamSchema),
  validate(updateStudentAchievementSchema),
  studentAchievementController.update,
);

studentAchievementRouter.delete(
  '/:id',
  authorizePermission('pending_records_approve'),
  validateParams(idParamSchema),
  studentAchievementController.remove,
);

export default studentAchievementRouter;
