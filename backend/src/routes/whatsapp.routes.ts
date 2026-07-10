import { Router } from 'express';
import { whatsappController } from '../controllers/whatsapp.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorizePermission } from '../middleware/authorize.middleware';

const whatsappRouter = Router();

whatsappRouter.use(authenticate, authorizePermission('whatsapp_settings'));

whatsappRouter.get('/status', whatsappController.getStatus);
whatsappRouter.post('/connect', whatsappController.connect);
whatsappRouter.post('/disconnect', whatsappController.disconnect);

export default whatsappRouter;
