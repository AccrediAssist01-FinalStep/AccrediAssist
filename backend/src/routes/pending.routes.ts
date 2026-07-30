import { Router } from 'express';
import { pendingRecordController } from '../controllers/pendingRecord.controller';
import { pendingReviewController } from '../controllers/pendingReview.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorizePermission } from '../middleware/authorize.middleware';
import { validate, validateParams, validateQuery } from '../middleware/validate.middleware';
import { idParamSchema } from '../validations/common.validation';
import {
  pendingRecordListQuerySchema,
  rejectPendingRecordSchema,
} from '../validations/pendingRecord.validation';
import { editPendingRecordSchema } from '../validations/pendingRecordEdit.validation';

const pendingRouter = Router();

pendingRouter.use(authenticate);

pendingRouter.get(
  '/',
  authorizePermission('pending_records_review'),
  validateQuery(pendingRecordListQuerySchema),
  pendingReviewController.list,
);

pendingRouter.get(
  '/:id',
  authorizePermission('pending_records_review'),
  validateParams(idParamSchema),
  pendingReviewController.getById,
);

pendingRouter.get(
  '/:id/attachment',
  authorizePermission('pending_records_review'),
  validateParams(idParamSchema),
  pendingReviewController.downloadAttachment,
);

pendingRouter.patch(
  '/:id',
  authorizePermission('pending_records_review'),
  validateParams(idParamSchema),
  validate(editPendingRecordSchema),
  pendingReviewController.update,
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

pendingRouter.post(
  '/:id/regenerate',
  authorizePermission('pending_records_review'),
  validateParams(idParamSchema),
  pendingRecordController.regenerate,
);

export default pendingRouter;
