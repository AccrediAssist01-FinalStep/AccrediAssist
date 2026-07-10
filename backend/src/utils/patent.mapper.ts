import { IPatent, IPatentResponse } from '../types/patent.types';

export const toPatentResponse = (record: IPatent): IPatentResponse => ({
  _id: record._id,
  patentTitle: record.patentTitle,
  inventors: record.inventors,
  patentNumber: record.patentNumber,
  status: record.status,
  filingDate: record.filingDate,
  documentUrl: record.documentUrl,
  createdAt: record.createdAt,
  updatedAt: record.updatedAt,
});
