'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { featureRecordsService } from '@/services/feature-records.service';

export function useFeatureRecordMutations(configId: string, apiPath: string) {
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      featureRecordsService.update(apiPath, id, payload),
    onSuccess: async (record, variables) => {
      toast.success('Record updated successfully');
      queryClient.setQueryData(['feature-record', configId, variables.id], record);
      await queryClient.invalidateQueries({ queryKey: ['feature-records', configId] });
    },
    onError: (error: unknown) => {
      const message =
        error && typeof error === 'object' && 'response' in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      toast.error(message || 'Failed to save changes. Please try again.');
    },
  });

  return { updateMutation };
}
