export type DuplicateCollectionName =
  | 'placements'
  | 'internships'
  | 'student_achievements'
  | 'faculty_achievements'
  | 'completed_event_reports'
  | 'publications'
  | 'patents'
  | 'pending_records';

export interface DuplicateRecordCandidate {
  id: string;
  collection: DuplicateCollectionName;
  fields: Record<string, string | string[] | null>;
}

export interface DuplicateDetectionInput {
  category: string;
  extractedData: Record<string, unknown>;
}

export interface DuplicateDetectionResult {
  duplicate: boolean;
  similarityScore: number;
  matchingRecordId: string | null;
}

export interface DuplicateDetectionResponse {
  result: DuplicateDetectionResult;
}

export type ComparableFields = Record<string, string | string[] | null>;
