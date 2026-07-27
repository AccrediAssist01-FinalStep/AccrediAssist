'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { pendingReviewService } from '@/services/pending-review.service';
import type { EditPendingRecordPayload, RejectPendingRecordPayload } from '@/types/api-models';

export function usePendingReviewMutations() {
  const queryClient = useQueryClient();

  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['pending-records'] }),
      queryClient.invalidateQueries({ queryKey: ['pending-record'] }),
      queryClient.invalidateQueries({ queryKey: ['pending-review-stats'] }),
      queryClient.invalidateQueries({ queryKey: ['dashboard-enterprise'] }),
    ]);
  };

  const editMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: EditPendingRecordPayload }) =>
      pendingReviewService.edit(id, payload),
    onSuccess: async () => {
      toast.success('Record updated successfully');
      await invalidate();
    },
    onError: () => toast.error('Failed to save changes. Please try again.'),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => pendingReviewService.approve(id),
    onSuccess: async () => {
      toast.success('Record approved and added to ERP database');
      await invalidate();
    },
    onError: (error: unknown) => {
      const message =
        error && typeof error === 'object' && 'response' in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      toast.error(message || 'Approval failed. Check required fields and try again.');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: RejectPendingRecordPayload }) =>
      pendingReviewService.reject(id, payload),
    onSuccess: async () => {
      toast.success('Record rejected');
      await invalidate();
    },
    onError: () => toast.error('Failed to reject record. Please try again.'),
  });

  return {
    editMutation,
    approveMutation,
    rejectMutation,
    isMutating:
      editMutation.isPending || approveMutation.isPending || rejectMutation.isPending,
  };
}
