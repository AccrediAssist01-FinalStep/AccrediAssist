/**
 * Integration verification for PDF extraction, News detection, and core services.
 * Run: npx tsx src/scripts/test-ai-extensions-integration.ts
 */

import mongoose from 'mongoose';
import { env } from '../config/env';
import { isCloudinaryConfigured } from '../config/cloudinary';
import { geminiProvider } from '../ai/providers/gemini.provider';
import { isNonInstitutionalMessage } from '../ai/utils/message-validation.util';
import { normalizePdfDocumentResult } from '../ai/utils/pdf-document-result.util';
import { normalizeNewsDetectionResult } from '../ai/utils/news-detection-result.util';
import { mapPdfCategoryToRecordCategory } from '../ai/utils/pdf-document-mapper.util';
import { News } from '../models/News';
import { SMART_SEARCH_COLLECTIONS } from '../search/config/search-collections.config';
import { GENERATION_REPORT_TYPES } from '../report-generation/config/report-types.config';

const results: Array<{ name: string; ok: boolean; detail: string }> = [];

const record = (name: string, ok: boolean, detail: string) => {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}: ${name} — ${detail}`);
};

async function main() {
  console.log('Running AI extensions integration verification...\n');

  try {
    const gemini = await geminiProvider.generateText({
      prompt: 'Reply with exactly: GEMINI_OK',
      temperature: 0,
    });
    record('Gemini API', gemini.content.includes('GEMINI_OK'), gemini.model);
  } catch (error) {
    record(
      'Gemini API',
      false,
      error instanceof Error ? error.message : String(error),
    );
  }

  record('Cloudinary configured', isCloudinaryConfigured(), env.CLOUDINARY_CLOUD_NAME ?? 'missing');

  try {
    await mongoose.connect(env.MONGODB_URI);
    record('MongoDB connection', true, mongoose.connection.name);
    const newsIndexes = await News.collection.indexes();
    record('News collection/model', newsIndexes.length > 0, `${newsIndexes.length} indexes`);
    await mongoose.disconnect();
  } catch (error) {
    record(
      'MongoDB connection',
      false,
      error instanceof Error ? error.message : String(error),
    );
  }

  record(
    'WhatsApp casual message filter',
    isNonInstitutionalMessage({ message: 'Hi', sender: 'Test', groupName: 'G', timestamp: new Date() } as never),
    'Hi ignored',
  );
  record(
    'WhatsApp institutional message kept',
    !isNonInstitutionalMessage({
      message: 'Student placed at Infosys with 8 LPA package',
      sender: 'Test',
      groupName: 'G',
      timestamp: new Date(),
    } as never),
    'Placement message processed',
  );

  const pdf = normalizePdfDocumentResult({
    documentType: 'Placement Offer Letter',
    extractedText: 'Offer letter for Rahul Patil at Infosys.',
    summary: 'Placement offer for Rahul Patil.',
    suggestedCategory: 'Placement',
    studentName: 'Rahul Patil',
    facultyName: null,
    company: 'Infosys',
    organization: null,
    eventName: null,
    date: '2026-07-01',
    department: 'CSE',
    achievement: null,
    title: 'Infosys Offer Letter',
    confidence: 92,
  });
  record(
    'PDF extraction normalization',
    mapPdfCategoryToRecordCategory(pdf) === 'Placement',
    pdf.documentType,
  );

  const news = normalizeNewsDetectionResult({
    isNewspaperArticle: true,
    rejectedImageType: null,
    headline: 'College wins national award',
    articleText: 'The college received national recognition for innovation.',
    language: 'English',
    newspaperName: 'Daily Herald',
    publicationDate: '2026-07-01',
    peopleMentioned: ['Dr. Meera'],
    organization: 'Daily Herald',
    department: 'Mechanical Engineering',
    articleCategory: 'Department News',
    summary: 'Department featured in newspaper.',
    confidence: 94,
    reasoning: 'Printed newspaper article layout detected.',
  });
  record('News detection normalization', news.isNewspaperArticle, news.headline ?? 'missing headline');

  const rejected = normalizeNewsDetectionResult({
    isNewspaperArticle: false,
    rejectedImageType: 'selfie',
    headline: null,
    articleText: null,
    language: null,
    newspaperName: null,
    publicationDate: null,
    peopleMentioned: null,
    organization: null,
    department: null,
    articleCategory: null,
    summary: null,
    confidence: 98,
    reasoning: 'Selfie image, not a newspaper clipping.',
  });
  record('Non-newspaper image rejection', !rejected.isNewspaperArticle, rejected.rejectedImageType ?? 'none');

  record(
    'Smart Search includes news',
    SMART_SEARCH_COLLECTIONS.includes('news'),
    SMART_SEARCH_COLLECTIONS.join(', '),
  );

  record(
    'Reports include News type',
    GENERATION_REPORT_TYPES.includes('News'),
    GENERATION_REPORT_TYPES.join(', '),
  );

  const failed = results.filter((item) => !item.ok);
  console.log(`\nSummary: ${results.length - failed.length}/${results.length} checks passed`);
  if (failed.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
