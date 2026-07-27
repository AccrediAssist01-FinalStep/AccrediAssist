'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/AppShell';
import { SearchBox } from '@/components/common/SearchBox';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { Pagination } from '@/components/common/Pagination';
import { EmptySearchIllustration } from '@/components/illustrations';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCardsSkeleton } from '@/components/common/LoadingSkeletons';
import { searchService } from '@/services/search.service';
import type { GlobalSearchResponse } from '@/types/api-models';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GlobalSearchResponse | null>(null);
  const [page, setPage] = useState(1);

  const searchMutation = useMutation({
    mutationFn: (searchQuery: string) =>
      searchService.globalSearch({ query: searchQuery, page, limit: 10 }),
    onSuccess: (data) => {
      setResults(data);
      if (data.results.length === 0) {
        toast.info('No results found for your query');
      }
    },
    onError: () => toast.error('Search failed. Please try again.'),
  });

  const handleSearch = () => {
    if (!query.trim()) {
      toast.error('Please enter a search query');
      return;
    }
    searchMutation.mutate(query);
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Smart Search"
        description="Search across all accreditation records using natural language powered by Gemini AI."
        action={
          <Badge variant="secondary" className="gap-1">
            <Sparkles className="size-3" />
            AI-Powered
          </Badge>
        }
      />

      <Card className="overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row">
            <SearchBox
              value={query}
              onChange={setQuery}
              onSubmit={handleSearch}
              placeholder='Try "Students placed in TCS" or "Faculty publications on AI"'
              className="flex-1"
            />
            <Button onClick={handleSearch} isLoading={searchMutation.isPending} size="lg">
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {searchMutation.isPending && <StatCardsSkeleton count={3} />}

      {searchMutation.isError && <ErrorState onRetry={handleSearch} />}

      {results && !searchMutation.isPending && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge>{results.understanding.collection}</Badge>
            {results.understanding.confidence && (
              <Badge variant="success">{results.understanding.confidence}% confidence</Badge>
            )}
            <span className="text-sm text-muted">{results.meta.total} results found</span>
          </div>

          {results.results.length === 0 ? (
            <EmptyState
              illustration={<EmptySearchIllustration className="size-32" />}
              title="No results found"
              description="Try rephrasing your query or using different keywords."
            />
          ) : (
            <div className="grid gap-4">
              {results.results.map((item, index) => (
                <motion.div
                  key={item.recordId}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <Card>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{item.summary}</CardTitle>
                        <Badge variant="outline">{item.collection}</Badge>
                      </div>
                    </CardHeader>
                  </Card>
                </motion.div>
              ))}
              <Pagination
                page={results.meta.page}
                totalPages={results.meta.totalPages}
                onPageChange={(newPage) => {
                  setPage(newPage);
                  searchMutation.mutate(query);
                }}
              />
            </div>
          )}
        </motion.div>
      )}

      {!results && !searchMutation.isPending && (
        <EmptyState
          illustration={<EmptySearchIllustration className="size-40" />}
          title="Start searching"
          description="Use natural language to find placements, internships, achievements, publications, and more."
        />
      )}
    </div>
  );
}
