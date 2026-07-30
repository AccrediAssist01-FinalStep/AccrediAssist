import { INews, INewsResponse } from '../types/news.types';

export const toNewsResponse = (record: INews & { language?: string }): INewsResponse => ({
  _id: record._id,
  headline: record.headline,
  articleText: record.articleText,
  articleLanguage: record.articleLanguage ?? record.language ?? 'Unknown',
  newspaperName: record.newspaperName,
  publicationDate: record.publicationDate?.toISOString(),
  peopleMentioned: record.peopleMentioned ?? [],
  organization: record.organization,
  department: record.department,
  articleCategory: record.articleCategory,
  summary: record.summary,
  confidenceScore: record.confidenceScore,
  imageUrl: record.imageUrl,
  sourceGroup: record.sourceGroup,
  sourceSender: record.sourceSender,
  createdAt: record.createdAt.toISOString(),
  updatedAt: record.updatedAt.toISOString(),
});
