export const SMART_SEARCH_COLLECTIONS = [
  'placements',
  'internships',
  'student_achievements',
  'faculty_achievements',
  'completed_event_reports',
  'publications',
  'patents',
] as const;

export type SmartSearchCollection = (typeof SMART_SEARCH_COLLECTIONS)[number];

export const DEFAULT_SMART_SEARCH_COLLECTIONS: readonly SmartSearchCollection[] =
  SMART_SEARCH_COLLECTIONS;

export const formatCollectionsForPrompt = (
  collections: readonly SmartSearchCollection[] = DEFAULT_SMART_SEARCH_COLLECTIONS,
): string => collections.join('\n');
