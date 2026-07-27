import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { authorizePermission } from '../../middleware/authorize.middleware';
import { validate, validateParams } from '../../middleware/validate.middleware';
import { reportGenerationController } from '../controllers/report-generation.controller';
import {
  reportGenerationPlanSchema,
  reportTypeParamSchema,
  reportDownloadParamSchema,
} from '../utils/report-generation.validation';
import { aggregationFiltersSchema } from '../aggregation/utils/aggregation.validation';

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

reportGenerationRouter.post(
  '/aggregate',
  validate(aggregationFiltersSchema),
  reportGenerationController.aggregate,
);

reportGenerationRouter.post(
  '/summary',
  validate(reportGenerationPlanSchema),
  reportGenerationController.generateSummary,
);

reportGenerationRouter.post(
  '/charts',
  validate(reportGenerationPlanSchema),
  reportGenerationController.generateCharts,
);

reportGenerationRouter.post(
  '/docx',
  validate(reportGenerationPlanSchema),
  reportGenerationController.generateDocx,
);

reportGenerationRouter.post(
  '/pdf',
  validate(reportGenerationPlanSchema),
  reportGenerationController.generatePdf,
);

reportGenerationRouter.get(
  '/downloads/:fileName',
  validateParams(reportDownloadParamSchema),
  reportGenerationController.downloadReport,
);

export default reportGenerationRouter;
