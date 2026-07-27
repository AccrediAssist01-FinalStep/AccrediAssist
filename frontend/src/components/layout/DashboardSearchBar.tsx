'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Search, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardSearchBarProps {
  className?: string;
}

export function DashboardSearchBar({ className }: DashboardSearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = query.trim();
    if (trimmed) {
      router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    } else {
      router.push('/search');
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn('relative hidden flex-1 md:block md:max-w-md lg:max-w-lg', className)}
      role="search"
      aria-label="Smart search"
    >
      <Search
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted"
        aria-hidden="true"
      />
      <Sparkles
        className="pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-primary/60"
        aria-hidden="true"
      />
      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Ask AccrediAssist..."
        className="h-10 w-full rounded-xl border border-border bg-accent/50 pl-10 pr-10 text-sm shadow-soft outline-none transition-all placeholder:text-muted focus:border-primary focus:bg-card focus:ring-2 focus:ring-primary/20"
        aria-label="Ask AccrediAssist"
      />
    </form>
  );
}
