import { Router } from 'express';
import { placementController } from '../controllers/placement.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorizePermission } from '../middleware/authorize.middleware';
import { validate, validateParams, validateQuery } from '../middleware/validate.middleware';
import { idParamSchema } from '../validations/common.validation';
import {
  createPlacementSchema,
  placementListQuerySchema,
  updatePlacementSchema,
} from '../validations/placement.validation';

const placementRouter = Router();

placementRouter.use(authenticate);

placementRouter.get(
  '/',
  authorizePermission('search'),
  validateQuery(placementListQuerySchema),
  placementController.list,
);

placementRouter.get(
  '/:id',
  authorizePermission('search'),
  validateParams(idParamSchema),
  placementController.getById,
);

placementRouter.post(
  '/',
  authorizePermission('pending_records_approve'),
  validate(createPlacementSchema),
  placementController.create,
);

placementRouter.put(
  '/:id',
  authorizePermission('pending_records_approve'),
  validateParams(idParamSchema),
  validate(updatePlacementSchema),
  placementController.update,
);

placementRouter.delete(
  '/:id',
  authorizePermission('pending_records_approve'),
  validateParams(idParamSchema),
  placementController.remove,
);

export default placementRouter;
