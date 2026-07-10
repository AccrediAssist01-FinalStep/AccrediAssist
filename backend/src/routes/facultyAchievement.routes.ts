import { Router } from 'express';
import { facultyAchievementController } from '../controllers/facultyAchievement.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorizePermission } from '../middleware/authorize.middleware';
import { validate, validateParams, validateQuery } from '../middleware/validate.middleware';
import { idParamSchema } from '../validations/common.validation';
import {
  createFacultyAchievementSchema,
  facultyAchievementListQuerySchema,
  updateFacultyAchievementSchema,
} from '../validations/facultyAchievement.validation';

const facultyAchievementRouter = Router();

facultyAchievementRouter.use(authenticate);

facultyAchievementRouter.get(
  '/',
  authorizePermission('search'),
  validateQuery(facultyAchievementListQuerySchema),
  facultyAchievementController.list,
);

facultyAchievementRouter.get(
  '/:id',
  authorizePermission('search'),
  validateParams(idParamSchema),
  facultyAchievementController.getById,
);

facultyAchievementRouter.post(
  '/',
  authorizePermission('pending_records_approve'),
  validate(createFacultyAchievementSchema),
  facultyAchievementController.create,
);

facultyAchievementRouter.put(
  '/:id',
  authorizePermission('pending_records_approve'),
  validateParams(idParamSchema),
  validate(updateFacultyAchievementSchema),
  facultyAchievementController.update,
);

facultyAchievementRouter.delete(
  '/:id',
  authorizePermission('pending_records_approve'),
  validateParams(idParamSchema),
  facultyAchievementController.remove,
);

export default facultyAchievementRouter;
