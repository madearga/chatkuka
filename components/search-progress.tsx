'use client';

import { Loader2, Search, AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type SearchStatus = 'searching' | 'processing' | 'complete' | 'error';

interface SearchProgressProps {
  status: SearchStatus;
  query: string;
  error?: string;
  className?: string;
}

export function SearchProgress({
  status,
  query,
  error,
  className,
}: SearchProgressProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 text-sm my-2 p-2 rounded-md',
        status === 'error'
          ? 'bg-red-500/10 text-red-500'
          : 'bg-sky-500/10 text-sky-500',
        className,
      )}
    >
      {status === 'searching' && (
        <>
          <Search className="size-4 animate-pulse" />
          <span>Searching the web for &quot;{query}&quot;...</span>
        </>
      )}

      {status === 'processing' && (
        <>
          <Loader2 className="size-4 animate-spin" />
          <span>Processing search results...</span>
        </>
      )}

      {status === 'complete' && (
        <>
          <CheckCircle className="size-4" />
          <span>Search complete</span>
        </>
      )}

      {status === 'error' && (
        <>
          <AlertCircle className="size-4" />
          <span>{error || 'An error occurred during search'}</span>
        </>
      )}
    </div>
  );
}
