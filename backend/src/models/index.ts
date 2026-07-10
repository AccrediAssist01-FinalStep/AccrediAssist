export { User } from './User';
export { AuditLog } from './AuditLog';
export { PendingRecord } from './PendingRecord';
export { StudentAchievement } from './StudentAchievement';
export { FacultyAchievement } from './FacultyAchievement';
export { Placement } from './Placement';
export { Internship } from './Internship';
export { CompletedEventReport } from './CompletedEventReport';
export { Publication } from './Publication';
export { Patent } from './Patent';

export type {
  UserRole,
  PendingRecordStatus,
  RecordCategory,
  AchievementType,
  EventType,
  PatentStatus,
} from '../database/enums';
export {
  USER_ROLES,
  PENDING_RECORD_STATUSES,
  RECORD_CATEGORIES,
  ACHIEVEMENT_TYPES,
  EVENT_TYPES,
  PATENT_STATUSES,
} from '../database/enums';
export type { IBaseDocument, BaseDocument } from '../types/base.types';
export type { IUser, IUserDocument } from '../types/user.types';
export type { IPendingRecord } from '../types/pendingRecord.types';
export type { IStudentAchievement } from '../types/studentAchievement.types';
export type { IFacultyAchievement } from '../types/facultyAchievement.types';
export type { IPlacement } from '../types/placement.types';
export type { IInternship } from '../types/internship.types';
export type { ICompletedEventReport } from '../types/completedEventReport.types';
export type { IPublication } from '../types/publication.types';
export type { IPatent } from '../types/patent.types';
