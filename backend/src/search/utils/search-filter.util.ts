import { FilterQuery } from 'mongoose';
import { SmartSearchCollection } from '../config/search-collections.config';
import {
  FULL_TEXT_FILTER_KEYS,
  SEARCH_COLLECTION_CONFIG,
} from '../config/search-execution.config';
import { SMART_SEARCH_COLLECTION_FIELDS } from '../config/search-fields.config';

const escapeRegex = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildYearRange = (year: number): { $gte: Date; $lte: Date } => ({
  $gte: new Date(Date.UTC(year, 0, 1)),
  $lte: new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999)),
});

const buildRegexFilter = (value: unknown): { $regex: string; $options: string } | undefined => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  return {
    $regex: escapeRegex(String(value).trim()),
    $options: 'i',
  };
};

const extractFullTextTerm = (filters: Record<string, unknown>): string | undefined => {
  for (const key of FULL_TEXT_FILTER_KEYS) {
    const value = filters[key];

    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return undefined;
};

export const buildSearchMongoFilter = (
  collection: SmartSearchCollection,
  filters: Record<string, unknown> = {},
  department?: string,
): { filter: FilterQuery<Record<string, unknown>>; useTextSearch: boolean; textTerm?: string } => {
  const config = SEARCH_COLLECTION_CONFIG[collection];
  const allowedFields = new Set(SMART_SEARCH_COLLECTION_FIELDS[collection]);
  const mongoFilter: FilterQuery<Record<string, unknown>> = {};
  const fullTextTerm = extractFullTextTerm(filters);

  if (department?.trim() && allowedFields.has('department')) {
    mongoFilter.department = buildRegexFilter(department.trim());
  }

  for (const [key, value] of Object.entries(filters)) {
    if (FULL_TEXT_FILTER_KEYS.includes(key as (typeof FULL_TEXT_FILTER_KEYS)[number])) {
      continue;
    }

    if (key === 'year') {
      const year = Number(value);

      if (!Number.isNaN(year) && year >= 1900 && year <= 2100) {
        mongoFilter[config.dateField] = buildYearRange(year);
      }

      continue;
    }

    if (!allowedFields.has(key as (typeof SMART_SEARCH_COLLECTION_FIELDS)[SmartSearchCollection][number])) {
      continue;
    }

    if (key === 'authors' || key === 'inventors') {
      const regex = buildRegexFilter(value);

      if (regex) {
        mongoFilter[key] = regex;
      }

      continue;
    }

    const regex = buildRegexFilter(value);

    if (regex) {
      mongoFilter[key] = regex;
    }
  }

  if (fullTextTerm) {
    return {
      filter: mongoFilter,
      useTextSearch: true,
      textTerm: fullTextTerm,
    };
  }

  return {
    filter: mongoFilter,
    useTextSearch: false,
  };
};

export const buildFullTextFilter = (
  textTerm: string,
): FilterQuery<Record<string, unknown>> => ({
  $text: { $search: textTerm },
});

export const buildRegexFullTextFilter = (
  collection: SmartSearchCollection,
  textTerm: string,
): FilterQuery<Record<string, unknown>> => {
  const regex = buildRegexFilter(textTerm);
  const fields = SEARCH_COLLECTION_CONFIG[collection].textSearchFields;

  if (!regex) {
    return {};
  }

  return {
    $or: fields.map((field) => ({ [field]: regex })),
  };
};
