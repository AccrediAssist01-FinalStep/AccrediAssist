import mongoose, { Schema } from 'mongoose';
import { ICompletedEventReport } from '../types/completedEventReport.types';
import {
  applyBaseSchema,
  baseSchemaOptions,
  enumField,
  EVENT_TYPES,
} from '../database';

const isValidReportUrl = (value: string): boolean =>
  !value ||
  /^https?:\/\/.+/.test(value) ||
  /^\/api\/v1\/report-generation\/downloads\/.+/.test(value);

const reportUrlValidator = {
  validator: (value: string) => isValidReportUrl(value),
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
      maxlength: [12000, 'Description cannot exceed 12000 characters'],
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
      validate: reportUrlValidator,
    },
    docxReportUrl: {
      type: String,
      trim: true,
      validate: reportUrlValidator,
    },
    workshopReportStructured: {
      type: Schema.Types.Mixed,
    },
    media: {
      type: [Schema.Types.Mixed],
      default: [],
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
completedEventReportSchema.index(
  {
    eventTitle: 'text',
    eventType: 'text',
    venue: 'text',
    coordinator: 'text',
    summary: 'text',
    description: 'text',
  },
  { name: 'search_text_index' },
);

export const CompletedEventReport = mongoose.model<ICompletedEventReport>(
  'CompletedEventReport',
  completedEventReportSchema,
);
