import type { EditableRecordField } from '../config/editable-record-fields.config';

export const toDateInputValue = (value: unknown): string => {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
};

export const buildFormValues = (
  fields: EditableRecordField[],
  source: Record<string, unknown> = {},
): Record<string, string> => {
  const values: Record<string, string> = {};
  for (const field of fields) {
    const raw = source[field.key];
    if (field.type === 'date') {
      values[field.key] = toDateInputValue(raw);
    } else if (Array.isArray(raw)) {
      values[field.key] = raw.join(', ');
    } else if (raw == null) {
      values[field.key] = '';
    } else {
      values[field.key] = String(raw);
    }
  }
  return values;
};

export const buildRecordPayload = (
  formValues: Record<string, string>,
  fields: EditableRecordField[],
): Record<string, unknown> => {
  const payload: Record<string, unknown> = {};

  for (const field of fields) {
    const value = formValues[field.key]?.trim() ?? '';
    if (!value && field.type === 'date') {
      continue;
    }
    if (!value && field.type !== 'date') {
      if (field.key === 'inventors') {
        continue;
      }
      payload[field.key] = value;
      continue;
    }
    if (field.type === 'date') {
      payload[field.key] = new Date(`${value}T00:00:00.000Z`).toISOString();
    } else if (field.key === 'inventors') {
      payload[field.key] = value.split(',').map((item) => item.trim()).filter(Boolean);
    } else {
      payload[field.key] = value;
    }
  }

  return payload;
};

export const validateRequiredFields = (
  formValues: Record<string, string>,
  fields: EditableRecordField[],
): string | null => {
  for (const field of fields) {
    if (!field.required) continue;
    const value = formValues[field.key]?.trim() ?? '';
    if (!value) {
      return `${field.label} is required`;
    }
  }
  return null;
};
