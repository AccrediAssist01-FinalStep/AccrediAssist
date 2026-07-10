import mongoose, { Schema } from 'mongoose';
import { IPublication } from '../types/publication.types';
import { applyBaseSchema, baseSchemaOptions } from '../database';

const urlValidator = {
  validator: (value: string) => !value || /^https?:\/\/.+/.test(value),
  message: 'Must be a valid URL',
};

const publicationSchema = new Schema<IPublication>(
  {
    facultyName: {
      type: String,
      required: [true, 'Faculty name is required'],
      trim: true,
      maxlength: [100, 'Faculty name cannot exceed 100 characters'],
    },
    paperTitle: {
      type: String,
      required: [true, 'Paper title is required'],
      trim: true,
      maxlength: [500, 'Paper title cannot exceed 500 characters'],
    },
    journal: {
      type: String,
      trim: true,
      maxlength: [200, 'Journal cannot exceed 200 characters'],
    },
    conference: {
      type: String,
      trim: true,
      maxlength: [200, 'Conference cannot exceed 200 characters'],
    },
    authors: {
      type: [String],
      default: [],
    },
    doi: {
      type: String,
      trim: true,
      maxlength: [100, 'DOI cannot exceed 100 characters'],
    },
    publicationDate: {
      type: Date,
    },
    documentUrl: {
      type: String,
      trim: true,
      validate: urlValidator,
    },
  },
  {
    ...baseSchemaOptions,
    collection: 'publications',
  },
);

applyBaseSchema(publicationSchema);

publicationSchema.index({ facultyName: 1 });
publicationSchema.index({ paperTitle: 1 });
publicationSchema.index({ publicationDate: -1 });

export const Publication = mongoose.model<IPublication>('Publication', publicationSchema);
