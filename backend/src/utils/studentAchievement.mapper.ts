import { Types } from 'mongoose';
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
  activitySubCategory: record.activitySubCategory,
  sponsorshipAmount: record.sponsorshipAmount,
  certificateUrl: record.certificateUrl,
  photos: record.photos,
  date: record.date,
  approvedBy: record.approvedBy as Types.ObjectId | undefined,
  createdAt: record.createdAt,
  updatedAt: record.updatedAt,
});
