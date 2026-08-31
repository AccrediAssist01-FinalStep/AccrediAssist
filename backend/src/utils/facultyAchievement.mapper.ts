import { Types } from 'mongoose';
import {
  IFacultyAchievement,
  IFacultyAchievementResponse,
} from '../types/facultyAchievement.types';

export const toFacultyAchievementResponse = (
  record: IFacultyAchievement,
): IFacultyAchievementResponse => ({
  _id: record._id,
  facultyName: record.facultyName,
  designation: record.designation,
  achievementType: record.achievementType,
  title: record.title,
  description: record.description,
  organization: record.organization,
  activitySubCategory: record.activitySubCategory,
  benefit: record.benefit,
  resourceType: record.resourceType,
  sessionRole: record.sessionRole,
  certificateUrl: record.certificateUrl,
  photos: record.photos,
  date: record.date,
  approvedBy: record.approvedBy as Types.ObjectId | undefined,
  createdAt: record.createdAt,
  updatedAt: record.updatedAt,
});
