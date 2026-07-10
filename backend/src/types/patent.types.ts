import { PatentStatus } from '../database/enums';
import { IBaseDocument } from './base.types';

export interface IPatent extends IBaseDocument {
  patentTitle: string;
  inventors: string[];
  patentNumber?: string;
  status: PatentStatus;
  filingDate?: Date;
  documentUrl?: string;
}

export interface CreatePatentInput {
  patentTitle: string;
  inventors?: string[];
  patentNumber?: string;
  status: PatentStatus;
  filingDate?: Date;
  documentUrl?: string;
}

export interface UpdatePatentInput {
  patentTitle?: string;
  inventors?: string[];
  patentNumber?: string;
  status?: PatentStatus;
  filingDate?: Date;
  documentUrl?: string;
}
