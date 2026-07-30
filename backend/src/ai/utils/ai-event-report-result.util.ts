import { AiEventReportResult } from '../../types/eventReportSession.types';

const toStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
};

const toNullableString = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const toNullableNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && !Number.isNaN(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value.replace(/[^\d.]/g, ''));
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
};

const normalizeObservations = (
  value: unknown,
): Array<{ reference: string; observation: string }> => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const record = item as Record<string, unknown>;
      const reference = toNullableString(record.reference);
      const observation = toNullableString(record.observation);
      if (!reference || !observation) return null;
      return { reference, observation };
    })
    .filter((item): item is { reference: string; observation: string } => item !== null);
};

export const normalizeAiEventReportResult = (payload: unknown): AiEventReportResult => {
  const record =
    payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : {};

  const confidence = toNullableNumber(record.confidenceScore);

  return {
    reportType: toNullableString(record.reportType) ?? 'Department Event',
    title: toNullableString(record.title),
    date: toNullableString(record.date),
    time: toNullableString(record.time),
    venue: toNullableString(record.venue),
    department: toNullableString(record.department),
    coordinator: toNullableString(record.coordinator),
    chiefGuest: toNullableString(record.chiefGuest),
    speaker: toNullableString(record.speaker),
    organization: toNullableString(record.organization),
    participants: toNullableNumber(record.participants),
    objectives: toStringArray(record.objectives),
    activitiesConducted: toStringArray(record.activitiesConducted),
    learningOutcomes: toStringArray(record.learningOutcomes),
    keyHighlights: toStringArray(record.keyHighlights),
    achievements: toStringArray(record.achievements),
    futureScope: toNullableString(record.futureScope),
    conclusion: toNullableString(record.conclusion),
    summary: toNullableString(record.summary),
    keywords: toStringArray(record.keywords),
    missingFields: toStringArray(record.missingFields),
    confidenceScore: confidence === null ? 0 : Math.max(0, Math.min(100, confidence)),
    aiGeneratedReport: toNullableString(record.aiGeneratedReport) ?? '',
    validationNotes:
      toNullableString(record.validationNotes) ??
      'Report generated strictly from supplied WhatsApp evidence.',
    imageObservations: normalizeObservations(record.imageObservations),
    pdfObservations: normalizeObservations(record.pdfObservations),
  };
};
