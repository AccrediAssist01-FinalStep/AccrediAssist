import {
  IStudentAchievement,
  IStudentAchievementResponse,
} from '../types/studentAchievement.types';

export const toStudentAchievementResponse = (
  record: IStudentAchievement,
): IStudentAchievementResponse => ({
  _id: record._id,
  studentName: record.studentName,
  rollNumber: record.rollNumber,
  department: record.department,
  achievementType: record.achievementType,
  title: record.title,
  description: record.description,
  organization: record.organization,
  certificateUrl: record.certificateUrl,
  photos: record.photos,
  date: record.date,
  approvedBy: record.approvedBy,
  createdAt: record.createdAt,
  updatedAt: record.updatedAt,
});
