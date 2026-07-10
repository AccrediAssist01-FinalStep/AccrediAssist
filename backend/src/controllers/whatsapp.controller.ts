import { Request, Response } from 'express';
import { BaseController } from './base.controller';
import { asyncHandler } from '../middleware/asyncHandler';
import { whatsappConnectionManager } from '../whatsapp/connection.manager';
import { groupService } from '../whatsapp/group.service';

class WhatsAppController extends BaseController {
  getStatus = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const status = await whatsappConnectionManager.getStatus();
    this.success(res, 'WhatsApp connection status retrieved', status);
  });

  connect = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    await whatsappConnectionManager.start();
    const status = await whatsappConnectionManager.getStatus();
    this.success(res, 'WhatsApp connection started', status);
  });

  disconnect = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const logout = req.query.logout === 'true';
    await whatsappConnectionManager.stop({ logout });
    const status = await whatsappConnectionManager.getStatus();
    this.success(res, 'WhatsApp connection stopped', status);
  });

  getGroups = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const groups = await groupService.getGroupDetectionStatus();
    this.success(res, 'WhatsApp groups retrieved', groups);
  });
}

export const whatsappController = new WhatsAppController();
