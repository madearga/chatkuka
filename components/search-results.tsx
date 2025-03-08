'use client';

import { useState } from 'react';
import { ExternalLink, ChevronDown, ChevronUp, Globe, Link2, Info, Search } from 'lucide-react';
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
  
  // Ensure results is always an array
  const safeResults = Array.isArray(results) ? results : [];
  
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
        <div className="flex items-center gap-2">
          <a 
            href="https://docs.tavily.com/documentation/api-reference/endpoint/search" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs text-sky-500 hover:underline flex items-center gap-1"
          >
            <span>Powered by Tavily</span>
            <ExternalLink size={10} />
          </a>
          <button 
            onClick={() => setExpanded(!expanded)}
            className="p-1 rounded hover:bg-sky-500/10"
            aria-label={expanded ? "Collapse search results" : "Expand search results"}
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
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
      
      {/* Always show sources section with improved styling */}
      <div className="p-3 border-b">
        <div className="flex items-center gap-1 mb-2">
          <Link2 size={14} className="text-sky-500" />
          <p className="text-sm font-medium">Sources:</p>
          <span className="text-xs text-gray-500 ml-1">
            (Click to open)
          </span>
        </div>
        
        {safeResults.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {safeResults.map((result, index) => (
              <a 
                key={index}
                href={result.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-sky-600 hover:bg-sky-100 dark:hover:bg-sky-950/50 flex items-center gap-1 bg-sky-50 dark:bg-sky-950/30 px-3 py-2 rounded-md transition-colors"
                id={`source-${index + 1}`}
                data-source-id={index + 1}
              >
                <div className="flex flex-col">
                  <div className="flex items-center gap-1">
                    <span className="bg-sky-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                      {index + 1}
                    </span>
                    <span className="font-medium truncate max-w-[250px]">{result.title}</span>
                  </div>
                  <span className="text-gray-500 truncate max-w-[250px] ml-6">{result.url}</span>
                </div>
                <ExternalLink size={10} className="ml-auto flex-shrink-0" />
              </a>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center p-4 bg-gray-50 dark:bg-zinc-800/50 rounded-md">
            <Search className="size-4 text-gray-400 mr-2" />
            <p className="text-sm text-gray-500">No sources available for this query</p>
          </div>
        )}
      </div>
      
      {expanded && safeResults.length > 0 && (
        <div className="max-h-80 overflow-y-auto">
          {safeResults.map((result, index) => (
            <div key={index} className="p-3 border-b last:border-b-0 hover:bg-gray-50 dark:hover:bg-zinc-800">
              <div className="flex justify-between items-start">
                <a 
                  href={result.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-sky-600 hover:underline flex items-center gap-1"
                >
                  <span className="bg-sky-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mr-1">
                    {index + 1}
                  </span>
                  {result.title}
                  <ExternalLink size={12} />
                </a>
                <span className="text-xs text-gray-500">Score: {(result.score * 100).toFixed(0)}%</span>
              </div>
              <p className="text-xs text-gray-500 truncate ml-6">{result.url}</p>
              {result.publishedDate && (
                <p className="text-xs text-gray-500 mt-1 ml-6">Published: {result.publishedDate}</p>
              )}
              <p className="text-sm mt-1 ml-6">{result.content}</p>
            </div>
          ))}
        </div>
      )}
      
      {!expanded && safeResults.length > 0 && (
        <div className="p-2 text-center text-xs text-gray-500">
          <button 
            onClick={() => setExpanded(true)}
            className="hover:underline flex items-center justify-center gap-1 mx-auto"
          >
            <span>View detailed results</span>
            <ChevronDown size={12} />
          </button>
        </div>
      )}
    </div>
  );
}

// Export a helper function to get source reference by ID
export function getSourceReference(sourceId: number, results: any[]): string | null {
  if (!Array.isArray(results) || !results.length || sourceId < 1 || sourceId > results.length) {
    return null;
  }
  
  const source = results[sourceId - 1];
  if (!source || !source.title || !source.url) {
    return null;
  }
  
  return `[${source.title}](${source.url})`;
} 