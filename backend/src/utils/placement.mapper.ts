import { IPlacement, IPlacementResponse } from '../types/placement.types';

export const toPlacementResponse = (record: IPlacement): IPlacementResponse => ({
  _id: record._id,
  studentName: record.studentName,
  rollNumber: record.rollNumber,
  department: record.department,
  company: record.company,
  role: record.role,
  package: record.package,
  joiningDate: record.joiningDate,
  offerLetter: record.offerLetter,
  approvedBy: record.approvedBy,
  createdAt: record.createdAt,
  updatedAt: record.updatedAt,
});
