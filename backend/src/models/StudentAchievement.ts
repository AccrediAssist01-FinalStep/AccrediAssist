import mongoose, { Schema } from 'mongoose';
import { IStudentAchievement } from '../types/studentAchievement.types';
import {
  applyBaseSchema,
  baseSchemaOptions,
  enumField,
  ACHIEVEMENT_TYPES,
} from '../database';

const urlValidator = {
  validator: (value: string) => !value || /^https?:\/\/.+/.test(value),
  message: 'Must be a valid URL',
};

const studentAchievementSchema = new Schema<IStudentAchievement>(
  {
    studentName: {
      type: String,
      required: [true, 'Student name is required'],
      trim: true,
      maxlength: [100, 'Student name cannot exceed 100 characters'],
    },
    rollNumber: {
      type: String,
      trim: true,
      maxlength: [50, 'Roll number cannot exceed 50 characters'],
    },
    department: {
      type: String,
      trim: true,
      maxlength: [100, 'Department cannot exceed 100 characters'],
    },
    achievementType: {
      type: String,
      enum: enumField(ACHIEVEMENT_TYPES, 'achievement type'),
      required: [true, 'Achievement type is required'],
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [300, 'Title cannot exceed 300 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    organization: {
      type: String,
      trim: true,
      maxlength: [200, 'Organization cannot exceed 200 characters'],
    },
    certificateUrl: {
      type: String,
      trim: true,
      validate: urlValidator,
    },
    photos: {
      type: [String],
      default: [],
      validate: {
        validator: (urls: string[]) =>
          urls.every((url) => !url || /^https?:\/\/.+/.test(url)),
        message: 'All photo URLs must be valid',
      },
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    ...baseSchemaOptions,
    collection: 'student_achievements',
  },
);

applyBaseSchema(studentAchievementSchema);

studentAchievementSchema.index({ studentName: 1 });
studentAchievementSchema.index({ achievementType: 1 });
studentAchievementSchema.index({ date: -1 });
studentAchievementSchema.index({ department: 1 });

export const StudentAchievement = mongoose.model<IStudentAchievement>(
  'StudentAchievement',
  studentAchievementSchema,
);
