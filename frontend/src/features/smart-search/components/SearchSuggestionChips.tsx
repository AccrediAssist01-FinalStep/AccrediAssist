'use client';

import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { SEARCH_SUGGESTIONS } from '../types';

interface SearchSuggestionChipsProps {
  onSelect: (query: string) => void;
}

export function SearchSuggestionChips({ onSelect }: SearchSuggestionChipsProps) {
  return (
    <div className="space-y-3">
      <p className="text-center text-sm font-medium text-muted">Try searching for</p>
      <div className="flex flex-wrap justify-center gap-2">
        {SEARCH_SUGGESTIONS.map((suggestion, index) => (
          <motion.button
            key={suggestion.label}
            type="button"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.04 }}
            whileHover={{ y: -2 }}
            onClick={() => onSelect(suggestion.query)}
            className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={`Search suggestion: ${suggestion.label}`}
          >
            <Badge
              variant="outline"
              className="cursor-pointer px-3 py-1.5 text-sm transition-colors hover:bg-accent"
            >
              {suggestion.label}
            </Badge>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
