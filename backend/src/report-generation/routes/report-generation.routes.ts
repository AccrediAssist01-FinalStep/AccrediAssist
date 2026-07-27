import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { authorizePermission } from '../../middleware/authorize.middleware';
import { validate, validateParams } from '../../middleware/validate.middleware';
import { reportGenerationController } from '../controllers/report-generation.controller';
import {
  reportGenerationPlanSchema,
  reportTypeParamSchema,
} from '../utils/report-generation.validation';

const reportGenerationRouter = Router();

reportGenerationRouter.use(authenticate);
reportGenerationRouter.use(authorizePermission('reports'));

reportGenerationRouter.get('/status', reportGenerationController.getStatus);

reportGenerationRouter.get('/types', reportGenerationController.listTypes);

reportGenerationRouter.get(
  '/types/:typeId',
  validateParams(reportTypeParamSchema),
  reportGenerationController.getType,
);

reportGenerationRouter.get(
  '/types/:typeId/generator',
  validateParams(reportTypeParamSchema),
  reportGenerationController.getGenerator,
);

reportGenerationRouter.get('/generators', reportGenerationController.listGenerators);

reportGenerationRouter.post(
  '/plan',
  validate(reportGenerationPlanSchema),
  reportGenerationController.createPlan,
);

reportGenerationRouter.post(
  '/dry-run',
  validate(reportGenerationPlanSchema),
  reportGenerationController.dryRun,
);

export default reportGenerationRouter;
