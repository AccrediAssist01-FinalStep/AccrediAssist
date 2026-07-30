'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Edit3, ExternalLink, RefreshCw, XCircle } from 'lucide-react';
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
import { AiGeneratedReportPreview } from './AiGeneratedReportPreview';
import { ConfidenceBadge } from './ConfidenceBadge';
import {
  canApproveOrReject,
  canEditRecord,
  canRegenerateAiReport,
  formatSubmittedDate,
  getApprovedModuleDestination,
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
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const { editMutation, approveMutation, rejectMutation, regenerateMutation, isMutating } =
    usePendingReviewMutations();

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

  const handleApprove = async () => {
    if (!record) return;
    await approveMutation.mutateAsync(record._id);
    onActionComplete?.();
    onOpenChange(false);
  };

  const handleReject = async () => {
    if (!record || !rejectReason.trim()) return;
    await rejectMutation.mutateAsync({
      id: record._id,
      payload: { reason: rejectReason.trim() },
    });
    setRejectOpen(false);
    setRejectReason('');
    onActionComplete?.();
    onOpenChange(false);
  };

  const handleRegenerate = async () => {
    if (!record) return;
    await regenerateMutation.mutateAsync(record._id);
    onActionComplete?.();
  };

  const title = record ? getRecordTitle(record) : 'Record Details';
  const approvedDestination = record ? getApprovedModuleDestination(record) : null;

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
                  <AiGeneratedReportPreview record={record} />

                  {approvedDestination ? (
                    <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4">
                      <p className="text-sm text-muted-foreground">
                        This record was stored in the ERP module below after auto-approval.
                      </p>
                      <Button asChild className="mt-3" size="sm">
                        <Link href={approvedDestination.href}>
                          <ExternalLink className="size-4" />
                          Open {approvedDestination.label}
                        </Link>
                      </Button>
                    </div>
                  ) : null}

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
              {canApproveOrReject(record) && (
                <>
                  <Button onClick={handleApprove} disabled={isMutating}>
                    <CheckCircle2 className="size-4" />
                    Approve
                  </Button>
                  <Button variant="destructive" onClick={() => setRejectOpen(true)} disabled={isMutating}>
                    <XCircle className="size-4" />
                    Reject
                  </Button>
                </>
              )}
              {canRegenerateAiReport(record) && (
                <Button variant="secondary" onClick={handleRegenerate} disabled={isMutating}>
                  <RefreshCw className="size-4" />
                  Regenerate AI Report
                </Button>
              )}
              <Button variant="outline" onClick={() => setMode('edit')} disabled={isMutating}>
                <Edit3 className="size-4" />
                Edit Extracted Fields
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {rejectOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-elevated">
            <h3 className="text-lg font-semibold">Reject Record</h3>
            <p className="mt-1 text-sm text-muted">Provide a reason for rejecting this AI report.</p>
            <textarea
              className="mt-4 min-h-24 w-full rounded-md border border-border bg-background p-3 text-sm"
              value={rejectReason}
              onChange={(event) => setRejectReason(event.target.value)}
              placeholder="Reason for rejection"
            />
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRejectOpen(false)} disabled={isMutating}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleReject} disabled={isMutating || !rejectReason.trim()}>
                Confirm Reject
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
