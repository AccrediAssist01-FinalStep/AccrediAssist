import { ensureCloudinaryConfigured, isCloudinaryConfigured } from '../config/cloudinary';

const CLOUDINARY_URL_PATTERN =
  /res\.cloudinary\.com\/[^/]+\/(image|raw)\/upload\/(?:v\d+\/)?(.+?)(?:\?.*)?$/i;

const DELIVERY_URL_TTL_SECONDS = 60 * 60;

const resolveDeliveryFormat = (
  publicId: string,
  resourceType: 'image' | 'raw',
): string => {
  const extension = publicId.split('.').pop()?.toLowerCase() ?? '';

  if (resourceType === 'raw' || extension === 'pdf') {
    return 'pdf';
  }

  if (extension === 'jpeg') {
    return 'jpg';
  }

  if (['jpg', 'png', 'gif', 'webp', 'svg'].includes(extension)) {
    return extension;
  }

  return 'jpg';
};

const resolveDeliveryPublicId = (
  publicId: string,
  resourceType: 'image' | 'raw',
): string => {
  // Cloudinary raw PDFs keep the extension in public_id; images omit it.
  if (resourceType === 'image') {
    return publicId.replace(/\.[^/.]+$/, '');
  }

  return publicId;
};

export const signCloudinaryDeliveryUrl = async (
  url: string | undefined,
): Promise<string | undefined> => {
  if (!url || !isCloudinaryConfigured() || !url.includes('cloudinary.com')) {
    return url;
  }

  const match = url.match(CLOUDINARY_URL_PATTERN);
  if (!match) {
    return url;
  }

  const [, resourceType, publicId] = match;
  const cloudinary = await ensureCloudinaryConfigured();
  const decodedPublicId = decodeURIComponent(publicId);
  const normalizedResourceType = resourceType.toLowerCase() as 'image' | 'raw';
  const deliveryPublicId = resolveDeliveryPublicId(decodedPublicId, normalizedResourceType);
  const format = resolveDeliveryFormat(decodedPublicId, normalizedResourceType);

  return cloudinary.utils.private_download_url(deliveryPublicId, format, {
    resource_type: normalizedResourceType,
    type: 'upload',
    expires_at: Math.floor(Date.now() / 1000) + DELIVERY_URL_TTL_SECONDS,
  });
};

export const signCloudinaryDeliveryUrls = async (
  urls: string[] | undefined,
): Promise<string[] | undefined> => {
  if (!urls?.length) {
    return urls;
  }

  return Promise.all(urls.map(async (url) => (await signCloudinaryDeliveryUrl(url)) ?? url));
};

export const withSignedCloudinaryMedia = async <
  T extends {
    generatedReportUrl?: string;
    photoUrls?: string[];
    certificateUrl?: string;
    photos?: string[];
    offerLetter?: string;
    imageUrl?: string;
  },
>(
  record: T,
): Promise<T> => {
  const [generatedReportUrl, photoUrls, certificateUrl, photos, offerLetter, imageUrl] =
    await Promise.all([
      signCloudinaryDeliveryUrl(record.generatedReportUrl),
      signCloudinaryDeliveryUrls(record.photoUrls),
      signCloudinaryDeliveryUrl(record.certificateUrl),
      signCloudinaryDeliveryUrls(record.photos),
      signCloudinaryDeliveryUrl(record.offerLetter),
      signCloudinaryDeliveryUrl(record.imageUrl),
    ]);

  return {
    ...record,
    ...(generatedReportUrl ? { generatedReportUrl } : {}),
    ...(photoUrls ? { photoUrls } : {}),
    ...(certificateUrl ? { certificateUrl } : {}),
    ...(photos ? { photos } : {}),
    ...(offerLetter ? { offerLetter } : {}),
    ...(imageUrl ? { imageUrl } : {}),
  };
};
