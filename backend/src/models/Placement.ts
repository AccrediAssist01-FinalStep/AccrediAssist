import mongoose, { Schema } from 'mongoose';
import { IPlacement } from '../types/placement.types';
import { applyBaseSchema, baseSchemaOptions } from '../database';

const urlValidator = {
  validator: (value: string) => !value || /^https?:\/\/.+/.test(value),
  message: 'Must be a valid URL',
};

const placementSchema = new Schema<IPlacement>(
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
    package: {
      type: String,
      trim: true,
      maxlength: [50, 'Package cannot exceed 50 characters'],
    },
    joiningDate: {
      type: Date,
    },
    offerLetter: {
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
    collection: 'placements',
  },
);

applyBaseSchema(placementSchema);

placementSchema.index({ studentName: 1 });
placementSchema.index({ company: 1 });
placementSchema.index({ joiningDate: -1 });

export const Placement = mongoose.model<IPlacement>('Placement', placementSchema);
