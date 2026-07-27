'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Search, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { PLACEHOLDER_EXAMPLES } from '../types';

interface AISearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isLoading?: boolean;
}

export function AISearchBar({ value, onChange, onSubmit, isLoading }: AISearchBarProps) {
  const [focused, setFocused] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  useEffect(() => {
    if (value) return;
    const timer = window.setInterval(() => {
      setPlaceholderIndex((current) => (current + 1) % PLACEHOLDER_EXAMPLES.length);
    }, 3500);
    return () => window.clearInterval(timer);
  }, [value]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto w-full max-w-3xl"
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
        className="relative"
        aria-label="Smart search form"
      >
        <div
          className={cn(
            'rounded-2xl p-[1.5px] transition-all duration-300',
            focused
              ? 'bg-gradient-to-r from-primary via-violet-500 to-cyan-500 shadow-elevated'
              : 'bg-gradient-to-r from-border via-border to-border',
          )}
        >
          <div className="flex items-center gap-3 rounded-[calc(1rem-1.5px)] bg-card px-4 py-3 md:px-5 md:py-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <Search className="size-5 text-primary" aria-hidden="true" />
            </div>

            <Input
              value={value}
              onChange={(event) => onChange(event.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder={PLACEHOLDER_EXAMPLES[placeholderIndex]}
              className="h-12 border-0 bg-transparent px-0 text-base shadow-none focus-visible:ring-0 md:text-lg"
              aria-label="Search query"
            />

            <Button type="submit" size="lg" isLoading={isLoading} className="shrink-0 gap-2">
              <Sparkles className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">Search</span>
              <ArrowRight className="size-4 sm:hidden" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </form>
    </motion.div>
  );
}
