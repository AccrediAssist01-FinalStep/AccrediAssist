'use client';

import { AlertTriangle, CheckCircle2, Copy, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { PendingRecord } from '@/types/api-models';
import { ConfidenceBadge } from './ConfidenceBadge';
import { buildAiInsights, getConfidenceLabel } from '../utils/pending-review.utils';

interface PendingRecordAIInsightsProps {
  record: PendingRecord;
}

export function PendingRecordAIInsights({ record }: PendingRecordAIInsightsProps) {
  const insights = buildAiInsights(record);
  const pipeline = record.extractedData?.aiPipeline;

  return (
    <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="size-4 text-primary" aria-hidden="true" />
          AI Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-border bg-card/80 p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">Confidence</p>
            <div className="mt-2 flex items-center gap-2">
              <ConfidenceBadge score={insights.confidence} />
              <span className="text-xs text-muted">{getConfidenceLabel(insights.confidenceLevel)}</span>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card/80 p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">Validation Status</p>
            <div className="mt-2 flex items-center gap-2">
              {insights.validationStatus === 'valid' ? (
                <Badge variant="success" className="gap-1">
                  <CheckCircle2 className="size-3" />
                  Valid
                </Badge>
              ) : insights.validationStatus === 'invalid' ? (
                <Badge variant="destructive" className="gap-1">
                  <AlertTriangle className="size-3" />
                  Invalid
                </Badge>
              ) : (
                <Badge variant="secondary">Unknown</Badge>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card/80 p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">Duplicate Status</p>
            <div className="mt-2">
              {insights.duplicateStatus === 'duplicate' ? (
                <Badge variant="destructive" className="gap-1">
                  <Copy className="size-3" />
                  Duplicate Detected
                </Badge>
              ) : insights.duplicateStatus === 'possible' ? (
                <Badge variant="warning" className="gap-1">
                  <Copy className="size-3" />
                  Possible Duplicate
                </Badge>
              ) : (
                <Badge variant="success">No Duplicate</Badge>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card/80 p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">Recommended Action</p>
            <p className="mt-2 text-sm leading-relaxed">{insights.recommendedAction}</p>
          </div>
        </div>

        {pipeline?.classification?.reasoning && (
          <div className="rounded-lg border border-border bg-card/60 p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">Gemini Classification</p>
            <p className="mt-2 text-sm text-muted">{pipeline.classification.reasoning}</p>
          </div>
        )}

        {pipeline?.validation?.validationErrors && pipeline.validation.validationErrors.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">Validation Results</p>
            {pipeline.validation.validationErrors.map((error, index) => (
              <div key={`${error.code}-${index}`} className="rounded-md border border-danger/20 bg-danger/5 px-3 py-2 text-sm">
                {error.message}
              </div>
            ))}
          </div>
        )}

        {pipeline?.duplicateDetection?.duplicate && pipeline.duplicateDetection.matchingRecordId && (
          <div className="rounded-md border border-warning/20 bg-warning/5 px-3 py-2 text-sm">
            Matching record ID: {pipeline.duplicateDetection.matchingRecordId}
            {pipeline.duplicateDetection.similarityScore != null && (
              <span className="text-muted"> ({Math.round(pipeline.duplicateDetection.similarityScore * 100)}% similarity)</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
