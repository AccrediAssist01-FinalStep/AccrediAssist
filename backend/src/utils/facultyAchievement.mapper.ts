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
  certificateUrl: record.certificateUrl,
  photos: record.photos,
  date: record.date,
  approvedBy: record.approvedBy,
  createdAt: record.createdAt,
  updatedAt: record.updatedAt,
});
