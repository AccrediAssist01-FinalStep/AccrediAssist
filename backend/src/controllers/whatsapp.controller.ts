import { Request, Response } from 'express';
import { BaseController } from './base.controller';
import { asyncHandler } from '../middleware/asyncHandler';
import { whatsappConnectionManager } from '../whatsapp/connection.manager';
import { groupService } from '../whatsapp/group.service';
import { WhatsAppDisconnectQuery } from '../validations/whatsapp.validation';

class WhatsAppController extends BaseController {
  getStatus = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const status = await whatsappConnectionManager.getStatus();
    this.success(res, 'WhatsApp connection status retrieved', status);
  });

  getQr = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const qr = await whatsappConnectionManager.getQrCode();
    this.success(res, 'WhatsApp QR code retrieved', qr);
  });

  connect = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    await whatsappConnectionManager.start();
    const status = await whatsappConnectionManager.getStatus();
    this.success(res, 'WhatsApp connection started', status);
  });

  disconnect = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const query = req.query as unknown as WhatsAppDisconnectQuery;
    await whatsappConnectionManager.stop({ logout: query.logout });
    const status = await whatsappConnectionManager.getStatus();
    this.success(res, 'WhatsApp connection stopped', status);
  });

  getGroups = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const groups = await groupService.getGroupDetectionStatus();
    this.success(res, 'WhatsApp groups retrieved', groups);
  });
}

export const whatsappController = new WhatsAppController();
