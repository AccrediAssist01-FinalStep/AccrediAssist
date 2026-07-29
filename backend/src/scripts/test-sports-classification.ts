/**
 * Quick test for sports achievement classification (badminton case).
 * Run: npm run test:sports-classification
 */

import { mapClassificationToRecordCategory } from '../ai/utils/category-mapper.util';
import { resolveActivityClassification } from '../ai/utils/activity-module.util';
import { enrichExtractionAchievementType, inferAchievementTypeFromText } from '../ai/utils/achievement-inference.util';
import type { ExtractionResult } from '../ai/interfaces/extraction.interface';

const BADMINTON_MESSAGE = `Congratulations to Mr./Ms. Rahul Sharma!

Heartiest congratulations to Rahul Sharma, a proud student of the Mechanical Engineering Department, for winning a prize in Badminton. Your outstanding achievement is a reflection of your hard work, dedication, and perseverance.

You have brought immense pride to your department and the entire institution.`;

const extraction: ExtractionResult = {
  title: 'Prize in Badminton',
  description: BADMINTON_MESSAGE,
  categoryHint: null,
  studentNames: ['Rahul Sharma'],
  facultyNames: null,
  company: null,
  organization: null,
  eventName: null,
  eventType: null,
  achievementType: null,
  publicationTitle: null,
  patentTitle: null,
  internship: null,
  placement: null,
  certificates: null,
  mediaReferences: null,
  date: null,
  location: null,
  confidence: 90,
};

const enriched = enrichExtractionAchievementType(extraction);
const category = mapClassificationToRecordCategory('Student Achievement', enriched);
const activity = resolveActivityClassification(category, enriched);

console.log('Inferred achievementType:', inferAchievementTypeFromText(extraction));
console.log('Enriched achievementType:', enriched.achievementType);
console.log('Record category:', category);
console.log('Activity module:', activity.module);
console.log('Activity subCategory:', activity.subCategory);

if (category !== 'Sports') {
  console.error('FAIL: Expected category Sports, got', category);
  process.exit(1);
}

if (activity.subCategory !== 'Sports') {
  console.error('FAIL: Expected subCategory Sports, got', activity.subCategory);
  process.exit(1);
}

console.log('PASS: Badminton message classified as Sports');
