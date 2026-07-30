export type PendingApprovalTargetModule =
  | 'StudentAchievement'
  | 'FacultyAchievement'
  | 'Placement'
  | 'Internship'
  | 'Publication'
  | 'Patent'
  | 'CompletedEventReport'
  | 'News';

export interface PendingApprovalResult {
  targetModule: PendingApprovalTargetModule;
  createdRecordId: string;
}
