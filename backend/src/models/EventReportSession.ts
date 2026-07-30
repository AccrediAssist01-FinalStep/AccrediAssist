import mongoose, { Schema } from 'mongoose';
import { IEventReportSession } from '../types/eventReportSession.types';
import { applyBaseSchema, baseSchemaOptions } from '../database';

const sessionMessageSchema = new Schema(
  {
    text: { type: String, default: '' },
    sender: { type: String, required: true, trim: true },
    media: { type: String, trim: true },
    mediaMetadata: { type: Schema.Types.Mixed },
    receivedAt: { type: Date, required: true },
  },
  { _id: false },
);

const eventReportSessionSchema = new Schema<IEventReportSession>(
  {
    groupName: { type: String, required: true, trim: true, index: true },
    messages: { type: [sessionMessageSchema], default: [] },
    status: {
      type: String,
      enum: ['collecting', 'processing', 'completed', 'failed'],
      default: 'collecting',
      index: true,
    },
    pendingRecordId: { type: Schema.Types.ObjectId, ref: 'PendingRecord' },
    lastMessageAt: { type: Date, required: true, index: true },
    processedAt: { type: Date },
    errorMessage: { type: String, trim: true },
  },
  {
    ...baseSchemaOptions,
    collection: 'event_report_sessions',
  },
);

applyBaseSchema(eventReportSessionSchema);

eventReportSessionSchema.index({ groupName: 1, status: 1, lastMessageAt: -1 });

export const EventReportSession = mongoose.model<IEventReportSession>(
  'EventReportSession',
  eventReportSessionSchema,
);
