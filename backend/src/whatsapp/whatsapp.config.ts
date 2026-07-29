import path from 'path';
import { whatsappAllowedGroups, env } from '../config/env';

export const whatsappConfig = {
  sessionPath: path.resolve(process.cwd(), env.WHATSAPP_SESSION_PATH),
  allowedGroups: whatsappAllowedGroups,
  cloudinary: {
    cloudName: env.CLOUDINARY_CLOUD_NAME,
    apiKey: env.CLOUDINARY_API_KEY,
    apiSecret: env.CLOUDINARY_API_SECRET,
  },
} as const;

export const baileysConfig = {
  printQRInTerminal: false,
  syncFullHistory: false,
  markOnlineOnConnect: false,
} as const;

export const reconnectConfig = {
  baseDelayMs: 3_000,
  maxDelayMs: 30_000,
  maxAttempts: 10,
} as const;

export const mediaConfig = {
  tempPath: path.resolve(process.cwd(), env.WHATSAPP_MEDIA_TEMP_PATH),
  maxFileSizeBytes: 20 * 1024 * 1024,
  cloudinaryFolder: 'accrediassist/whatsapp',
} as const;
