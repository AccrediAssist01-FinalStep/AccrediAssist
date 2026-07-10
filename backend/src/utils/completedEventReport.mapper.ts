import {
  ICompletedEventReport,
  ICompletedEventReportResponse,
} from '../types/completedEventReport.types';

export const toCompletedEventReportResponse = (
  record: ICompletedEventReport,
): ICompletedEventReportResponse => ({
  _id: record._id,
  eventTitle: record.eventTitle,
  eventType: record.eventType,
  date: record.date,
  venue: record.venue,
  coordinator: record.coordinator,
  participants: record.participants,
  summary: record.summary,
  description: record.description,
  photoUrls: record.photoUrls,
  generatedReportUrl: record.generatedReportUrl,
  approvedBy: record.approvedBy,
  createdAt: record.createdAt,
  updatedAt: record.updatedAt,
});
