import mongoose, { Schema } from 'mongoose';
import { IFacultyAchievement } from '../types/facultyAchievement.types';
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

const facultyAchievementSchema = new Schema<IFacultyAchievement>(
  {
    facultyName: {
      type: String,
      required: [true, 'Faculty name is required'],
      trim: true,
      maxlength: [100, 'Faculty name cannot exceed 100 characters'],
    },
    designation: {
      type: String,
      trim: true,
      maxlength: [100, 'Designation cannot exceed 100 characters'],
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
    collection: 'faculty_achievements',
  },
);

applyBaseSchema(facultyAchievementSchema);

facultyAchievementSchema.index({ facultyName: 1 });
facultyAchievementSchema.index({ achievementType: 1 });
facultyAchievementSchema.index({ date: -1 });

export const FacultyAchievement = mongoose.model<IFacultyAchievement>(
  'FacultyAchievement',
  facultyAchievementSchema,
);
