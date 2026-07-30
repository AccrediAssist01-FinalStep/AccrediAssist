import type { FeatureRecord } from '../types';

export const RECORD_MEDIA_FIELD_KEYS = [
  'certificateUrl',
  'photos',
  'photoUrls',
  'generatedReportUrl',
  'documentUrl',
  'offerLetter',
] as const;

export type RecordMediaFieldKey = (typeof RECORD_MEDIA_FIELD_KEYS)[number];

const MEDIA_FIELD_KEY_SET = new Set<string>(RECORD_MEDIA_FIELD_KEYS);

export const isRecordMediaField = (key: string): key is RecordMediaFieldKey =>
  MEDIA_FIELD_KEY_SET.has(key);

export const isImageMediaUrl = (url: string): boolean => {
  if (isPdfMediaUrl(url)) {
    return false;
  }

  return (
    /\.(png|jpe?g|gif|webp|svg|bmp)(\?|&|$)/i.test(url) ||
    /\/image\/(upload|download)\//i.test(url) ||
    /[?&]format=(png|jpe?g|gif|webp|svg|bmp)/i.test(url)
  );
};

export const isPdfMediaUrl = (url: string): boolean =>
  /\.pdf(\?|&|$)/i.test(url) ||
  /\/raw\/(upload|download)\//i.test(url) ||
  /[?&]format=pdf/i.test(url);

/** Cloudinary PDFs uploaded before the raw-resource fix used /image/upload/ and return 401 in browsers. */
export const normalizePdfMediaUrl = (url: string): string => {
  if (!isPdfMediaUrl(url)) {
    return url;
  }

  if (/\/image\/upload\//i.test(url) && /\.pdf(\?.*)?$/i.test(url)) {
    return url.replace('/image/upload/', '/raw/upload/');
  }

  return url;
};

export const collectRecordMediaUrls = (record: FeatureRecord): string[] => {
  const urls = new Set<string>();

  for (const key of RECORD_MEDIA_FIELD_KEYS) {
    const value = record[key];
    if (typeof value === 'string' && value.startsWith('http')) {
      urls.add(normalizePdfMediaUrl(value));
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === 'string' && item.startsWith('http')) {
          urls.add(normalizePdfMediaUrl(item));
        }
      }
    }
  }

  return [...urls];
};
