export type PendingApprovalTargetModule =
  | 'StudentAchievement'
  | 'FacultyAchievement'
  | 'Placement'
  | 'Internship'
  | 'Publication'
  | 'Patent'
  | 'CompletedEventReport';

export interface PendingApprovalResult {
  targetModule: PendingApprovalTargetModule;
  createdRecordId: string;
}
