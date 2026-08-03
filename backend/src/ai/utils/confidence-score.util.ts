const toNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && !Number.isNaN(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value.replace(/[^\d.]/g, ''));
    return Number.isNaN(parsed) ? null : parsed;
  }

  return null;
};

/** Normalize AI confidence to a 0–100 integer (handles Gemini returning 0.95 instead of 95). */
export const normalizeConfidenceScore = (value: unknown): number => {
  const parsed = toNumber(value);
  if (parsed === null) {
    return 0;
  }

  let score = parsed;

  // Fractional scores from Gemini (e.g. 0.85, 0.95) mean 85%, 95%.
  if (score > 0 && score <= 1) {
    score *= 100;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
};
