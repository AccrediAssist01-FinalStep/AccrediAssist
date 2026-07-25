export interface ExtractionResult {
  title: string | null;
  description: string | null;
  categoryHint: string | null;
  studentNames: string[] | null;
  facultyNames: string[] | null;
  company: string | null;
  organization: string | null;
  eventName: string | null;
  eventType: string | null;
  achievementType: string | null;
  publicationTitle: string | null;
  patentTitle: string | null;
  internship: string | null;
  placement: string | null;
  certificates: string[] | null;
  mediaReferences: string[] | null;
  date: string | null;
  location: string | null;
  confidence: number | null;
}

export interface ExtractionAgentResponse {
  result: ExtractionResult;
  model: string;
  provider: 'gemini';
}
