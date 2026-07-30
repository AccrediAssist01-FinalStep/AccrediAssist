import mongoose, { Schema } from 'mongoose';
import { INews, NEWS_ARTICLE_CATEGORIES } from '../types/news.types';
import { applyBaseSchema, baseSchemaOptions, enumField } from '../database';

const urlValidator = {
  validator: (value: string) => !value || /^https?:\/\/.+/.test(value),
  message: 'Must be a valid URL',
};

const newsSchema = new Schema<INews>(
  {
    headline: {
      type: String,
      required: [true, 'Headline is required'],
      trim: true,
      maxlength: [500, 'Headline cannot exceed 500 characters'],
    },
    articleText: {
      type: String,
      required: [true, 'Article text is required'],
      trim: true,
      maxlength: [20000, 'Article text cannot exceed 20000 characters'],
    },
    articleLanguage: {
      type: String,
      required: [true, 'Language is required'],
      trim: true,
      maxlength: [50, 'Language cannot exceed 50 characters'],
    },
    /** @deprecated Legacy field — use articleLanguage */
    language: {
      type: String,
      trim: true,
      maxlength: [50],
    },
    newspaperName: {
      type: String,
      trim: true,
      maxlength: [200, 'Newspaper name cannot exceed 200 characters'],
    },
    publicationDate: {
      type: Date,
    },
    peopleMentioned: {
      type: [String],
      default: [],
    },
    organization: {
      type: String,
      trim: true,
      maxlength: [200, 'Organization cannot exceed 200 characters'],
    },
    department: {
      type: String,
      trim: true,
      maxlength: [200, 'Department cannot exceed 200 characters'],
    },
    articleCategory: {
      type: String,
      enum: enumField(NEWS_ARTICLE_CATEGORIES, 'article category'),
      required: [true, 'Article category is required'],
    },
    summary: {
      type: String,
      trim: true,
      maxlength: [2000, 'Summary cannot exceed 2000 characters'],
    },
    confidenceScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    imageUrl: {
      type: String,
      required: [true, 'Image URL is required'],
      trim: true,
      validate: urlValidator,
    },
    sourceGroup: {
      type: String,
      trim: true,
      maxlength: [200, 'Source group cannot exceed 200 characters'],
    },
    sourceSender: {
      type: String,
      trim: true,
      maxlength: [100, 'Source sender cannot exceed 100 characters'],
    },
    originalMessage: {
      type: String,
      trim: true,
      maxlength: [5000, 'Original message cannot exceed 5000 characters'],
    },
  },
  {
    ...baseSchemaOptions,
    collection: 'news',
  },
);

applyBaseSchema(newsSchema);

newsSchema.post('init', function normalizeLegacyLanguage(this: INews & { language?: string }) {
  if (!this.articleLanguage && this.language) {
    this.articleLanguage = this.language;
  }
});

newsSchema.index({ articleCategory: 1 });
newsSchema.index({ articleLanguage: 1 });
newsSchema.index({ publicationDate: -1 });
newsSchema.index({ createdAt: -1 });
newsSchema.index(
  {
    headline: 'text',
    articleText: 'text',
    newspaperName: 'text',
    summary: 'text',
    peopleMentioned: 'text',
    organization: 'text',
    department: 'text',
  },
  { name: 'search_text_index', default_language: 'none' },
);

export const News = mongoose.model<INews>('News', newsSchema);
