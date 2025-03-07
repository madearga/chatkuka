'use client';

import { useState } from 'react';
import { ExternalLink, ChevronDown, ChevronUp, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface TavilyImage {
  url: string;
  description?: string;
}

interface SearchResult {
  title: string;
  url: string;
  content: string;
  rawContent?: string;
  score: number;
  publishedDate?: string;
}

interface SearchResultsProps {
  results: SearchResult[];
  query: string;
  answer?: string;
  images?: TavilyImage[];
  responseTime?: number;
  className?: string;
}

export function SearchResults({ 
  results, 
  query, 
  answer, 
  images, 
  responseTime,
  className 
}: SearchResultsProps) {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <div className={cn("my-4 border rounded-lg overflow-hidden bg-white dark:bg-zinc-900", className)}>
      <div className="bg-sky-500/10 p-3 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Globe className="size-4 text-sky-500" />
          <span className="font-medium">Web search results for: &quot;{query}&quot;</span>
          {responseTime && (
            <span className="text-xs text-gray-500">({responseTime.toFixed(2)}s)</span>
          )}
        </div>
        <button 
          onClick={() => setExpanded(!expanded)}
          className="p-1 rounded hover:bg-sky-500/10"
          aria-label={expanded ? "Collapse search results" : "Expand search results"}
        >
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>
      
      {answer && (
        <div className="p-3 border-b bg-sky-500/5">
          <p className="text-sm font-medium mb-1">Summary:</p>
          <p className="text-sm">{answer}</p>
        </div>
      )}
      
      {images && images.length > 0 && (
        <div className="p-3 border-b">
          <p className="text-sm font-medium mb-2">Related Images:</p>
          <div className="flex flex-wrap gap-2">
            {images.slice(0, 3).map((image, index) => (
              <div key={index} className="relative group size-24">
                <Image 
                  src={image.url} 
                  alt={image.description || 'Search result image'} 
                  className="object-cover rounded-md"
                  fill
                  sizes="(max-width: 768px) 100px, 96px"
                />
                {image.description && (
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-1 rounded-md">
                    <p className="text-xs text-white line-clamp-3">{image.description}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {expanded && (
        <div className="max-h-80 overflow-y-auto">
          {results.map((result, index) => (
            <div key={index} className="p-3 border-b last:border-b-0 hover:bg-gray-50 dark:hover:bg-zinc-800">
              <div className="flex justify-between items-start">
                <a 
                  href={result.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-sky-600 hover:underline flex items-center gap-1"
                >
                  {result.title}
                  <ExternalLink size={12} />
                </a>
                <span className="text-xs text-gray-500">Score: {(result.score * 100).toFixed(0)}%</span>
              </div>
              <p className="text-xs text-gray-500 truncate">{result.url}</p>
              {result.publishedDate && (
                <p className="text-xs text-gray-500 mt-1">Published: {result.publishedDate}</p>
              )}
              <p className="text-sm mt-1">{result.content}</p>
            </div>
          ))}
        </div>
      )}
      
      {!expanded && results.length > 0 && (
        <div className="p-2 text-center text-xs text-gray-500">
          {results.length} result{results.length !== 1 ? 's' : ''} found. Click to expand.
        </div>
      )}
    </div>
  );
} 