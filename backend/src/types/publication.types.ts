import { Types } from 'mongoose';
import { IBaseDocument } from './base.types';

export interface IPublication extends IBaseDocument {
  facultyName: string;
  paperTitle: string;
  journal?: string;
  conference?: string;
  authors: string[];
  doi?: string;
  publicationDate?: Date;
  documentUrl?: string;
}

export interface CreatePublicationInput {
  facultyName: string;
  paperTitle: string;
  journal?: string;
  conference?: string;
  authors?: string[];
  doi?: string;
  publicationDate?: Date;
  documentUrl?: string;
}

export interface UpdatePublicationInput {
  facultyName?: string;
  paperTitle?: string;
  journal?: string;
  conference?: string;
  authors?: string[];
  doi?: string;
  publicationDate?: Date;
  documentUrl?: string;
}

export interface IPublicationResponse {
  _id: Types.ObjectId;
  facultyName: string;
  paperTitle: string;
  journal?: string;
  conference?: string;
  authors: string[];
  doi?: string;
  publicationDate?: Date;
  documentUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PublicationFilters {
  search?: string;
  facultyName?: string;
  journal?: string;
  conference?: string;
  fromDate?: Date;
  toDate?: Date;
}

export interface PublicationSort {
  sortBy: 'facultyName' | 'paperTitle' | 'publicationDate' | 'createdAt';
  sortOrder: 'asc' | 'desc';
}
