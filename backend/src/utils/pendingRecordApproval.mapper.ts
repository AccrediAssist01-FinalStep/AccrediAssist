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

const getStudentName = (data: Record<string, unknown>): string | null =>
  toStringArray(data.studentNames)?.[0] ?? toStringValue(data.studentName);

const getFacultyName = (data: Record<string, unknown>): string | null =>
  toStringArray(data.facultyNames)?.[0] ?? toStringValue(data.facultyName);

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

const getPhotoUrls = (data: Record<string, unknown>): string[] => {
  const certificates = toStringArray(data.certificates) ?? [];
  const mediaReferences = toStringArray(data.mediaReferences) ?? [];
  return [...certificates, ...mediaReferences];
};

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

export const mapPendingRecordToStudentAchievement = (
  record: IPendingRecord,
): Record<string, unknown> => {
  const data = getExtractedData(record);

  return {
    studentName: requireValue(getStudentName(data), 'student name'),
    rollNumber: toStringValue(data.rollNumber) ?? undefined,
    department: toStringValue(data.department) ?? undefined,
    achievementType: normalizeAchievementType(data.achievementType, record.category, 'Technical'),
    title: requireValue(getTitle(record), 'title'),
    description: toStringValue(data.description) ?? undefined,
    organization:
      toStringValue(data.organization) ?? toStringValue(data.company) ?? undefined,
    certificateUrl: toStringArray(data.certificates)?.[0] ?? undefined,
    photos: getPhotoUrls(data),
    date: parseDate(data.date) ?? new Date(),
  };
};

export const mapPendingRecordToFacultyAchievement = (
  record: IPendingRecord,
): Record<string, unknown> => {
  const data = getExtractedData(record);

  return {
    facultyName: requireValue(getFacultyName(data), 'faculty name'),
    designation: toStringValue(data.designation) ?? undefined,
    achievementType: normalizeAchievementType(data.achievementType, record.category, 'Award'),
    title: requireValue(getTitle(record), 'title'),
    description: toStringValue(data.description) ?? undefined,
    organization:
      toStringValue(data.organization) ?? toStringValue(data.company) ?? undefined,
    certificateUrl: toStringArray(data.certificates)?.[0] ?? undefined,
    photos: getPhotoUrls(data),
    date: parseDate(data.date) ?? new Date(),
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

  return {
    eventTitle: requireValue(
      toStringValue(data.eventName) ?? toStringValue(data.title),
      'event title',
    ),
    eventType: normalizeEventType(record.category, data.eventType),
    date: parseDate(data.date),
    venue: toStringValue(data.location) ?? toStringValue(data.venue) ?? undefined,
    coordinator: record.senderName ?? toStringValue(data.coordinator) ?? undefined,
    participants:
      typeof data.participants === 'number' && data.participants >= 0
        ? data.participants
        : undefined,
    summary: toStringValue(data.description)?.slice(0, 2000) ?? undefined,
    description: toStringValue(data.description) ?? undefined,
    photoUrls: getPhotoUrls(data),
    generatedReportUrl: toStringValue(data.generatedReportUrl) ?? undefined,
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
    default:
      throw new BadRequestError('Cannot approve pending record: unsupported target collection');
  }
};
