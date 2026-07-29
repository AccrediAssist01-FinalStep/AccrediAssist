import { enrichExtractionAchievementType } from '../ai/utils/achievement-inference.util';
import { resolveActivityClassification } from '../ai/utils/activity-module.util';
import { mapClassificationToRecordCategory } from '../ai/utils/category-mapper.util';
import { correctClassificationForExtraction } from '../ai/utils/classification-correction.util';
import { enrichExtractionFields } from '../ai/utils/extraction-enrichment.util';
import { calculatePipelineConfidenceScore } from '../ai/utils/pipeline-status.util';

const message = `Congratulations on the Successful Department Industry Visit Report!

Heartiest congratulations to the Department for the successful completion and presentation of the Industry Visit Report. This achievement reflects the team's dedication, effective planning, and commitment to providing practical exposure and industry-oriented learning to students.

The visit has strengthened the connection between academic knowledge and real-world industrial practices, making it a valuable learning experience for everyone involved.

Wishing the Department continued success in organizing many more insightful industry visits and achieving greater milestones in the future.

Congratulations once again, and best wishes for your future endeavors!`;

const raw = {
  title: 'Successful Department Industry Visit Report',
  description:
    'The Department successfully completed and presented an Industry Visit Report.',
  categoryHint: 'Department Event',
  confidence: 95,
};

const enriched = enrichExtractionFields(enrichExtractionAchievementType(raw), message);
const classification = correctClassificationForExtraction(
  { category: 'Student Achievement', confidence: 60, reasoning: 'wrong' },
  enriched,
  message,
);
const recordCategory = mapClassificationToRecordCategory(classification.category, enriched);
const activity = resolveActivityClassification(recordCategory, enriched);
const score = calculatePipelineConfidenceScore(enriched, classification, {
  validationStatus: 'valid',
  validationErrors: [],
});

const passed =
  classification.category === 'Completed Event Report' &&
  recordCategory === 'Industrial Visit' &&
  activity.module === 'Department Activities' &&
  activity.subCategory === 'Industrial Visit Reports' &&
  score >= 50;

console.log(
  JSON.stringify(
    {
      enriched,
      classification,
      recordCategory,
      activity,
      score,
      passed,
    },
    null,
    2,
  ),
);

if (!passed) {
  process.exitCode = 1;
}
