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

export const isImageMediaUrl = (url: string): boolean =>
  /\.(png|jpe?g|gif|webp|svg|bmp)(\?.*)?$/i.test(url) ||
  /\/image\/upload\//i.test(url);

export const isPdfMediaUrl = (url: string): boolean => /\.pdf(\?.*)?$/i.test(url);

export const collectRecordMediaUrls = (record: FeatureRecord): string[] => {
  const urls = new Set<string>();

  for (const key of RECORD_MEDIA_FIELD_KEYS) {
    const value = record[key];
    if (typeof value === 'string' && value.startsWith('http')) {
      urls.add(value);
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === 'string' && item.startsWith('http')) {
          urls.add(item);
        }
      }
    }
  }

  return [...urls];
};
