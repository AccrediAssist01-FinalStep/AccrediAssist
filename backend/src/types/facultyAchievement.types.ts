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

export interface IFacultyAchievementResponse {
  _id: Types.ObjectId;
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
  createdAt: Date;
  updatedAt: Date;
}

export interface FacultyAchievementFilters {
  search?: string;
  facultyName?: string;
  designation?: string;
  achievementType?: AchievementType;
  fromDate?: Date;
  toDate?: Date;
}

export interface FacultyAchievementSort {
  sortBy: 'facultyName' | 'date' | 'achievementType' | 'designation' | 'createdAt';
  sortOrder: 'asc' | 'desc';
}
