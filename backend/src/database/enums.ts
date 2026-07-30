/**
 * Common enums from Document 16 — shared across all Mongoose schemas.
 */

// User roles
export const USER_ROLES = ['Admin', 'HOD', 'Faculty', 'AccreditationCommittee'] as const;
export type UserRole = (typeof USER_ROLES)[number];

// Pending record status
export const PENDING_RECORD_STATUSES = [
  'Pending',
  'Approved',
  'Rejected',
  'Needs Review',
] as const;
export type PendingRecordStatus = (typeof PENDING_RECORD_STATUSES)[number];

export const PENDING_REVIEW_STATUSES = ['Pending', 'Needs Review'] as const;
export type PendingReviewStatus = (typeof PENDING_REVIEW_STATUSES)[number];

// Record categories (AI classification)
export const RECORD_CATEGORIES = [
  'Placement',
  'Internship',
  'Workshop',
  'Seminar',
  'Industrial Visit',
  'Student Achievement',
  'Faculty Achievement',
  'Sports',
  'Cultural',
  'Patent',
  'Publication',
  'Certification',
  'Research',
  'News',
] as const;
export type RecordCategory = (typeof RECORD_CATEGORIES)[number];

// Achievement types
export const ACHIEVEMENT_TYPES = [
  'Sports',
  'Technical',
  'Hackathon',
  'Research',
  'Certification',
  'Award',
  'Cultural',
] as const;
export type AchievementType = (typeof ACHIEVEMENT_TYPES)[number];

// Event types
export const EVENT_TYPES = [
  'Workshop',
  'Seminar',
  'Guest Lecture',
  'Industrial Visit',
  'FDP',
  'Training Program',
] as const;
export type EventType = (typeof EVENT_TYPES)[number];

// Patent status
export const PATENT_STATUSES = ['Filed', 'Published', 'Granted'] as const;
export type PatentStatus = (typeof PATENT_STATUSES)[number];

// Report types — eight primary ERP reports plus legacy values for historical records
export const PRIMARY_REPORT_TYPES = [
  'Student Activities',
  'Faculty Activities',
  'Department Activities',
  'NBA',
  'NAAC',
  'AICTE',
  'AI Generated Workshop',
  'AI Generated Industrial Visit',
] as const;

export const LEGACY_REPORT_TYPES = [
  'Monthly',
  'Placement',
  'Internship',
  'Student Achievement',
  'Faculty Achievement',
  'Completed Event',
  'Publication',
  'Patent',
  'News',
] as const;

export const REPORT_TYPES = [...PRIMARY_REPORT_TYPES, ...LEGACY_REPORT_TYPES] as const;

export const REPORT_EXPORT_FORMATS = ['pdf', 'docx'] as const;
export type ReportExportFormat = (typeof REPORT_EXPORT_FORMATS)[number];

export const REPORT_STATUSES = ['pending', 'generating', 'completed', 'failed'] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];
export type ReportType = (typeof REPORT_TYPES)[number];

// Notification types
export const NOTIFICATION_TYPES = ['Approval', 'AI', 'Report', 'System'] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

/**
 * Helper to build Mongoose enum field options from a readonly tuple.
 */
export const enumField = <T extends readonly string[]>(
  values: T,
  label = 'value',
): { values: T; message: string } => ({
  values,
  message: `{VALUE} is not a valid ${label}`,
});
