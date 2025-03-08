'use client';

import { ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

interface SourceReferenceProps {
  sourceId: number;
  sourceTitle?: string;
  sourceUrl?: string;
  className?: string;
}

export function SourceReference({ 
  sourceId, 
  sourceTitle, 
  sourceUrl, 
  className 
}: SourceReferenceProps) {
  const [title, setTitle] = useState<string | null>(sourceTitle || null);
  const [url, setUrl] = useState<string | null>(sourceUrl || null);

  // If sourceTitle and sourceUrl are not provided, try to find them from the DOM
  useEffect(() => {
    if (!sourceTitle || !sourceUrl) {
      const sourceElement = document.getElementById(`source-${sourceId}`);
      if (sourceElement) {
        // Try to extract title and URL from the source element
        const titleElement = sourceElement.querySelector('.font-medium');
        const urlElement = sourceElement.querySelector('.text-gray-500');
        
        if (titleElement && !sourceTitle) {
          setTitle(titleElement.textContent);
        }
        
        if (!sourceUrl) {
          // If we have the URL element, use it
          if (urlElement) {
            setUrl(urlElement.textContent);
          } 
          // Otherwise, use the href attribute of the source element
          else if (sourceElement instanceof HTMLAnchorElement) {
            setUrl(sourceElement.href);
          }
        }
      }
    }
  }, [sourceId, sourceTitle, sourceUrl]);

  if (!url) {
    return (
      <span className={cn("inline-flex items-center text-xs bg-gray-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded", className)}>
        [Source {sourceId}]
      </span>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex items-center gap-1 text-xs bg-sky-50 dark:bg-sky-950/30 text-sky-600 dark:text-sky-400 px-1.5 py-0.5 rounded hover:bg-sky-100 dark:hover:bg-sky-950/50 transition-colors",
        className
      )}
    >
      <span className="bg-sky-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center flex-shrink-0">
        {sourceId}
      </span>
      {title ? (
        <span className="max-w-[150px] truncate">{title}</span>
      ) : (
        <span>Source {sourceId}</span>
      )}
      <ExternalLink size={8} className="flex-shrink-0" />
    </a>
  );
}

// Helper function to replace source references in text with the SourceReference component
export function processSourceReferences(text: string): JSX.Element[] {
  if (!text) return [];

  // Regular expression to match [Source X] or [Source X, Y, Z] patterns
  const sourceRegex = /\[Source\s+(\d+(?:,\s*\d+)*)\]/g;
  
  const parts: JSX.Element[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  
  while ((match = sourceRegex.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(<span key={`text-${lastIndex}`}>{text.substring(lastIndex, match.index)}</span>);
    }
    
    // Process the source IDs
    const sourceIds = match[1].split(',').map(id => parseInt(id.trim(), 10));
    
    // Add the source reference component for each ID
    sourceIds.forEach((id, index) => {
      parts.push(
        <SourceReference 
          key={`source-${match?.index || 0}-${id}`} 
          sourceId={id} 
          className="mx-0.5"
        />
      );
      
      // Add comma between multiple sources
      if (index < sourceIds.length - 1) {
        parts.push(<span key={`comma-${match?.index || 0}-${id}`}>, </span>);
      }
    });
    
    lastIndex = match.index + match[0].length;
  }
  
  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(<span key={`text-${lastIndex}`}>{text.substring(lastIndex)}</span>);
  }
  
  return parts;
} 