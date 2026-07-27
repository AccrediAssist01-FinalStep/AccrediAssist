import type { SearchRequest } from '@/services/search.service';

export type SearchSort = 'latest' | 'oldest';

export interface SmartSearchState {
  query: string;
  page: number;
  limit: number;
  sort: SearchSort;
  collection: string;
  tableFilter: string;
}

export const DEFAULT_SEARCH_STATE: SmartSearchState = {
  query: '',
  page: 1,
  limit: 10,
  sort: 'latest',
  collection: 'all',
  tableFilter: '',
};

export interface SearchSuggestion {
  label: string;
  query: string;
}

export const SEARCH_SUGGESTIONS: SearchSuggestion[] = [
  { label: 'Placements', query: 'Students placed in TCS' },
  { label: 'Internships', query: 'Internships completed in 2026' },
  { label: 'Faculty Achievements', query: 'Faculty achievements in research' },
  { label: 'Student Achievements', query: 'Student achievements in hackathons' },
  { label: 'Publications', query: 'Faculty publications in AI' },
  { label: 'Patents', query: 'Patents filed by faculty' },
  { label: 'Completed Event Reports', query: 'Completed workshops this year' },
];

export const PLACEHOLDER_EXAMPLES = [
  'Students placed in TCS',
  'Faculty publications in AI',
  'Internships completed in 2026',
  'Completed workshops',
  'Student achievements',
];

export const COLLECTION_LABELS: Record<string, string> = {
  placements: 'Placements',
  internships: 'Internships',
  student_achievements: 'Student Achievements',
  faculty_achievements: 'Faculty Achievements',
  completed_event_reports: 'Completed Event Reports',
  publications: 'Publications',
  patents: 'Patents',
};

export function toSearchRequest(state: SmartSearchState): SearchRequest {
  return {
    query: state.query.trim(),
    page: state.page,
    limit: state.limit,
    sort: state.sort,
    ...(state.collection !== 'all' ? { collection: state.collection } : {}),
  };
}
