import { ensureCloudinaryConfigured, isCloudinaryConfigured } from '../../../config/cloudinary';
import { EventMediaItem } from '../../../types/eventReportSession.types';
import {
  ResolvedWorkshopImage,
  WorkshopReportGeneratorInput,
} from '../workshop-report.types';

const fetchBytes = async (url: string): Promise<Buffer | null> => {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    return Buffer.from(await response.arrayBuffer());
  } catch {
    return null;
  }
};

export const resolveWorkshopImages = async (
  input: WorkshopReportGeneratorInput,
): Promise<ResolvedWorkshopImage[]> => {
  const images = input.media.filter((item) => item.type === 'image');
  const placementMap = new Map<string, WorkshopImagePlacement>();

  input.structured.imagePlacements.forEach((placement) => {
    placementMap.set(placement.imageReference.toLowerCase(), placement);
  });

  const resolved: ResolvedWorkshopImage[] = [];

  for (const image of images) {
    const placement = placementMap.get(image.label.toLowerCase());
    const caption = placement?.caption ?? image.caption ?? image.observation ?? image.label;

    let bytes: Buffer | undefined;
    const metadata = image as EventMediaItem & { publicId?: string; contentBase64?: string };

    if (metadata.contentBase64) {
      bytes = Buffer.from(metadata.contentBase64, 'base64');
    } else if (metadata.publicId && isCloudinaryConfigured()) {
      const cloudinary = await ensureCloudinaryConfigured();
      const expiresAt = Math.floor(Date.now() / 1000) + 3600;
      const deliveryPublicId = metadata.publicId.includes('.')
        ? metadata.publicId.replace(/\.[^/.]+$/, '')
        : metadata.publicId;
      const privateUrl = cloudinary.utils.private_download_url(deliveryPublicId, 'jpg', {
        resource_type: 'image',
        type: 'upload',
        expires_at: expiresAt,
      });
      bytes = (await fetchBytes(privateUrl)) ?? undefined;
    } else {
      bytes = (await fetchBytes(image.url)) ?? undefined;
    }

    resolved.push({
      label: image.label,
      url: image.url,
      caption,
      bytes,
      section: 'evidenceGallery',
    });
  }

  return resolved;
};

export const getImagesForSection = (
  images: ResolvedWorkshopImage[],
  section: WorkshopImageSection,
): ResolvedWorkshopImage[] => images.filter((image) => image.section === section);
