import { Router } from 'express';
import { newsController } from '../controllers/news.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorizePermission } from '../middleware/authorize.middleware';
import { validate, validateParams, validateQuery } from '../middleware/validate.middleware';
import { idParamSchema } from '../validations/common.validation';
import {
  createNewsSchema,
  newsListQuerySchema,
  updateNewsSchema,
} from '../validations/news.validation';

const newsRouter = Router();

newsRouter.use(authenticate);

newsRouter.get(
  '/dashboard',
  authorizePermission('dashboard'),
  newsController.dashboard,
);

newsRouter.get(
  '/',
  authorizePermission('search'),
  validateQuery(newsListQuerySchema),
  newsController.list,
);

newsRouter.get(
  '/:id',
  authorizePermission('search'),
  validateParams(idParamSchema),
  newsController.getById,
);

newsRouter.post(
  '/',
  authorizePermission('pending_records_approve'),
  validate(createNewsSchema),
  newsController.create,
);

newsRouter.put(
  '/:id',
  authorizePermission('pending_records_approve'),
  validateParams(idParamSchema),
  validate(updateNewsSchema),
  newsController.update,
);

newsRouter.delete(
  '/:id',
  authorizePermission('pending_records_approve'),
  validateParams(idParamSchema),
  newsController.remove,
);

export default newsRouter;
