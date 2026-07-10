import { Router } from 'express';
import { whatsappController } from '../controllers/whatsapp.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorizePermission } from '../middleware/authorize.middleware';
import { validateQuery } from '../middleware/validate.middleware';
import { whatsappDisconnectQuerySchema } from '../validations/whatsapp.validation';

const whatsappRouter = Router();

whatsappRouter.use(authenticate, authorizePermission('whatsapp_settings'));

whatsappRouter.get('/status', whatsappController.getStatus);
whatsappRouter.get('/qr', whatsappController.getQr);
whatsappRouter.get('/groups', whatsappController.getGroups);
whatsappRouter.post('/connect', whatsappController.connect);
whatsappRouter.post('/disconnect', validateQuery(whatsappDisconnectQuerySchema), whatsappController.disconnect);

export default whatsappRouter;
