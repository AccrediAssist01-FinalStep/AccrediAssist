import { Router } from 'express';
import { auditLogController } from '../controllers/auditLog.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorizePermission } from '../middleware/authorize.middleware';
import { validateQuery } from '../middleware/validate.middleware';
import { auditLogListQuerySchema } from '../validations/auditLog.validation';

const auditLogRouter = Router();

auditLogRouter.use(authenticate, authorizePermission('system_logs'));

auditLogRouter.get(
  '/',
  validateQuery(auditLogListQuerySchema),
  auditLogController.list,
);

export default auditLogRouter;
