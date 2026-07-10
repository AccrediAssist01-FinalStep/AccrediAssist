import { Types } from 'mongoose';
import { IBaseDocument } from './base.types';
import { AchievementType } from '../database/enums';

export interface IFacultyAchievement extends IBaseDocument {
  facultyName: string;
  designation?: string;
  achievementType: AchievementType;
  title: string;
  description?: string;
  organization?: string;
  certificateUrl?: string;
  photos: string[];
  date: Date;
  approvedBy?: Types.ObjectId;
}

export interface CreateFacultyAchievementInput {
  facultyName: string;
  designation?: string;
  achievementType: AchievementType;
  title: string;
  description?: string;
  organization?: string;
  certificateUrl?: string;
  photos?: string[];
  date: Date;
  approvedBy?: Types.ObjectId;
}

export interface UpdateFacultyAchievementInput {
  facultyName?: string;
  designation?: string;
  achievementType?: AchievementType;
  title?: string;
  description?: string;
  organization?: string;
  certificateUrl?: string;
  photos?: string[];
  date?: Date;
  approvedBy?: Types.ObjectId;
}
