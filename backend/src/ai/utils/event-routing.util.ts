import type { RecordCategory } from '../../database/enums';
import { WhatsAppIncomingMessage } from '../../whatsapp/types';
import { isPdfMessage, isImageMessage } from './media-detection.util';

/** Department-organized events → AI event report session */
const EVENT_KEYWORD_PATTERN =
  /\b(workshop|industrial visit|industry visit|field visit|seminar|conference|guest lecture|training program|department event|symposium|webinar|fdp|faculty development|site visit|expert talk|organized hackathon|conducted hackathon|hosted hackathon|hackathon conducted|hackathon organized)\b/i;

/** Student / faculty outcomes → standard AI pipeline (not department event reports) */
const STUDENT_OUTCOME_PATTERN =
  /\b(placed at|got placed|secured placement|campus placement|campus drive|offer letter|job offer|joining letter|internship at|intern at|internship offer|nptel|fellowship|pre-doctoral|doctoral fellowship|research paper|student research|publication in|certification|patent filed|best paper award|received award|participation certificate|certificate of participation|workshop certificate|seminar certificate|fdp certificate)\b/i;

/** Strong placement signals for event-report reclassification */
const PLACEMENT_PATTERN =
  /\b(placement|placed at|campus placement|offer letter|job offer|joining date|package|lpa|ctc|salary|hired at|nptel|fellowship|pre-doctoral|achievement recognition)\b/i;

const INTERNSHIP_PATTERN =
  /\b(internship|intern at|internship offer|summer intern|stipend)\b/i;

const RESEARCH_ACHIEVEMENT_PATTERN =
  /\b(student research|research achievement|research paper|published paper|journal publication|conference paper)\b/i;

const FACULTY_ATTENDANCE_PATTERN =
  /\b(attended|participated in|completed)\b.{0,48}\b(workshop|seminar|fdp|conference|training program)\b/i;

const EVENT_REPORT_TYPE_PATTERN =
  /\b(workshop|seminar|industrial visit|industry visit|field visit|site visit|guest lecture|training program|fdp|faculty development)\b/i;

const PLACEMENT_MEDIA_FILENAME_PATTERN =
  /\b(placement|offer letter|offer_letter|job offer|campus placement|joining|lpa|ctc|nptel|fellowship|internship|intern_letter|research paper|research_paper|certificate|achievement)\b/i;

const EVENT_MEDIA_FILENAME_PATTERN =
  /\b(workshop|seminar|industrial|industry visit|field visit|site visit|brochure|event report|fdp|guest lecture|training program)\b/i;

export const getMessageCombinedText = (message: WhatsAppIncomingMessage): string =>
  [message.message, message.mediaMetadata?.caption, message.mediaMetadata?.fileName]
    .filter(Boolean)
    .join('\n')
    .trim();

const getCombinedHaystack = (fields: {
  reportType?: string | null;
  title?: string | null;
  organization?: string | null;
  summary?: string | null;
  aiGeneratedReport?: string | null;
  keywords?: string[] | null;
}): string =>
  [
    fields.reportType,
    fields.title,
    fields.organization,
    fields.summary,
    fields.aiGeneratedReport,
    ...(fields.keywords ?? []),
  ]
    .filter(Boolean)
    .join(' ');

export const isStudentOutcomeMessage = (message: WhatsAppIncomingMessage): boolean => {
  const text = getMessageCombinedText(message);
  if (!text) {
    return false;
  }

  if (STUDENT_OUTCOME_PATTERN.test(text)) {
    return true;
  }

  if (FACULTY_ATTENDANCE_PATTERN.test(text)) {
    return true;
  }

  return false;
};

export const isPlacementOrInternshipMedia = (message: WhatsAppIncomingMessage): boolean => {
  const text = getMessageCombinedText(message);
  if (PLACEMENT_PATTERN.test(text) || INTERNSHIP_PATTERN.test(text)) {
    return true;
  }

  const fileName = message.mediaMetadata?.fileName ?? '';
  return PLACEMENT_MEDIA_FILENAME_PATTERN.test(fileName);
};

export const isDepartmentEventMessage = (message: WhatsAppIncomingMessage): boolean => {
  const text = getMessageCombinedText(message);

  if (!text) {
    if (isPdfMessage(message)) {
      const fileName = message.mediaMetadata?.fileName ?? '';
      return EVENT_MEDIA_FILENAME_PATTERN.test(fileName) && !PLACEMENT_MEDIA_FILENAME_PATTERN.test(fileName);
    }
    return false;
  }

  if (isStudentOutcomeMessage(message)) {
    return false;
  }

  if (isPlacementOrInternshipMedia(message)) {
    return false;
  }

  return EVENT_KEYWORD_PATTERN.test(text);
};

export const shouldStartEventReportSession = (message: WhatsAppIncomingMessage): boolean => {
  if (isStudentOutcomeMessage(message)) {
    return false;
  }

  if (isPlacementOrInternshipMedia(message)) {
    return false;
  }

  if (isImageMessage(message)) {
    return false;
  }

  if (isDepartmentEventMessage(message)) {
    return true;
  }

  if (isPdfMessage(message)) {
    const fileName = message.mediaMetadata?.fileName ?? '';
    if (EVENT_MEDIA_FILENAME_PATTERN.test(fileName) && !PLACEMENT_MEDIA_FILENAME_PATTERN.test(fileName)) {
      return true;
    }
  }

  return false;
};

export const shouldAppendToEventReportSession = (
  message: WhatsAppIncomingMessage,
  hasActiveSession: boolean,
): boolean => {
  if (hasActiveSession) {
    return !isPlacementOrInternshipMedia(message);
  }

  return shouldStartEventReportSession(message);
};

export type PipelineRoute = 'standard' | 'event-session';

export const resolvePipelineRoute = (
  message: WhatsAppIncomingMessage,
  hasActiveSession: boolean,
): PipelineRoute => {
  if (shouldAppendToEventReportSession(message, hasActiveSession)) {
    return 'event-session';
  }

  return 'standard';
};

export interface EventReportInferenceInput {
  reportType?: string | null;
  title?: string | null;
  organization?: string | null;
  summary?: string | null;
  aiGeneratedReport?: string | null;
  keywords?: string[] | null;
}

export const inferCategoryFromEventReport = (
  fields: EventReportInferenceInput,
): RecordCategory => {
  const haystack = getCombinedHaystack(fields);
  const reportType = String(fields.reportType ?? '').toLowerCase();

  if (
    /industrial visit|industry visit|field visit|site visit/.test(haystack) ||
    reportType.includes('industrial')
  ) {
    return 'Industrial Visit';
  }

  if (/seminar|symposium|webinar/.test(haystack) || reportType.includes('seminar')) {
    return 'Seminar';
  }

  if (
    /workshop|training program|fdp|faculty development|guest lecture/.test(haystack) ||
    reportType.includes('workshop') ||
    reportType.includes('training') ||
    reportType.includes('fdp')
  ) {
    return 'Workshop';
  }

  if (INTERNSHIP_PATTERN.test(haystack)) {
    return 'Internship';
  }

  if (PLACEMENT_PATTERN.test(haystack)) {
    return 'Placement';
  }

  if (RESEARCH_ACHIEVEMENT_PATTERN.test(haystack) || reportType.includes('research')) {
    return 'Research';
  }

  if (EVENT_REPORT_TYPE_PATTERN.test(haystack)) {
    if (/seminar|symposium/.test(haystack)) {
      return 'Seminar';
    }
    if (/industrial|industry visit|field visit|site visit/.test(haystack)) {
      return 'Industrial Visit';
    }
    return 'Workshop';
  }

  return 'Workshop';
};

export const mapReportTypeToCategory = (
  reportType: string,
): 'Workshop' | 'Industrial Visit' | 'Seminar' | 'Research' => {
  const normalized = reportType.toLowerCase();

  if (normalized.includes('industrial') || normalized.includes('field visit')) {
    return 'Industrial Visit';
  }

  if (normalized.includes('seminar') || normalized.includes('conference')) {
    return 'Seminar';
  }

  if (
    normalized.includes('research') ||
    normalized.includes('student achievement') ||
    normalized.includes('achievement report')
  ) {
    return 'Research';
  }

  if (normalized.includes('workshop') || normalized.includes('training') || normalized.includes('fdp')) {
    return 'Workshop';
  }

  return 'Workshop';
};
