'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { featureRecordsService } from '@/services/feature-records.service';

const getErrorMessage = (error: unknown): string | undefined =>
  error && typeof error === 'object' && 'response' in error
    ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
    : undefined;

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
      toast.error(getErrorMessage(error) || 'Failed to save changes. Please try again.');
    },
  });

  const createMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => featureRecordsService.create(apiPath, payload),
    onSuccess: async () => {
      toast.success('Record added successfully');
      await queryClient.invalidateQueries({ queryKey: ['feature-records', configId] });
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error) || 'Failed to add record. Please try again.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => featureRecordsService.delete(apiPath, id),
    onSuccess: async (_result, id) => {
      toast.success('Record deleted successfully');
      queryClient.removeQueries({ queryKey: ['feature-record', configId, id] });
      await queryClient.invalidateQueries({ queryKey: ['feature-records', configId] });
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error) || 'Failed to delete record. Please try again.');
    },
  });

  return { updateMutation, createMutation, deleteMutation };
}
