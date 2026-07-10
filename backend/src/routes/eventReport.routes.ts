import { Router } from 'express';
import { completedEventReportController } from '../controllers/completedEventReport.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorizePermission } from '../middleware/authorize.middleware';
import { validate, validateParams, validateQuery } from '../middleware/validate.middleware';
import { idParamSchema } from '../validations/common.validation';
import {
  completedEventReportListQuerySchema,
  createCompletedEventReportSchema,
  updateCompletedEventReportSchema,
} from '../validations/completedEventReport.validation';

const eventReportRouter = Router();

eventReportRouter.use(authenticate);

eventReportRouter.get(
  '/',
  authorizePermission('search'),
  validateQuery(completedEventReportListQuerySchema),
  completedEventReportController.list,
);

eventReportRouter.get(
  '/:id',
  authorizePermission('search'),
  validateParams(idParamSchema),
  completedEventReportController.getById,
);

eventReportRouter.post(
  '/',
  authorizePermission('pending_records_approve'),
  validate(createCompletedEventReportSchema),
  completedEventReportController.create,
);

eventReportRouter.put(
  '/:id',
  authorizePermission('pending_records_approve'),
  validateParams(idParamSchema),
  validate(updateCompletedEventReportSchema),
  completedEventReportController.update,
);

eventReportRouter.delete(
  '/:id',
  authorizePermission('pending_records_approve'),
  validateParams(idParamSchema),
  completedEventReportController.remove,
);

export default eventReportRouter;
