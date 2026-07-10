import { Types } from 'mongoose';
import { IBaseDocument } from './base.types';
import { AchievementType } from '../database/enums';

export interface IStudentAchievement extends IBaseDocument {
  studentName: string;
  rollNumber?: string;
  department?: string;
  achievementType: AchievementType;
  title: string;
  description?: string;
  organization?: string;
  certificateUrl?: string;
  photos: string[];
  date: Date;
  approvedBy?: Types.ObjectId;
}

export interface CreateStudentAchievementInput {
  studentName: string;
  rollNumber?: string;
  department?: string;
  achievementType: AchievementType;
  title: string;
  description?: string;
  organization?: string;
  certificateUrl?: string;
  photos?: string[];
  date: Date;
  approvedBy?: Types.ObjectId;
}

export interface UpdateStudentAchievementInput {
  studentName?: string;
  rollNumber?: string;
  department?: string;
  achievementType?: AchievementType;
  title?: string;
  description?: string;
  organization?: string;
  certificateUrl?: string;
  photos?: string[];
  date?: Date;
  approvedBy?: Types.ObjectId;
}
