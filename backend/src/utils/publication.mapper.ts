import { IPublication, IPublicationResponse } from '../types/publication.types';

export const toPublicationResponse = (record: IPublication): IPublicationResponse => ({
  _id: record._id,
  facultyName: record.facultyName,
  paperTitle: record.paperTitle,
  journal: record.journal,
  conference: record.conference,
  authors: record.authors,
  doi: record.doi,
  publicationDate: record.publicationDate,
  documentUrl: record.documentUrl,
  createdAt: record.createdAt,
  updatedAt: record.updatedAt,
});
