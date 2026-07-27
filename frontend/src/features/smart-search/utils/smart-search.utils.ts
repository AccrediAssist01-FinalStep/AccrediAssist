import type { SearchResultItem } from '@/types/api-models';
import { COLLECTION_LABELS } from '../types';

export function formatCollectionLabel(collection: string): string {
  return COLLECTION_LABELS[collection] ?? collection.replace(/_/g, ' ');
}

export function formatFieldLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();
}

export function formatFieldValue(value: unknown): string {
  if (value == null || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(value));
  }
  return String(value);
}

export function getResultStatus(data?: Record<string, unknown>): string | null {
  if (!data) return null;
  const status = data.status ?? data.approvalStatus ?? data.recordStatus;
  return status != null ? String(status) : null;
}

export function getResultImageUrl(data?: Record<string, unknown>): string | null {
  if (!data) return null;

  const candidates = [
    data.imageUrl,
    data.photoUrl,
    data.certificateUrl,
    data.documentUrl,
    data.mediaUrl,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && /\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i.test(candidate)) {
      return candidate;
    }
  }

  const arrays = [data.certificates, data.mediaReferences, data.attachments];
  for (const arrayValue of arrays) {
    if (Array.isArray(arrayValue)) {
      const image = arrayValue.find(
        (item) => typeof item === 'string' && /\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i.test(item),
      );
      if (typeof image === 'string') return image;
    }
  }

  return null;
}

export function getResultDocuments(data?: Record<string, unknown>): string[] {
  if (!data) return [];

  const docs: string[] = [];
  const pushIfUrl = (value: unknown) => {
    if (typeof value === 'string' && /^https?:\/\//.test(value)) docs.push(value);
  };

  pushIfUrl(data.certificateUrl);
  pushIfUrl(data.documentUrl);

  for (const key of ['certificates', 'mediaReferences', 'attachments']) {
    const value = data[key];
    if (Array.isArray(value)) {
      value.forEach(pushIfUrl);
    }
  }

  return [...new Set(docs)];
}

export function getDisplayFields(data?: Record<string, unknown>): Array<{ key: string; label: string; value: string }> {
  if (!data) return [];

  const skip = new Set(['_id', '__v', 'isDeleted', 'score']);
  return Object.entries(data)
    .filter(([key, value]) => !skip.has(key) && value != null && value !== '')
    .slice(0, 24)
    .map(([key, value]) => ({
      key,
      label: formatFieldLabel(key),
      value: formatFieldValue(value),
    }));
}

export function getPrimaryColumn(item: SearchResultItem): string {
  const data = item.data;
  if (!data) return item.summary;

  const primary =
    data.studentName ??
    data.facultyName ??
    data.eventTitle ??
    data.paperTitle ??
    data.patentTitle ??
    data.title ??
    data.company;

  return primary != null ? String(primary) : item.summary.split(' · ')[0] ?? item.summary;
}

export function getSecondaryColumn(item: SearchResultItem): string {
  const parts = item.summary.split(' · ');
  return parts.slice(1).join(' · ') || '—';
}

export function exportResultsToCsv(items: SearchResultItem[], filename = 'accrediassist-search-results.csv'): void {
  if (items.length === 0) return;

  const rows = items.map((item) => ({
    collection: formatCollectionLabel(item.collection),
    summary: item.summary,
    recordId: item.recordId,
    score: item.score ?? '',
    ...(item.data ?? {}),
  }));

  const headers = Array.from(
    rows.reduce((set, row) => {
      Object.keys(row).forEach((key) => set.add(key));
      return set;
    }, new Set<string>()),
  );

  const escape = (value: unknown) => {
    const stringValue = formatFieldValue(value).replace(/"/g, '""');
    return `"${stringValue}"`;
  };

  const csv = [
    headers.join(','),
    ...rows.map((row) => headers.map((header) => escape(row[header as keyof typeof row])).join(',')),
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function filterResults(items: SearchResultItem[], filter: string): SearchResultItem[] {
  if (!filter.trim()) return items;
  const needle = filter.trim().toLowerCase();
  return items.filter(
    (item) =>
      item.summary.toLowerCase().includes(needle) ||
      item.collection.toLowerCase().includes(needle) ||
      JSON.stringify(item.data ?? {}).toLowerCase().includes(needle),
  );
}

export function sortResultsClient(
  items: SearchResultItem[],
  sort: 'latest' | 'oldest',
): SearchResultItem[] {
  return [...items].sort((a, b) => {
    const aDate = new Date(String(a.data?.createdAt ?? a.data?.updatedAt ?? 0)).getTime();
    const bDate = new Date(String(b.data?.createdAt ?? b.data?.updatedAt ?? 0)).getTime();
    return sort === 'latest' ? bDate - aDate : aDate - bDate;
  });
}

const DISMISSED_HISTORY_KEY = 'accrediassist-dismissed-search-history';

export function getDismissedHistoryIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(DISMISSED_HISTORY_KEY) ?? '[]') as string[];
  } catch {
    return [];
  }
}

export function dismissHistoryId(id: string): void {
  if (typeof window === 'undefined') return;
  const current = getDismissedHistoryIds();
  if (!current.includes(id)) {
    localStorage.setItem(DISMISSED_HISTORY_KEY, JSON.stringify([...current, id]));
  }
}

export function formatShortDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
}

export function clearDismissedHistoryIds(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(DISMISSED_HISTORY_KEY);
}
