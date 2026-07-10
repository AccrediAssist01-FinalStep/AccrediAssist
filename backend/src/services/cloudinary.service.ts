import { ensureCloudinaryConfigured, isCloudinaryConfigured } from '../config/cloudinary';
import { BadRequestError, InternalServerError } from '../utils/errors';
import { WhatsAppMediaType } from '../whatsapp/types';

export interface CloudinaryUploadInput {
  filePath: string;
  fileName: string;
  mediaType: WhatsAppMediaType;
  folder?: string;
}

export interface CloudinaryUploadResult {
  secureUrl: string;
  publicId: string;
  resourceType: 'image' | 'raw';
  bytes: number;
}

export type CloudinaryUploadHandler = (
  input: CloudinaryUploadInput,
) => Promise<CloudinaryUploadResult>;

export class CloudinaryService {
  constructor(private uploadHandler?: CloudinaryUploadHandler) {}

  isConfigured(): boolean {
    return isCloudinaryConfigured();
  }

  async uploadWhatsAppMedia(input: CloudinaryUploadInput): Promise<CloudinaryUploadResult> {
    if (this.uploadHandler) {
      return this.uploadHandler(input);
    }

    if (!this.isConfigured()) {
      throw new BadRequestError('Cloudinary is not configured');
    }

    const cloudinary = await ensureCloudinaryConfigured();
    const resourceType = input.mediaType === 'image' ? 'image' : 'raw';
    const folder = input.folder ?? 'accrediassist/whatsapp';

    const result = await cloudinary.uploader.upload(input.filePath, {
      folder,
      resource_type: resourceType,
      use_filename: true,
      unique_filename: true,
      overwrite: false,
    });

    if (!result.secure_url) {
      throw new InternalServerError('Cloudinary upload did not return a secure URL');
    }

    return {
      secureUrl: result.secure_url,
      publicId: result.public_id,
      resourceType,
      bytes: result.bytes ?? 0,
    };
  }
}

export const cloudinaryService = new CloudinaryService();
