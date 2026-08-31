import { fetchExternalBuffer } from './safe-fetch.util';

export interface ActivityPhotographCandidate {
  caption: string;
  url: string;
}

export interface ResolvedActivityPhotograph {
  caption: string;
  buffer: Buffer;
}

const MAX_PHOTOS = 40;
const MAX_BYTES = 8 * 1024 * 1024;
const TIMEOUT_MS = 12_000;
const NON_IMAGE_EXTENSION = /\.(pdf|docx?|xlsx?|pptx?|txt|zip)(\?|$)/i;

export const firstNonEmpty = (...values: unknown[]): string => {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
    if (Array.isArray(value)) {
      const joined = value
        .filter((item): item is string => typeof item === 'string' && Boolean(item.trim()))
        .join(', ');
      if (joined) return joined;
    }
  }
  return '';
};

export const joinCaptionParts = (...parts: Array<string | undefined>): string =>
  parts.map((part) => part?.trim() ?? '').filter(Boolean).join(' – ');

const isLikelyRasterImageUrl = (url: string): boolean => {
  if (!url.startsWith('http://') && !url.startsWith('https://')) return false;
  if (NON_IMAGE_EXTENSION.test(url)) return false;
  return true;
};

const collectUrlStrings = (value: unknown): string[] => {
  if (typeof value === 'string' && value.trim()) {
    return [value.trim()];
  }
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (typeof item === 'string' && item.trim()) return [item.trim()];
    if (item && typeof item === 'object' && 'url' in item && typeof item.url === 'string') {
      return item.url.trim() ? [item.url.trim()] : [];
    }
    return [];
  });
};

export const extractRecordImageUrls = (record: Record<string, unknown>): string[] => {
  const urls = [
    ...collectUrlStrings(record.photos),
    ...collectUrlStrings(record.photoUrls),
  ];

  for (const field of ['certificateUrl', 'offerLetter', 'imageUrl'] as const) {
    const url = typeof record[field] === 'string' ? record[field].trim() : '';
    if (url && isLikelyRasterImageUrl(url)) {
      urls.push(url);
    }
  }

  return [...new Set(urls.filter(isLikelyRasterImageUrl))];
};

export const collectActivityPhotographCandidates = (
  tables: Array<{ sectionKey: string; heading: string; sourceRecords: Record<string, unknown>[] }>,
  buildCaption: (record: Record<string, unknown>, sectionKey: string, heading: string) => string,
): ActivityPhotographCandidate[] => {
  const candidates: ActivityPhotographCandidate[] = [];

  for (const table of tables) {
    for (const record of table.sourceRecords) {
      const caption = buildCaption(record, table.sectionKey, table.heading);
      for (const url of extractRecordImageUrls(record)) {
        candidates.push({ caption, url });
        if (candidates.length >= MAX_PHOTOS) {
          return candidates;
        }
      }
    }
  }

  return candidates;
};

export const resolveActivityPhotographs = async (
  candidates: ActivityPhotographCandidate[],
): Promise<ResolvedActivityPhotograph[]> => {
  const resolved: ResolvedActivityPhotograph[] = [];

  for (const candidate of candidates) {
    const fetched = await fetchExternalBuffer(candidate.url, {
      maxBytes: MAX_BYTES,
      timeoutMs: TIMEOUT_MS,
    });
    if (!fetched?.buffer.length) continue;
    resolved.push({
      caption: candidate.caption,
      buffer: fetched.buffer,
    });
  }

  return resolved;
};
