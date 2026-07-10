import { Router } from 'express';
import { auditLogController } from '../controllers/auditLog.controller';
import { authenticate } from '../middleware/auth.middleware';
import { adminOnly } from '../middleware/authorize.middleware';
import { validateQuery } from '../middleware/validate.middleware';
import { auditLogListQuerySchema } from '../validations/auditLog.validation';

const auditLogRouter = Router();

auditLogRouter.use(authenticate, adminOnly);

auditLogRouter.get(
  '/',
  validateQuery(auditLogListQuerySchema),
  auditLogController.list,
);

export default auditLogRouter;
