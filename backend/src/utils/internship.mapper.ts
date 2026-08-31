import { Types } from 'mongoose';
import { IInternship, IInternshipResponse } from '../types/internship.types';

export const toInternshipResponse = (record: IInternship): IInternshipResponse => ({
  _id: record._id,
  studentName: record.studentName,
  rollNumber: record.rollNumber,
  company: record.company,
  role: record.role,
  duration: record.duration,
  startDate: record.startDate,
  endDate: record.endDate,
  certificateUrl: record.certificateUrl,
  approvedBy: record.approvedBy as Types.ObjectId | undefined,
  createdAt: record.createdAt,
  updatedAt: record.updatedAt,
});
