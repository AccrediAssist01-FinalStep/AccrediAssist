'use client';

import { useState } from 'react';
import { Edit3, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import type { PendingRecord } from '@/types/api-models';
import { PendingRecordAIInsights } from './PendingRecordAIInsights';
import { PendingRecordEditForm, type EditFormValues } from './PendingRecordEditForm';
import { PendingRecordMedia } from './PendingRecordMedia';
import { PendingRecordTimeline } from './PendingRecordTimeline';
import { ConfidenceBadge } from './ConfidenceBadge';
import {
  canEditRecord,
  formatSubmittedDate,
  getEditableFields,
  getRecordDepartment,
  getRecordTitle,
  getStatusBadgeVariant,
} from '../utils/pending-review.utils';
import { usePendingReviewMutations } from '../hooks/use-pending-mutations';

interface PendingRecordDrawerProps {
  record: PendingRecord | null;
  isLoading?: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onActionComplete?: () => void;
}

function ExtractedFieldsView({ record }: { record: PendingRecord }) {
  const fields = getEditableFields(record);

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {fields.map((field) => (
        <div key={field.key} className="rounded-lg border border-border bg-card/60 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">{field.label}</p>
          <p className="mt-1 text-sm">{field.value || '—'}</p>
        </div>
      ))}
    </div>
  );
}

export function PendingRecordDrawer({
  record,
  isLoading,
  open,
  onOpenChange,
  onActionComplete,
}: PendingRecordDrawerProps) {
  const [mode, setMode] = useState<'preview' | 'edit'>('preview');
  const { editMutation, isMutating } = usePendingReviewMutations();

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) {
      setMode('preview');
    }
    onOpenChange(nextOpen);
  };

  const handleSave = async (values: EditFormValues) => {
    if (!record) return;

    const extractedData = {
      title: values.title || null,
      description: values.description || null,
      studentName: values.studentName || null,
      facultyName: values.facultyName || null,
      company: values.company || null,
      organization: values.organization || null,
      eventName: values.eventName || null,
      publicationTitle: values.publicationTitle || null,
      patentTitle: values.patentTitle || null,
      internship: values.internship || null,
      placement: values.placement || null,
      date: values.date || null,
      location: values.location || null,
    };

    await editMutation.mutateAsync({
      id: record._id,
      payload: {
        category: values.category as PendingRecord['category'],
        confidenceScore: values.confidenceScore,
        extractedData,
      },
    });
    setMode('preview');
  };

  const title = record ? getRecordTitle(record) : 'Record Details';

  return (
    <>
      <Sheet open={open} onOpenChange={handleClose}>
        <SheetContent side="right" className="w-full p-0 sm:max-w-2xl">
          <SheetHeader className="border-b border-border px-6 py-5">
            {isLoading || !record ? (
              <div className="space-y-3">
                <Skeleton className="h-6 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-2 pr-8">
                  <Badge variant="outline">{record.category}</Badge>
                  <Badge variant={getStatusBadgeVariant(record.status)}>{record.status}</Badge>
                  <ConfidenceBadge score={record.confidenceScore} />
                </div>
                <SheetTitle className="text-left">{title}</SheetTitle>
                <SheetDescription className="text-left">
                  {getRecordDepartment(record)} · {formatSubmittedDate(record.createdAt)} · WhatsApp
                </SheetDescription>
              </>
            )}
          </SheetHeader>

          <ScrollArea className="h-[calc(100vh-11rem)]">
            <motion.div
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6 p-6"
            >
              {isLoading || !record ? (
                <div className="space-y-4">
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-48 w-full" />
                  <Skeleton className="h-40 w-full" />
                </div>
              ) : (
                <>
                  <PendingRecordAIInsights record={record} />

                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">
                        Extracted Information
                      </h3>
                      {canEditRecord(record) && mode === 'preview' && (
                        <Button variant="outline" size="sm" onClick={() => setMode('edit')}>
                          <Edit3 className="size-4" />
                          Edit
                        </Button>
                      )}
                    </div>

                    {mode === 'edit' ? (
                      <PendingRecordEditForm
                        record={record}
                        onSave={handleSave}
                        onCancel={() => setMode('preview')}
                        isSaving={editMutation.isPending}
                      />
                    ) : (
                      <ExtractedFieldsView record={record} />
                    )}
                  </div>

                  <PendingRecordMedia record={record} />
                  <PendingRecordTimeline record={record} />

                  {record.extractedData?.aiPipeline && (
                    <div className="rounded-lg border border-border bg-card/60 p-4">
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">
                        Gemini Extraction Summary
                      </h3>
                      <div className="mt-3 grid gap-2 text-sm">
                        {record.extractedData.aiPipeline.models && (
                          <p className="text-muted">
                            Models: {Object.values(record.extractedData.aiPipeline.models).filter(Boolean).join(', ')}
                          </p>
                        )}
                        {record.extractedData.aiPipeline.classification?.category && (
                          <p>
                            Classified as{' '}
                            <span className="font-medium">{record.extractedData.aiPipeline.classification.category}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          </ScrollArea>

          {record && canEditRecord(record) && mode === 'preview' && (
            <div className="sticky bottom-0 flex flex-wrap gap-2 border-t border-border bg-card p-4">
              <Button variant="secondary" onClick={() => setMode('edit')} disabled={isMutating}>
                <Edit3 className="size-4" />
                Edit Extracted Fields
              </Button>
              <Button variant="outline" onClick={() => setMode('preview')} disabled={isMutating}>
                <Eye className="size-4" />
                Preview
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
