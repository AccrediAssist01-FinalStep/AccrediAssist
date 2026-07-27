import type { ChartGenerationResult, StandardChart } from '../interfaces/chart.interface';

interface CacheEntry {
  expiresAt: number;
  result: ChartGenerationResult;
}

const DEFAULT_TTL_MS = 60_000;

const cache = new Map<string, CacheEntry>();

const stableStringify = (value: unknown): string => JSON.stringify(value, (_key, val) => {
  if (val instanceof Date) {
    return val.toISOString();
  }
  return val;
});

export const buildChartCacheKey = (
  scope: string,
  reportType: string | 'all',
  filters: unknown,
  modules: string[],
): string => `${scope}:${reportType}:${stableStringify(filters)}:${modules.join(',')}`;

export const getCachedChartResult = (key: string): ChartGenerationResult | null => {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return {
    ...entry.result,
    fromCache: true,
  };
};

export const setCachedChartResult = (
  key: string,
  result: ChartGenerationResult,
  ttlMs = DEFAULT_TTL_MS,
): void => {
  cache.set(key, {
    expiresAt: Date.now() + ttlMs,
    result: { ...result, fromCache: false },
  });
};

export const clearChartCache = (): void => {
  cache.clear();
};

export const getChartCacheSize = (): number => cache.size;

/** @internal test helper */
export const __setChartCacheEntry = (key: string, charts: StandardChart[], ttlMs = DEFAULT_TTL_MS): void => {
  setCachedChartResult(key, { charts, generatedAt: new Date(), fromCache: false }, ttlMs);
};
