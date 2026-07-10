import { Router } from 'express';
import { internshipController } from '../controllers/internship.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorizePermission } from '../middleware/authorize.middleware';
import { validate, validateParams, validateQuery } from '../middleware/validate.middleware';
import { idParamSchema } from '../validations/common.validation';
import {
  createInternshipSchema,
  internshipListQuerySchema,
  updateInternshipSchema,
} from '../validations/internship.validation';

const internshipRouter = Router();

internshipRouter.use(authenticate);

internshipRouter.get(
  '/',
  authorizePermission('search'),
  validateQuery(internshipListQuerySchema),
  internshipController.list,
);

internshipRouter.get(
  '/:id',
  authorizePermission('search'),
  validateParams(idParamSchema),
  internshipController.getById,
);

internshipRouter.post(
  '/',
  authorizePermission('pending_records_approve'),
  validate(createInternshipSchema),
  internshipController.create,
);

internshipRouter.put(
  '/:id',
  authorizePermission('pending_records_approve'),
  validateParams(idParamSchema),
  validate(updateInternshipSchema),
  internshipController.update,
);

internshipRouter.delete(
  '/:id',
  authorizePermission('pending_records_approve'),
  validateParams(idParamSchema),
  internshipController.remove,
);

export default internshipRouter;
