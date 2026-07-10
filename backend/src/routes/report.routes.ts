import { Router } from 'express';
import { reportController } from '../controllers/report.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorizePermission } from '../middleware/authorize.middleware';
import { validate, validateParams, validateQuery } from '../middleware/validate.middleware';
import { idParamSchema } from '../validations/common.validation';
import {
  generateReportSchema,
  reportDownloadQuerySchema,
  reportListQuerySchema,
} from '../validations/report.validation';

const reportRouter = Router();

reportRouter.use(authenticate);
reportRouter.use(authorizePermission('reports'));

reportRouter.get(
  '/',
  validateQuery(reportListQuerySchema),
  reportController.list,
);

reportRouter.post(
  '/generate',
  validate(generateReportSchema),
  reportController.generate,
);

reportRouter.get(
  '/:id/download',
  validateParams(idParamSchema),
  validateQuery(reportDownloadQuerySchema),
  reportController.download,
);

reportRouter.get(
  '/:id',
  validateParams(idParamSchema),
  reportController.getById,
);

export default reportRouter;
