import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import pino from 'pino';
import { logger } from '../utils/logger';
import { BadRequestError } from '../utils/errors';
import {
  CloudinaryUploadHandler,
  cloudinaryService,
} from '../services/cloudinary.service';
import { loadBaileys } from './baileys.loader';
import { mediaConfig } from './whatsapp.config';
import { DetectedWhatsAppMedia, WhatsAppMediaMetadata, WhatsAppMediaType } from './types';

type WASocket = import('@whiskeysockets/baileys').WASocket;
type WAMessage = import('@whiskeysockets/baileys').proto.IWebMessageInfo;

const baileysLogger = pino({ level: 'silent' });

export type MediaBufferDownloader = (
  message: WAMessage,
  socket: WASocket,
) => Promise<Buffer>;

export interface DownloadMediaInput {
  message: WAMessage;
  socket: WASocket;
  mediaInfo: DetectedWhatsAppMedia;
}

export interface ProcessedWhatsAppMedia {
  secureUrl: string;
  metadata: WhatsAppMediaMetadata;
}

const MIME_EXTENSION_MAP: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'application/vnd.ms-excel': '.xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
  'text/plain': '.txt',
};

const defaultCloudinaryUploadHandler: CloudinaryUploadHandler = async (input) =>
  cloudinaryService.uploadWhatsAppMedia({
    ...input,
    folder: input.folder ?? mediaConfig.cloudinaryFolder,
  });

export class MediaService {
  constructor(
    private downloadBuffer: MediaBufferDownloader = defaultMediaBufferDownloader,
    private uploadToCloudinary: CloudinaryUploadHandler = defaultCloudinaryUploadHandler,
  ) {}

  async ensureTempDirectory(): Promise<string> {
    await fs.mkdir(mediaConfig.tempPath, { recursive: true });
    return mediaConfig.tempPath;
  }

  async downloadAndSave(input: DownloadMediaInput): Promise<WhatsAppMediaMetadata> {
    const { message, socket, mediaInfo } = input;
    await this.ensureTempDirectory();

    const buffer = await this.downloadBuffer(message, socket);

    if (buffer.length === 0) {
      throw new BadRequestError('Downloaded WhatsApp media is empty');
    }

    if (buffer.length > mediaConfig.maxFileSizeBytes) {
      throw new BadRequestError('Downloaded WhatsApp media exceeds the allowed size limit');
    }

    const tempFileId = randomUUID();
    const extension = this.resolveExtension(mediaInfo.mimeType, mediaInfo.fileName);
    const storedFileName = `${tempFileId}${extension}`;
    const localPath = path.join(mediaConfig.tempPath, storedFileName);

    await fs.writeFile(localPath, buffer);

    const metadata: WhatsAppMediaMetadata = {
      mediaType: mediaInfo.mediaType,
      mimeType: mediaInfo.mimeType,
      fileName: mediaInfo.fileName,
      fileSize: buffer.length,
      localPath,
      tempFileId,
      downloadedAt: new Date(),
    };

    logger.info('WhatsApp media saved temporarily', {
      mediaType: metadata.mediaType,
      mimeType: metadata.mimeType,
      fileName: metadata.fileName,
      fileSize: metadata.fileSize,
      tempFileId: metadata.tempFileId,
    });

    return metadata;
  }

  async processIncomingMedia(input: DownloadMediaInput): Promise<ProcessedWhatsAppMedia> {
    const tempMetadata = await this.downloadAndSave(input);

    try {
      const uploadResult = await this.uploadToCloudinary({
        filePath: tempMetadata.localPath!,
        fileName: tempMetadata.fileName,
        mediaType: tempMetadata.mediaType,
        folder: mediaConfig.cloudinaryFolder,
      });

      await this.deleteTempMedia(tempMetadata.tempFileId);

      const metadata: WhatsAppMediaMetadata = {
        mediaType: tempMetadata.mediaType,
        mimeType: tempMetadata.mimeType,
        fileName: tempMetadata.fileName,
        fileSize: tempMetadata.fileSize,
        tempFileId: tempMetadata.tempFileId,
        downloadedAt: tempMetadata.downloadedAt,
        uploadedAt: new Date(),
        secureUrl: uploadResult.secureUrl,
        publicId: uploadResult.publicId,
      };

      logger.info('WhatsApp media uploaded to Cloudinary', {
        mediaType: metadata.mediaType,
        fileName: metadata.fileName,
        secureUrl: metadata.secureUrl,
        publicId: metadata.publicId,
      });

      return {
        secureUrl: uploadResult.secureUrl,
        metadata,
      };
    } catch (error) {
      await this.deleteTempMedia(tempMetadata.tempFileId).catch(() => undefined);
      throw error;
    }
  }

  async deleteTempMedia(tempFileId: string): Promise<void> {
    const tempDirectory = await this.ensureTempDirectory();
    const entries = await fs.readdir(tempDirectory);

    await Promise.all(
      entries
        .filter((entry) => entry.startsWith(tempFileId))
        .map((entry) => fs.unlink(path.join(tempDirectory, entry))),
    );
  }

  resolveExtension(mimeType: string, fileName: string): string {
    const normalizedMimeType = mimeType.toLowerCase();
    const mappedExtension = MIME_EXTENSION_MAP[normalizedMimeType];

    if (mappedExtension) {
      return mappedExtension;
    }

    const fileExtension = path.extname(fileName);
    if (fileExtension) {
      return fileExtension;
    }

    if (normalizedMimeType.startsWith('image/')) {
      return '.jpg';
    }

    if (normalizedMimeType === 'application/pdf') {
      return '.pdf';
    }

    return '.bin';
  }

  sanitizeFileName(fileName: string, fallback: string): string {
    const cleaned = fileName.replace(/[^\w.\-() ]+/g, '_').trim();
    return cleaned || fallback;
  }
}

export const defaultMediaBufferDownloader: MediaBufferDownloader = async (message, socket) => {
  const baileys = await loadBaileys();
  const downloaded = await baileys.downloadMediaMessage(
    message,
    'buffer',
    {},
    {
      logger: baileysLogger,
      reuploadRequest: socket.updateMediaMessage,
    },
  );

  if (!Buffer.isBuffer(downloaded)) {
    throw new BadRequestError('WhatsApp media download did not return a buffer');
  }

  return downloaded;
};

export const mediaService = new MediaService();

export const resolveMediaType = (mimeType: string): WhatsAppMediaType | null => {
  const normalizedMimeType = mimeType.toLowerCase();

  if (normalizedMimeType.startsWith('image/')) {
    return 'image';
  }

  if (normalizedMimeType === 'application/pdf') {
    return 'pdf';
  }

  if (
    normalizedMimeType.startsWith('application/') ||
    normalizedMimeType.startsWith('text/')
  ) {
    return 'document';
  }

  return null;
};
