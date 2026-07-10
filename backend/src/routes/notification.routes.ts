import { Router } from 'express';
import { notificationController } from '../controllers/notification.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateParams, validateQuery } from '../middleware/validate.middleware';
import { idParamSchema } from '../validations/common.validation';
import { notificationListQuerySchema } from '../validations/notification.validation';

const notificationRouter = Router();

notificationRouter.use(authenticate);

notificationRouter.get(
  '/',
  validateQuery(notificationListQuerySchema),
  notificationController.list,
);

notificationRouter.put(
  '/:id/read',
  validateParams(idParamSchema),
  notificationController.markAsRead,
);

export default notificationRouter;
