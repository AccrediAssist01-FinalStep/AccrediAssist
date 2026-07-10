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
