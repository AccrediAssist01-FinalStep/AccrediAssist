import { Router } from 'express';
import { patentController } from '../controllers/patent.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorizePermission } from '../middleware/authorize.middleware';
import { validate, validateParams, validateQuery } from '../middleware/validate.middleware';
import { idParamSchema } from '../validations/common.validation';
import {
  createPatentSchema,
  patentListQuerySchema,
  updatePatentSchema,
} from '../validations/patent.validation';

const patentRouter = Router();

patentRouter.use(authenticate);

patentRouter.get(
  '/',
  authorizePermission('search'),
  validateQuery(patentListQuerySchema),
  patentController.list,
);

patentRouter.get(
  '/:id',
  authorizePermission('search'),
  validateParams(idParamSchema),
  patentController.getById,
);

patentRouter.post(
  '/',
  authorizePermission('pending_records_approve'),
  validate(createPatentSchema),
  patentController.create,
);

patentRouter.put(
  '/:id',
  authorizePermission('pending_records_approve'),
  validateParams(idParamSchema),
  validate(updatePatentSchema),
  patentController.update,
);

patentRouter.delete(
  '/:id',
  authorizePermission('pending_records_approve'),
  validateParams(idParamSchema),
  patentController.remove,
);

export default patentRouter;
