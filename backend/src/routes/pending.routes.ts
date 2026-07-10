import { Router } from 'express';
import { pendingRecordController } from '../controllers/pendingRecord.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorizePermission } from '../middleware/authorize.middleware';
import { validate, validateParams, validateQuery } from '../middleware/validate.middleware';
import { idParamSchema } from '../validations/common.validation';
import {
  pendingRecordListQuerySchema,
  rejectPendingRecordSchema,
  updatePendingRecordSchema,
} from '../validations/pendingRecord.validation';

const pendingRouter = Router();

pendingRouter.use(authenticate);

pendingRouter.get(
  '/',
  authorizePermission('pending_records_view'),
  validateQuery(pendingRecordListQuerySchema),
  pendingRecordController.list,
);

pendingRouter.get(
  '/:id',
  authorizePermission('pending_records_view'),
  validateParams(idParamSchema),
  pendingRecordController.getById,
);

pendingRouter.put(
  '/:id/approve',
  authorizePermission('pending_records_approve'),
  validateParams(idParamSchema),
  pendingRecordController.approve,
);

pendingRouter.put(
  '/:id/reject',
  authorizePermission('pending_records_approve'),
  validateParams(idParamSchema),
  validate(rejectPendingRecordSchema),
  pendingRecordController.reject,
);

pendingRouter.put(
  '/:id',
  authorizePermission('pending_records_approve'),
  validateParams(idParamSchema),
  validate(updatePendingRecordSchema),
  pendingRecordController.update,
);

export default pendingRouter;
