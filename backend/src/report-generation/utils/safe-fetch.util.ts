import { URL } from 'url';
import { logger } from '../../utils/logger';

const BLOCKED_HOSTNAMES = new Set(['localhost', '127.0.0.1', '0.0.0.0', '::1', '[::1]']);

const isPrivateIpv4 = (hostname: string): boolean => {
  const parts = hostname.split('.').map(Number);
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) {
    return false;
  }

  const [a, b] = parts;
  return (
    a === 10 ||
    a === 127 ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 169 && b === 254) ||
    a === 0
  );
};

/** Validates URLs before server-side fetch to reduce SSRF risk. */
export const isSafeExternalFetchUrl = (urlString: string): boolean => {
  try {
    const parsed = new URL(urlString);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return false;
    }

    const hostname = parsed.hostname.toLowerCase();
    if (BLOCKED_HOSTNAMES.has(hostname)) {
      return false;
    }

    if (isPrivateIpv4(hostname)) {
      return false;
    }

    if (hostname.endsWith('.local') || hostname.endsWith('.internal')) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
};

export const fetchExternalBuffer = async (
  url: string,
  options: { maxBytes: number; timeoutMs: number },
): Promise<{ buffer: Buffer; contentType: string } | null> => {
  if (!isSafeExternalFetchUrl(url)) {
    logger.warn('Blocked unsafe external fetch URL', { url });
    return null;
  }

  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(options.timeoutMs) });
    if (!response.ok) {
      return null;
    }

    const contentType = response.headers.get('content-type') ?? '';
    if (!contentType.startsWith('image/')) {
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    if (arrayBuffer.byteLength > options.maxBytes) {
      return null;
    }

    return {
      buffer: Buffer.from(arrayBuffer),
      contentType,
    };
  } catch (error) {
    logger.warn('External fetch failed', {
      url,
      reason: error instanceof Error ? error.message : 'unknown',
    });
    return null;
  }
};

export const mapImageContentTypeToDocxType = (
  contentType: string,
): 'png' | 'jpg' | 'gif' | 'bmp' | null => {
  const normalized = contentType.toLowerCase();
  if (normalized.includes('png')) return 'png';
  if (normalized.includes('jpeg') || normalized.includes('jpg')) return 'jpg';
  if (normalized.includes('gif')) return 'gif';
  if (normalized.includes('bmp')) return 'bmp';
  return null;
};
