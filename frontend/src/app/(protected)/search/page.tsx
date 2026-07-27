'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { TableSkeleton } from '@/components/common/LoadingSkeletons';
import { EmptySearchIllustration } from '@/components/illustrations';
import {
  AISearchBar,
  DEFAULT_SEARCH_STATE,
  RecentSearches,
  SearchFiltersBar,
  SearchResultDrawer,
  SearchResultsTable,
  SearchSuggestionChips,
  SearchUnderstandingBanner,
  SmartSearchHeader,
  exportResultsToCsv,
  filterResults,
  sortResultsClient,
  toSearchRequest,
  useSearchHistory,
  useSmartSearch,
  type SmartSearchState,
} from '@/features/smart-search';
import type { SearchResultItem } from '@/types/api-models';

export default function SearchPage() {
  const searchParams = useSearchParams();
  const [state, setState] = useState<SmartSearchState>(DEFAULT_SEARCH_STATE);
  const [selectedItem, setSelectedItem] = useState<SearchResultItem | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { statusQuery, results, isSearching, isError, searchAsync } = useSmartSearch();
  const { items: historyItems, isLoading: historyLoading, clearAll, isClearing, dismiss } =
    useSearchHistory();

  const updateState = useCallback((patch: Partial<SmartSearchState>) => {
    setState((current) => ({ ...current, ...patch }));
  }, []);

  const runSearch = useCallback(
    async (override?: Partial<SmartSearchState>) => {
      const nextState = { ...state, ...override };
      const query = nextState.query.trim();

      if (!query) {
        toast.error('Please enter a search query');
        return;
      }

      setState(nextState);
      await searchAsync(toSearchRequest(nextState));
    },
    [searchAsync, state],
  );

  const handleFiltersChange = useCallback(
    (patch: Partial<SmartSearchState>) => {
      const nextState = { ...state, ...patch };

      if (patch.tableFilter !== undefined) {
        setState(nextState);
        return;
      }

      if (patch.sort !== undefined || patch.collection !== undefined) {
        void runSearch({ ...patch, page: 1 });
        return;
      }

      setState(nextState);
    },
    [runSearch, state],
  );

  const displayedResults = useMemo(() => {
    if (!results) return [];
    let items = results.results;

    if (state.tableFilter) {
      items = filterResults(items, state.tableFilter);
    }

    if (state.collection !== 'all') {
      items = items.filter((item) => item.collection === state.collection);
    }

    return sortResultsClient(items, state.sort);
  }, [results, state.collection, state.sort, state.tableFilter]);

  useEffect(() => {
    const q = searchParams.get('q')?.trim();
    if (q) {
      void searchAsync(toSearchRequest({ ...DEFAULT_SEARCH_STATE, query: q, page: 1 }));
      setState((current) => ({ ...current, query: q, page: 1 }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial URL query only
  }, [searchParams]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        document.querySelector<HTMLInputElement>('[aria-label="Search query"]')?.focus();
      }
      if (event.key === 'Escape' && drawerOpen) {
        setDrawerOpen(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [drawerOpen]);

  const handlePageChange = (page: number) => {
    updateState({ page });
    void runSearch({ page });
  };

  const showLanding = !results && !isSearching && !isError;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8 pb-8"
    >
      <SmartSearchHeader
        geminiConfigured={statusQuery.data?.geminiConfigured}
        model={statusQuery.data?.geminiModel}
      />

      <AISearchBar
        value={state.query}
        onChange={(query) => updateState({ query })}
        onSubmit={() => runSearch({ page: 1 })}
        isLoading={isSearching}
      />

      {showLanding && (
        <div className="mx-auto max-w-4xl space-y-8">
          <SearchSuggestionChips onSelect={(query) => runSearch({ query, page: 1 })} />
          <RecentSearches
            items={historyItems}
            isLoading={historyLoading}
            onReuse={(query) => runSearch({ query, page: 1 })}
            onDismiss={dismiss}
            onClearAll={clearAll}
            isClearing={isClearing}
          />
          <EmptyState
            illustration={<EmptySearchIllustration className="mx-auto size-40" />}
            title="Ask AccrediAssist anything"
            description="Search placements, internships, achievements, publications, patents, and event reports using natural language."
          />
        </div>
      )}

      {isSearching && <TableSkeleton rows={6} cols={5} />}

      {isError && (
        <ErrorState
          title="Search unavailable"
          message="We couldn't complete your search. Check your connection and try again."
          onRetry={() => runSearch()}
        />
      )}

      <AnimatePresence>
        {results && !isSearching && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            <SearchUnderstandingBanner response={results} />

            <SearchFiltersBar
              state={state}
              onChange={handleFiltersChange}
              onExport={() => exportResultsToCsv(displayedResults)}
              canExport={displayedResults.length > 0}
            />

            {displayedResults.length === 0 ? (
              <EmptyState
                illustration={<EmptySearchIllustration className="size-32" />}
                title="No results found"
                description="Try rephrasing your query, removing filters, or using one of the suggested searches."
              />
            ) : (
              <SearchResultsTable
                items={displayedResults}
                page={results.meta.page}
                totalPages={results.meta.totalPages}
                onPageChange={handlePageChange}
                onSelect={(item) => {
                  setSelectedItem(item);
                  setDrawerOpen(true);
                }}
                selectedId={selectedItem?.recordId}
              />
            )}

            <RecentSearches
              items={historyItems}
              isLoading={historyLoading}
              onReuse={(query) => runSearch({ query, page: 1 })}
              onDismiss={dismiss}
              onClearAll={clearAll}
              isClearing={isClearing}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <SearchResultDrawer
        item={selectedItem}
        response={results}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
    </motion.div>
  );
}
