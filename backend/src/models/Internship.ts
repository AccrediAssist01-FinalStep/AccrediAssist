import mongoose, { Schema } from 'mongoose';
import { IInternship } from '../types/internship.types';
import { applyBaseSchema, baseSchemaOptions } from '../database';

const urlValidator = {
  validator: (value: string) => !value || /^https?:\/\/.+/.test(value),
  message: 'Must be a valid URL',
};

const internshipSchema = new Schema<IInternship>(
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
    company: {
      type: String,
      required: [true, 'Company is required'],
      trim: true,
      maxlength: [200, 'Company cannot exceed 200 characters'],
    },
    role: {
      type: String,
      trim: true,
      maxlength: [150, 'Role cannot exceed 150 characters'],
    },
    duration: {
      type: String,
      trim: true,
      maxlength: [50, 'Duration cannot exceed 50 characters'],
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
      validate: {
        validator: function (this: IInternship, value: Date) {
          if (!value || !this.startDate) return true;
          return value >= this.startDate;
        },
        message: 'End date must be on or after start date',
      },
    },
    certificateUrl: {
      type: String,
      trim: true,
      validate: urlValidator,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    ...baseSchemaOptions,
    collection: 'internships',
  },
);

applyBaseSchema(internshipSchema);

internshipSchema.index({ studentName: 1 });
internshipSchema.index({ company: 1 });
internshipSchema.index({ startDate: -1 });

export const Internship = mongoose.model<IInternship>('Internship', internshipSchema);
