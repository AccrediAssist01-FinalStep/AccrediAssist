'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  getConfidenceBadgeVariant,
  getConfidenceLabel,
  getConfidenceLevel,
} from '../utils/pending-review.utils';

interface ConfidenceBadgeProps {
  score: number;
  className?: string;
  showLabel?: boolean;
}

export function ConfidenceBadge({ score, className, showLabel = true }: ConfidenceBadgeProps) {
  const level = getConfidenceLevel(score);
  const variant = getConfidenceBadgeVariant(level);

  return (
    <Badge
      variant={variant}
      className={cn('gap-1 tabular-nums', className)}
      aria-label={`AI confidence ${score} percent, ${getConfidenceLabel(level)}`}
    >
      {showLabel && <span className="hidden sm:inline">{getConfidenceLabel(level)}</span>}
      <span>{score}%</span>
    </Badge>
  );
}
