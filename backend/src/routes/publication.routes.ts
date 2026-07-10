import { Router } from 'express';
import { publicationController } from '../controllers/publication.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorizePermission } from '../middleware/authorize.middleware';
import { validate, validateParams, validateQuery } from '../middleware/validate.middleware';
import { idParamSchema } from '../validations/common.validation';
import {
  createPublicationSchema,
  publicationListQuerySchema,
  updatePublicationSchema,
} from '../validations/publication.validation';

const publicationRouter = Router();

publicationRouter.use(authenticate);

publicationRouter.get(
  '/',
  authorizePermission('search'),
  validateQuery(publicationListQuerySchema),
  publicationController.list,
);

publicationRouter.get(
  '/:id',
  authorizePermission('search'),
  validateParams(idParamSchema),
  publicationController.getById,
);

publicationRouter.post(
  '/',
  authorizePermission('pending_records_approve'),
  validate(createPublicationSchema),
  publicationController.create,
);

publicationRouter.put(
  '/:id',
  authorizePermission('pending_records_approve'),
  validateParams(idParamSchema),
  validate(updatePublicationSchema),
  publicationController.update,
);

publicationRouter.delete(
  '/:id',
  authorizePermission('pending_records_approve'),
  validateParams(idParamSchema),
  publicationController.remove,
);

export default publicationRouter;
