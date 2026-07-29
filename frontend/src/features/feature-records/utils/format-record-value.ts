import type { FeatureColumnFormat } from '../types';

export function formatRecordValue(value: unknown, format: FeatureColumnFormat = 'text'): string {
  if (value === null || value === undefined || value === '') {
    return '—';
  }

  if (format === 'date') {
    const date = new Date(String(value));
    if (Number.isNaN(date.getTime())) {
      return String(value);
    }
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  if (format === 'list') {
    if (Array.isArray(value)) {
      return value.length > 0 ? value.join(', ') : '—';
    }
    return String(value);
  }

  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(', ') : '—';
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return String(value);
}
