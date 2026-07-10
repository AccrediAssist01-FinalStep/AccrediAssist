import mongoose, { Schema } from 'mongoose';
import { IPatent } from '../types/patent.types';
import {
  applyBaseSchema,
  baseSchemaOptions,
  enumField,
  PATENT_STATUSES,
} from '../database';

const urlValidator = {
  validator: (value: string) => !value || /^https?:\/\/.+/.test(value),
  message: 'Must be a valid URL',
};

const patentSchema = new Schema<IPatent>(
  {
    patentTitle: {
      type: String,
      required: [true, 'Patent title is required'],
      trim: true,
      maxlength: [500, 'Patent title cannot exceed 500 characters'],
    },
    inventors: {
      type: [String],
      default: [],
    },
    patentNumber: {
      type: String,
      trim: true,
      maxlength: [50, 'Patent number cannot exceed 50 characters'],
    },
    status: {
      type: String,
      enum: enumField(PATENT_STATUSES, 'patent status'),
      required: [true, 'Patent status is required'],
    },
    filingDate: {
      type: Date,
    },
    documentUrl: {
      type: String,
      trim: true,
      validate: urlValidator,
    },
  },
  {
    ...baseSchemaOptions,
    collection: 'patents',
  },
);

applyBaseSchema(patentSchema);

patentSchema.index({ patentTitle: 1 });
patentSchema.index({ status: 1 });
patentSchema.index({ filingDate: -1 });

export const Patent = mongoose.model<IPatent>('Patent', patentSchema);
