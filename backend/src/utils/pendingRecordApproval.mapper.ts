import {
  ACHIEVEMENT_TYPES,
  AchievementType,
  EVENT_TYPES,
  EventType,
  PATENT_STATUSES,
  PatentStatus,
  RecordCategory,
} from '../database/enums';
import { IPendingRecord } from '../types/pendingRecord.types';
import { PendingApprovalTargetModule } from '../types/pendingRecordApproval.types';
import { toStringArray, toStringValue } from '../ai/utils/duplicate-similarity.util';
import { BadRequestError } from './errors';
import { NEWS_ARTICLE_CATEGORIES, NewsArticleCategory } from '../types/news.types';

const ACHIEVEMENT_TYPE_SET = new Set<string>(ACHIEVEMENT_TYPES);
const EVENT_TYPE_SET = new Set<string>(EVENT_TYPES);
const PATENT_STATUS_SET = new Set<string>(PATENT_STATUSES);

const CATEGORY_TARGET_MAP: Partial<Record<RecordCategory, PendingApprovalTargetModule>> = {
  'Student Achievement': 'StudentAchievement',
  Sports: 'StudentAchievement',
  Cultural: 'StudentAchievement',
  'Faculty Achievement': 'FacultyAchievement',
  Placement: 'Placement',
  Internship: 'Internship',
  Publication: 'Publication',
  Patent: 'Patent',
  Workshop: 'CompletedEventReport',
  Seminar: 'CompletedEventReport',
  'Industrial Visit': 'CompletedEventReport',
  Certification: 'StudentAchievement',
  Research: 'StudentAchievement',
  News: 'News',
};

const EVENT_CATEGORY_MAP: Partial<Record<RecordCategory, EventType>> = {
  Workshop: 'Workshop',
  Seminar: 'Seminar',
  'Industrial Visit': 'Industrial Visit',
};

const parseDate = (value: unknown): Date | undefined => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return undefined;
};

const requireValue = (value: string | null, field: string): string => {
  if (!value) {
    throw new BadRequestError(`Cannot approve pending record: ${field} is required`);
  }

  return value;
};

const getExtractedData = (record: IPendingRecord): Record<string, unknown> =>
  record.extractedData ?? {};

const getStructuredData = (data: Record<string, unknown>): Record<string, unknown> =>
  typeof data.structuredData === 'object' && data.structuredData !== null
    ? (data.structuredData as Record<string, unknown>)
    : {};

const getStudentName = (data: Record<string, unknown>): string | null =>
  toStringArray(data.studentNames)?.[0] ??
  toStringValue(data.studentName) ??
  toStringValue(getStructuredData(data).studentName);

const getFacultyName = (data: Record<string, unknown>): string | null =>
  toStringArray(data.facultyNames)?.[0] ??
  toStringValue(data.facultyName) ??
  toStringValue(getStructuredData(data).facultyName);

const getTitle = (record: IPendingRecord): string => {
  const data = getExtractedData(record);

  return (
    toStringValue(data.title) ??
    toStringValue(data.eventName) ??
    toStringValue(data.publicationTitle) ??
    toStringValue(data.patentTitle) ??
    record.originalMessage.trim().slice(0, 300)
  );
};

const normalizeAchievementType = (
  value: unknown,
  category: RecordCategory,
  fallback: AchievementType,
): AchievementType => {
  const raw = toStringValue(value);
  if (raw && ACHIEVEMENT_TYPE_SET.has(raw)) {
    return raw as AchievementType;
  }

  if (category === 'Sports') {
    return 'Sports';
  }

  if (category === 'Cultural') {
    return 'Cultural';
  }

  if (category === 'Certification') {
    return 'Certification';
  }

  if (category === 'Research') {
    return 'Research';
  }

  return fallback;
};

const normalizeEventType = (
  category: RecordCategory,
  extractedEventType: unknown,
): EventType => {
  const raw = toStringValue(extractedEventType);
  if (raw && EVENT_TYPE_SET.has(raw)) {
    return raw as EventType;
  }

  const mapped = EVENT_CATEGORY_MAP[category];
  if (mapped) {
    return mapped;
  }

  throw new BadRequestError(`Cannot approve pending record: unsupported event category "${category}"`);
};

const normalizePatentStatus = (value: unknown): PatentStatus => {
  const raw = toStringValue(value);
  if (raw && PATENT_STATUS_SET.has(raw)) {
    return raw as PatentStatus;
  }

  return 'Filed';
};

const sanitizeHttpUrl = (value: unknown): string | null => {
  const raw = toStringValue(value)?.trim();
  if (!raw || !/^https?:\/\/.+/.test(raw)) {
    return null;
  }

  return raw;
};

const getMediaUrl = (data: Record<string, unknown>): string | null =>
  sanitizeHttpUrl(data.media) ??
  sanitizeHttpUrl(
    (data.mediaMetadata as { secureUrl?: string } | null | undefined)?.secureUrl,
  );

const resolveRecordDate = (data: Record<string, unknown>): Date =>
  parseDate(data.date) ??
  parseDate(getStructuredData(data).date) ??
  parseDate(data.publicationDate) ??
  parseDate(data.eventDate) ??
  new Date();

const getCertificateUrl = (data: Record<string, unknown>): string | undefined =>
  sanitizeHttpUrl(toStringArray(data.certificates)?.[0]) ??
  getMediaUrl(data) ??
  sanitizeHttpUrl(toStringArray(data.mediaReferences)?.[0]) ??
  sanitizeHttpUrl(data.originalPdfUrl) ??
  undefined;

const getPhotoUrls = (data: Record<string, unknown>): string[] => {
  const certificates = (toStringArray(data.certificates) ?? [])
    .map(sanitizeHttpUrl)
    .filter((url): url is string => Boolean(url));
  const mediaReferences = (toStringArray(data.mediaReferences) ?? [])
    .map(sanitizeHttpUrl)
    .filter((url): url is string => Boolean(url));
  const mediaUrl = getMediaUrl(data);
  const pdfUrl = sanitizeHttpUrl(data.originalPdfUrl);
  const urls = [
    ...certificates,
    ...mediaReferences,
    ...(mediaUrl ? [mediaUrl] : []),
    ...(pdfUrl ? [pdfUrl] : []),
  ];
  return [...new Set(urls)];
};

const resolveDocumentUrl = (data: Record<string, unknown>): string | undefined =>
  getCertificateUrl(data) ??
  toStringValue(data.generatedReportUrl) ??
  undefined;

export const resolveApprovalTargetModule = (
  category: RecordCategory,
): PendingApprovalTargetModule => {
  const targetModule = CATEGORY_TARGET_MAP[category];

  if (!targetModule) {
    throw new BadRequestError(
      `Cannot approve pending record: category "${category}" is not supported for approval`,
    );
  }

  return targetModule;
};

const inferAchievementTypeFromExtractedData = (
  data: Record<string, unknown>,
  category: RecordCategory,
  fallback: AchievementType,
): AchievementType => {
  const documentType = toStringValue(data.documentType);
  if (documentType === 'Student Certificate' || documentType === 'Faculty Certificate') {
    return 'Certification';
  }

  return normalizeAchievementType(data.achievementType, category, fallback);
};

export const mapPendingRecordToStudentAchievement = (
  record: IPendingRecord,
): Record<string, unknown> => {
  const data = getExtractedData(record);
  const photoUrls = getPhotoUrls(data);

  return {
    studentName: requireValue(getStudentName(data), 'student name'),
    rollNumber: toStringValue(data.rollNumber) ?? undefined,
    department:
      toStringValue(data.department) ?? toStringValue(getStructuredData(data).department) ?? undefined,
    achievementType: inferAchievementTypeFromExtractedData(data, record.category, 'Technical'),
    title: requireValue(getTitle(record), 'title').slice(0, 300),
    description: toStringValue(data.description)?.slice(0, 2000) ?? undefined,
    organization:
      toStringValue(data.organization) ??
      toStringValue(data.company) ??
      toStringValue(getStructuredData(data).organization) ??
      undefined,
    certificateUrl: getCertificateUrl(data),
    photos: photoUrls.length > 0 ? photoUrls : undefined,
    date: resolveRecordDate(data),
  };
};

export const mapPendingRecordToFacultyAchievement = (
  record: IPendingRecord,
): Record<string, unknown> => {
  const data = getExtractedData(record);
  const photoUrls = getPhotoUrls(data);

  return {
    facultyName: requireValue(getFacultyName(data), 'faculty name'),
    designation: toStringValue(data.designation) ?? undefined,
    achievementType: inferAchievementTypeFromExtractedData(data, record.category, 'Award'),
    title: requireValue(getTitle(record), 'title').slice(0, 300),
    description: toStringValue(data.description)?.slice(0, 2000) ?? undefined,
    organization:
      toStringValue(data.organization) ??
      toStringValue(data.company) ??
      toStringValue(getStructuredData(data).organization) ??
      undefined,
    certificateUrl: getCertificateUrl(data),
    photos: photoUrls.length > 0 ? photoUrls : undefined,
    date: resolveRecordDate(data),
  };
};

export const mapPendingRecordToPlacement = (
  record: IPendingRecord,
): Record<string, unknown> => {
  const data = getExtractedData(record);

  return {
    studentName: requireValue(getStudentName(data), 'student name'),
    rollNumber: toStringValue(data.rollNumber) ?? undefined,
    department: toStringValue(data.department) ?? undefined,
    company: requireValue(toStringValue(data.company), 'company'),
    role: toStringValue(data.role) ?? undefined,
    package: toStringValue(data.package) ?? undefined,
    joiningDate: parseDate(data.date) ?? parseDate(data.joiningDate),
    offerLetter: toStringArray(data.certificates)?.[0] ?? undefined,
  };
};

export const mapPendingRecordToInternship = (
  record: IPendingRecord,
): Record<string, unknown> => {
  const data = getExtractedData(record);

  return {
    studentName: requireValue(getStudentName(data), 'student name'),
    rollNumber: toStringValue(data.rollNumber) ?? undefined,
    company: requireValue(
      toStringValue(data.company) ?? toStringValue(data.internship),
      'company',
    ),
    role: toStringValue(data.role) ?? undefined,
    duration: toStringValue(data.duration) ?? undefined,
    startDate: parseDate(data.startDate) ?? parseDate(data.date),
    endDate: parseDate(data.endDate),
    certificateUrl: toStringArray(data.certificates)?.[0] ?? undefined,
  };
};

export const mapPendingRecordToPublication = (
  record: IPendingRecord,
): Record<string, unknown> => {
  const data = getExtractedData(record);

  return {
    facultyName: requireValue(getFacultyName(data), 'faculty name'),
    paperTitle: requireValue(
      toStringValue(data.publicationTitle) ?? toStringValue(data.title),
      'publication title',
    ),
    journal: toStringValue(data.journal) ?? undefined,
    conference: toStringValue(data.conference) ?? undefined,
    authors: [
      ...(toStringArray(data.facultyNames) ?? []),
      ...(toStringArray(data.studentNames) ?? []),
      ...(toStringArray(data.authors) ?? []),
    ],
    doi: toStringValue(data.doi) ?? undefined,
    publicationDate: parseDate(data.publicationDate) ?? parseDate(data.date),
    documentUrl: toStringArray(data.certificates)?.[0] ?? undefined,
  };
};

export const mapPendingRecordToPatent = (record: IPendingRecord): Record<string, unknown> => {
  const data = getExtractedData(record);

  return {
    patentTitle: requireValue(
      toStringValue(data.patentTitle) ?? toStringValue(data.title),
      'patent title',
    ),
    inventors: [
      ...(toStringArray(data.facultyNames) ?? []),
      ...(toStringArray(data.studentNames) ?? []),
      ...(toStringArray(data.inventors) ?? []),
    ],
    patentNumber: toStringValue(data.patentNumber) ?? undefined,
    status: normalizePatentStatus(data.patentStatus ?? data.status),
    filingDate: parseDate(data.filingDate) ?? parseDate(data.date),
    documentUrl: toStringArray(data.certificates)?.[0] ?? undefined,
  };
};

export const mapPendingRecordToCompletedEventReport = (
  record: IPendingRecord,
): Record<string, unknown> => {
  const data = getExtractedData(record);
  const structured = getStructuredData(data);
  const isAiEventReport = data.sourceType === 'ai-event-report';
  const documentUrl = resolveDocumentUrl(data);
  const evidenceUrls = Array.isArray(data.evidence)
    ? (data.evidence as Array<{ url?: string }>)
        .map((item) => sanitizeHttpUrl(item.url))
        .filter((url): url is string => Boolean(url))
    : [];
  const photoUrls = documentUrl
    ? [...new Set([...getPhotoUrls(data), ...evidenceUrls, documentUrl])]
    : [...new Set([...getPhotoUrls(data), ...evidenceUrls])];

  const aiReport = toStringValue(data.aiGeneratedReport);
  const narrative = aiReport ?? toStringValue(data.description);

  return {
    eventTitle: requireValue(
      toStringValue(data.eventName) ?? toStringValue(data.title) ?? toStringValue(structured.title),
      'event title',
    ),
    eventType: normalizeEventType(record.category, data.eventType ?? data.reportType),
    date: resolveRecordDate(data),
    venue:
      toStringValue(data.location) ??
      toStringValue(data.venue) ??
      toStringValue(structured.organization) ??
      toStringValue(data.organization) ??
      undefined,
    coordinator:
      toStringValue(data.coordinator) ?? record.senderName ?? undefined,
    participants:
      typeof data.participants === 'number' && data.participants >= 0
        ? data.participants
        : undefined,
    summary:
      toStringValue(data.summary)?.slice(0, 2000) ??
      (isAiEventReport ? aiReport?.slice(0, 500) : undefined),
    description: narrative?.slice(0, 12000) ?? undefined,
    photoUrls,
    generatedReportUrl: documentUrl,
    docxReportUrl: sanitizeHttpUrl(data.docxReportUrl) ?? undefined,
  };
};

const normalizeNewsArticleCategory = (value: unknown): NewsArticleCategory => {
  const raw = toStringValue(value);
  if (raw && (NEWS_ARTICLE_CATEGORIES as readonly string[]).includes(raw)) {
    return raw as NewsArticleCategory;
  }
  return 'General';
};

export const mapPendingRecordToNews = (record: IPendingRecord): Record<string, unknown> => {
  const data = getExtractedData(record);

  return {
    headline: requireValue(toStringValue(data.headline) ?? toStringValue(data.title), 'headline'),
    articleText: requireValue(
      toStringValue(data.articleText) ?? record.originalMessage.trim(),
      'article text',
    ),
    articleLanguage: requireValue(
      toStringValue(data.articleLanguage) ?? toStringValue(data.language) ?? 'English',
      'article language',
    ),
    newspaperName: toStringValue(data.newspaperName) ?? undefined,
    publicationDate: parseDate(data.publicationDate) ?? parseDate(data.date),
    peopleMentioned: toStringArray(data.peopleMentioned) ?? [],
    organization: toStringValue(data.organization) ?? undefined,
    department: toStringValue(data.department) ?? undefined,
    articleCategory: normalizeNewsArticleCategory(data.articleCategory),
    summary: toStringValue(data.summary) ?? undefined,
    confidenceScore:
      typeof data.confidenceScore === 'number'
        ? data.confidenceScore
        : record.confidenceScore,
    imageUrl: requireValue(
      toStringValue(data.imageUrl) ?? toStringValue(data.media),
      'image URL',
    ),
    sourceGroup: record.groupName ?? undefined,
    sourceSender: record.senderName ?? undefined,
    originalMessage: record.originalMessage,
  };
};

export const mapPendingRecordToTarget = (
  record: IPendingRecord,
  targetModule: PendingApprovalTargetModule,
): Record<string, unknown> => {
  switch (targetModule) {
    case 'StudentAchievement':
      return mapPendingRecordToStudentAchievement(record);
    case 'FacultyAchievement':
      return mapPendingRecordToFacultyAchievement(record);
    case 'Placement':
      return mapPendingRecordToPlacement(record);
    case 'Internship':
      return mapPendingRecordToInternship(record);
    case 'Publication':
      return mapPendingRecordToPublication(record);
    case 'Patent':
      return mapPendingRecordToPatent(record);
    case 'CompletedEventReport':
      return mapPendingRecordToCompletedEventReport(record);
    case 'News':
      return mapPendingRecordToNews(record);
    default:
      throw new BadRequestError('Cannot approve pending record: unsupported target collection');
  }
};
