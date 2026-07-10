import mongoose, { Schema } from 'mongoose';
import { ICompletedEventReport } from '../types/completedEventReport.types';
import {
  applyBaseSchema,
  baseSchemaOptions,
  enumField,
  EVENT_TYPES,
} from '../database';

const urlValidator = {
  validator: (value: string) => !value || /^https?:\/\/.+/.test(value),
  message: 'Must be a valid URL',
};

const completedEventReportSchema = new Schema<ICompletedEventReport>(
  {
    eventTitle: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
      maxlength: [300, 'Event title cannot exceed 300 characters'],
    },
    eventType: {
      type: String,
      enum: enumField(EVENT_TYPES, 'event type'),
      required: [true, 'Event type is required'],
    },
    date: {
      type: Date,
    },
    venue: {
      type: String,
      trim: true,
      maxlength: [200, 'Venue cannot exceed 200 characters'],
    },
    coordinator: {
      type: String,
      trim: true,
      maxlength: [100, 'Coordinator cannot exceed 100 characters'],
    },
    participants: {
      type: Number,
      min: [0, 'Participants cannot be negative'],
    },
    summary: {
      type: String,
      trim: true,
      maxlength: [2000, 'Summary cannot exceed 2000 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
    },
    photoUrls: {
      type: [String],
      default: [],
      validate: {
        validator: (urls: string[]) =>
          urls.every((url) => !url || /^https?:\/\/.+/.test(url)),
        message: 'All photo URLs must be valid',
      },
    },
    generatedReportUrl: {
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
    collection: 'completed_event_reports',
  },
);

applyBaseSchema(completedEventReportSchema);

completedEventReportSchema.index({ eventTitle: 1 });
completedEventReportSchema.index({ eventType: 1 });
completedEventReportSchema.index({ date: -1 });

export const CompletedEventReport = mongoose.model<ICompletedEventReport>(
  'CompletedEventReport',
  completedEventReportSchema,
);
