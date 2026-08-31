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
  activitySubCategory?: string;
  sponsorshipAmount?: number;
  certificateUrl?: string;
  photos: string[];
  date: Date;
  approvedBy?: Types.ObjectId | string;
}

export interface CreateStudentAchievementInput {
  studentName: string;
  rollNumber?: string;
  department?: string;
  achievementType: AchievementType;
  title: string;
  description?: string;
  organization?: string;
  activitySubCategory?: string;
  sponsorshipAmount?: number;
  certificateUrl?: string;
  photos?: string[];
  date: Date;
  approvedBy?: Types.ObjectId | string;
}

export interface UpdateStudentAchievementInput {
  studentName?: string;
  rollNumber?: string;
  department?: string;
  achievementType?: AchievementType;
  title?: string;
  description?: string;
  organization?: string;
  activitySubCategory?: string;
  sponsorshipAmount?: number;
  certificateUrl?: string;
  photos?: string[];
  date?: Date;
  approvedBy?: Types.ObjectId | string;
}

export interface IStudentAchievementResponse {
  _id: Types.ObjectId;
  studentName: string;
  rollNumber?: string;
  department?: string;
  achievementType: AchievementType;
  title: string;
  description?: string;
  organization?: string;
  activitySubCategory?: string;
  sponsorshipAmount?: number;
  certificateUrl?: string;
  photos: string[];
  date: Date;
  approvedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface StudentAchievementFilters {
  search?: string;
  studentName?: string;
  department?: string;
  achievementType?: AchievementType;
  activitySubCategory?: string;
  fromDate?: Date;
  toDate?: Date;
}

export interface StudentAchievementSort {
  sortBy: 'studentName' | 'date' | 'achievementType' | 'department' | 'createdAt';
  sortOrder: 'asc' | 'desc';
}
