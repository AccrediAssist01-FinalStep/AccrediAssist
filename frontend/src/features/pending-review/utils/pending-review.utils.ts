import type { PendingRecord, RecordCategory } from '@/types/api-models';
import type { AiInsightSummary, ConfidenceLevel, DateFilter } from '../types';

export interface ApprovedModuleDestination {
  href: string;
  label: string;
}

const APPROVED_MODULE_DESTINATIONS: Partial<Record<RecordCategory, ApprovedModuleDestination>> = {
  News: { href: '/news', label: 'News Dashboard' },
  Placement: { href: '/student-activities/placement', label: 'Placements' },
  Internship: { href: '/student-activities/internship', label: 'Internships' },
  Workshop: { href: '/student-activities/workshops', label: 'Workshops' },
  Seminar: { href: '/student-activities/seminars', label: 'Seminars' },
  'Industrial Visit': {
    href: '/department-activities/industrial-visit-reports',
    label: 'Industrial Visit Reports',
  },
  'Student Achievement': { href: '/student-activities/technical', label: 'Student Achievements' },
  'Faculty Achievement': { href: '/faculty-activities/awards', label: 'Faculty Achievements' },
  Sports: { href: '/student-activities/sports', label: 'Sports' },
  Cultural: { href: '/student-activities/cultural', label: 'Cultural Activities' },
  Patent: { href: '/faculty-activities/patents', label: 'Patents' },
  Publication: { href: '/faculty-activities/publications', label: 'Publications' },
  Certification: { href: '/student-activities/certifications', label: 'Certifications' },
  Certification: { href: '/student-activities/certifications', label: 'Certifications' },
  Research: { href: '/student-activities/technical', label: 'Student Achievements' },
};

const APPROVED_TARGET_MODULE_DESTINATIONS: Record<string, ApprovedModuleDestination> = {
  StudentAchievement: { href: '/student-activities/technical', label: 'Student Achievements' },
  FacultyAchievement: { href: '/faculty-activities/awards', label: 'Faculty Achievements' },
  Placement: { href: '/student-activities/placement', label: 'Placements' },
  Internship: { href: '/student-activities/internship', label: 'Internships' },
  Publication: { href: '/faculty-activities/publications', label: 'Publications' },
  Patent: { href: '/faculty-activities/patents', label: 'Patents' },
  CompletedEventReport: {
    href: '/department-activities/industrial-visit-reports',
    label: 'Event Reports',
  },
  News: { href: '/news', label: 'News Dashboard' },
};

export function getApprovedModuleDestination(
  record: PendingRecord,
): ApprovedModuleDestination | null {
  if (record.status !== 'Approved') {
    return null;
  }

  if (record.approvedTargetModule === 'CompletedEventReport') {
    if (record.category === 'Industrial Visit') {
      return APPROVED_MODULE_DESTINATIONS['Industrial Visit'] ?? null;
    }

    const detectedCategory = record.extractedData?.detectedCategory as string | undefined;
    if (detectedCategory === 'Completed Event Report' && record.category === 'Industrial Visit') {
      return APPROVED_MODULE_DESTINATIONS['Industrial Visit'] ?? null;
    }
  }

  if (record.category === 'Industrial Visit') {
    return APPROVED_MODULE_DESTINATIONS['Industrial Visit'] ?? null;
  }

  if (record.approvedTargetModule) {
    const byTarget = APPROVED_TARGET_MODULE_DESTINATIONS[record.approvedTargetModule];
    if (byTarget) {
      return byTarget;
    }
  }

  const activitySubCategory = record.extractedData?.activitySubCategory as string | undefined;
  if (activitySubCategory?.includes('Industrial Visit')) {
    return APPROVED_MODULE_DESTINATIONS['Industrial Visit'] ?? null;
  }

  const detectedCategory = record.extractedData?.detectedCategory as RecordCategory | undefined;
  if (detectedCategory && APPROVED_MODULE_DESTINATIONS[detectedCategory]) {
    return APPROVED_MODULE_DESTINATIONS[detectedCategory] ?? null;
  }

  return APPROVED_MODULE_DESTINATIONS[record.category] ?? null;
}

export function getConfidenceLevel(score: number): ConfidenceLevel {
  if (score >= 80) return 'high';
  if (score >= 50) return 'medium';
  return 'low';
}

export function getConfidenceLabel(level: ConfidenceLevel): string {
  switch (level) {
    case 'high':
      return 'High Confidence';
    case 'medium':
      return 'Medium Confidence';
    case 'low':
      return 'Low Confidence';
  }
}

export function getConfidenceBadgeVariant(level: ConfidenceLevel): 'success' | 'warning' | 'destructive' {
  switch (level) {
    case 'high':
      return 'success';
    case 'medium':
      return 'warning';
    case 'low':
      return 'destructive';
  }
}

export function getStatusBadgeVariant(
  status: PendingRecord['status'],
): 'success' | 'warning' | 'destructive' | 'secondary' {
  switch (status) {
    case 'Approved':
      return 'success';
    case 'Rejected':
      return 'destructive';
    case 'Needs Review':
      return 'warning';
    default:
      return 'secondary';
  }
}

export function getRecordTitle(record: PendingRecord): string {
  const data = record.extractedData;
  const candidates = [
    data?.title,
    data?.eventName,
    data?.publicationTitle,
    data?.patentTitle,
    data?.company,
    data?.studentName,
    data?.facultyName,
  ].filter(Boolean);

  if (candidates.length > 0) return String(candidates[0]);
  if (record.originalMessage) {
    return record.originalMessage.length > 80
      ? `${record.originalMessage.slice(0, 80)}…`
      : record.originalMessage;
  }
  return `${record.category} submission`;
}

export function getRecordDepartment(record: PendingRecord): string {
  return record.groupName || 'General';
}

export function hasAttachments(record: PendingRecord): boolean {
  const data = record.extractedData;
  const certificates = data?.certificates?.length ?? 0;
  const mediaRefs = data?.mediaReferences?.length ?? 0;
  const media = data?.media;
  const hasMedia = Array.isArray(media) ? media.length > 0 : Boolean(media);
  return certificates > 0 || mediaRefs > 0 || hasMedia;
}

export function formatSubmittedDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export function formatShortDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
}

export function isToday(value: string): boolean {
  const date = new Date(value);
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

export function matchesDateFilter(createdAt: string, filter: DateFilter): boolean {
  if (filter === 'all') return true;
  const date = new Date(createdAt);
  const now = new Date();

  if (filter === 'today') {
    return isToday(createdAt);
  }

  const diffMs = now.getTime() - date.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (filter === 'week') return diffDays <= 7;
  if (filter === 'month') return diffDays <= 30;
  return true;
}

export function matchesConfidenceFilter(score: number, filter: ConfidenceLevel | 'all'): boolean {
  if (filter === 'all') return true;
  return getConfidenceLevel(score) === filter;
}

export function isActiveReviewStatus(status: PendingRecord['status']): boolean {
  return status === 'Pending' || status === 'Needs Review';
}

export function buildAiInsights(record: PendingRecord): AiInsightSummary {
  const pipeline = record.extractedData?.aiPipeline;
  const confidence = record.confidenceScore;
  const confidenceLevel = getConfidenceLevel(confidence);

  const validationStatus = pipeline?.validation?.validationStatus ?? 'unknown';
  const duplicate = pipeline?.duplicateDetection?.duplicate === true;
  const similarity = pipeline?.duplicateDetection?.similarityScore ?? 0;

  let duplicateStatus: AiInsightSummary['duplicateStatus'] = 'none';
  if (duplicate) duplicateStatus = 'duplicate';
  else if (similarity >= 0.5) duplicateStatus = 'possible';

  let recommendedAction = 'Auto-approved into ERP when confidence is 50% or higher.';
  if (record.status === 'Rejected') {
    recommendedAction = record.rejectionReason?.startsWith('Auto-rejected')
      ? record.rejectionReason
      : 'Record was rejected automatically.';
  } else if (record.status === 'Approved') {
    const destination = getApprovedModuleDestination(record);
    recommendedAction = destination
      ? `Record was auto-approved and stored in ${destination.label}. Open that module to view the live ERP record.`
      : 'Record was auto-approved and stored in the ERP database.';
  } else if (duplicateStatus === 'duplicate') {
    recommendedAction = 'Potential duplicate detected during AI processing.';
  } else if (validationStatus === 'invalid') {
    recommendedAction = 'Validation issues were detected during AI processing.';
  } else if (confidenceLevel === 'low') {
    recommendedAction = 'Low AI confidence — this record will be auto-rejected.';
  } else if (record.status === 'Needs Review' || record.status === 'Pending') {
    recommendedAction = 'Waiting for automatic confidence-based review.';
  }

  return {
    confidence,
    confidenceLevel,
    validationStatus,
    duplicateStatus,
    recommendedAction,
  };
}

export function getEditableFields(record: PendingRecord): Array<{ key: string; label: string; value: string }> {
  const data = record.extractedData ?? {};
  const fieldMap: Array<[string, string]> = [
    ['title', 'Title'],
    ['description', 'Description'],
    ['studentName', 'Student Name'],
    ['facultyName', 'Faculty Name'],
    ['company', 'Company'],
    ['organization', 'Organization'],
    ['eventName', 'Event Name'],
    ['publicationTitle', 'Publication Title'],
    ['patentTitle', 'Patent Title'],
    ['internship', 'Internship'],
    ['placement', 'Placement'],
    ['date', 'Date'],
    ['location', 'Location'],
  ];

  return fieldMap
    .map(([key, label]) => ({
      key,
      label,
      value: data[key] != null ? String(data[key]) : '',
    }))
    .filter((field) => field.value || ['title', 'studentName', 'facultyName', 'company'].includes(field.key));
}

export function canEditRecord(record: PendingRecord): boolean {
  return record.status === 'Pending' || record.status === 'Needs Review';
}

export function canApproveOrReject(_record: PendingRecord): boolean {
  return false;
}
