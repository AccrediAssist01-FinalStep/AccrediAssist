'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowRightLeft, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ErpModuleId } from '@/config/modules';
import type { PendingRecord } from '@/types/api-models';
import {
  getMoveDestinationsForModule,
  isSameMoveDestination,
  MOVE_MODULE_OPTIONS,
  resolveCurrentMoveDestination,
} from '../config/move-destinations.config';
import { getApprovedModuleDestination } from '../utils/pending-review.utils';

interface PendingRecordMoveDialogProps {
  record: PendingRecord;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (payload: { moduleId: ErpModuleId; submoduleId: string }) => Promise<void>;
  isMoving?: boolean;
}

export function PendingRecordMoveDialog({
  record,
  open,
  onOpenChange,
  onConfirm,
  isMoving,
}: PendingRecordMoveDialogProps) {
  const [selectedModuleId, setSelectedModuleId] = useState<ErpModuleId | ''>('');
  const [selectedSubmoduleId, setSelectedSubmoduleId] = useState('');

  const currentDestination = useMemo(() => resolveCurrentMoveDestination(record), [record]);
  const approvedDestination = getApprovedModuleDestination(record);

  const submoduleOptions = useMemo(
    () =>
      selectedModuleId
        ? getMoveDestinationsForModule(selectedModuleId).filter(
            (option) => !isSameMoveDestination(currentDestination, option),
          )
        : [],
    [selectedModuleId, currentDestination],
  );

  useEffect(() => {
    if (!open) {
      setSelectedModuleId('');
      setSelectedSubmoduleId('');
    }
  }, [open]);

  useEffect(() => {
    setSelectedSubmoduleId('');
  }, [selectedModuleId]);

  if (!open) {
    return null;
  }

  const selectedSubmodule = submoduleOptions.find((option) => option.submoduleId === selectedSubmoduleId);

  const handleConfirm = async () => {
    if (!selectedModuleId || !selectedSubmoduleId) return;
    await onConfirm({ moduleId: selectedModuleId, submoduleId: selectedSubmoduleId });
    setSelectedModuleId('');
    setSelectedSubmoduleId('');
    onOpenChange(false);
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="move-record-title"
        className="relative z-[90] w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-elevated"
      >
        <button
          type="button"
          className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100"
          onClick={() => onOpenChange(false)}
          aria-label="Close"
        >
          <X className="size-4" />
        </button>

        <div className="flex items-center gap-2 pr-8">
          <ArrowRightLeft className="size-5 text-primary" />
          <h3 id="move-record-title" className="text-lg font-semibold">
            Move to Another Module
          </h3>
        </div>

        <p className="mt-2 text-sm text-muted-foreground">
          This record is currently stored as <span className="font-medium">{record.category}</span>
          {approvedDestination ? (
            <>
              {' '}
              in <span className="font-medium">{approvedDestination.label}</span>
            </>
          ) : null}
          . Choose the ERP module and submodule where it should appear instead.
        </p>

        <div className="mt-4 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="move-module">
              Module
            </label>
            <Select
              value={selectedModuleId}
              onValueChange={(value) => setSelectedModuleId(value as ErpModuleId)}
            >
              <SelectTrigger id="move-module" aria-label="ERP module">
                <SelectValue placeholder="Select Student, Faculty, or Department" />
              </SelectTrigger>
              <SelectContent className="z-[110]">
                {MOVE_MODULE_OPTIONS.map((module) => (
                  <SelectItem key={module.id} value={module.id}>
                    {module.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Conferences, Publications, and Patents are under{' '}
              <span className="font-medium">Faculty Activities</span>.
            </p>
          </div>

          {selectedModuleId ? (
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="move-submodule">
                Submodule
              </label>
              {currentDestination?.moduleId === selectedModuleId ? (
                <p className="text-xs text-muted-foreground">
                  Current location:{' '}
                  <span className="font-medium text-foreground">
                    {getMoveDestinationsForModule(selectedModuleId).find(
                      (option) => option.submoduleId === currentDestination.submoduleId,
                    )?.label ?? currentDestination.submoduleId}
                  </span>{' '}
                  (hidden from list)
                </p>
              ) : null}
              {submoduleOptions.length === 0 ? (
                <p className="rounded-lg border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
                  No other submodules available in this module.
                </p>
              ) : (
                <Select value={selectedSubmoduleId} onValueChange={setSelectedSubmoduleId}>
                  <SelectTrigger id="move-submodule" aria-label="Submodule">
                    <SelectValue placeholder="Select submodule" />
                  </SelectTrigger>
                  <SelectContent className="z-[110] max-h-60 overflow-y-auto">
                    {submoduleOptions.map((option) => (
                      <SelectItem key={option.submoduleId} value={option.submoduleId}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          ) : null}

          {selectedSubmodule ? (
            <p className="rounded-lg border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
              The record will be removed from its current module and recreated under{' '}
              <span className="font-medium text-foreground">{selectedSubmodule.label}</span>.
            </p>
          ) : null}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isMoving}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isMoving || !selectedModuleId || !selectedSubmoduleId}
          >
            Move Record
          </Button>
        </div>
      </div>
    </div>
  );
}
