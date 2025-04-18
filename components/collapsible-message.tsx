'use client';

import { ReactNode, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CollapsibleMessageProps {
  children: ReactNode;
  header: ReactNode;
  role?: 'user' | 'assistant';
  isCollapsible?: boolean;
  isOpen?: boolean;
  className?: string;
}

export function CollapsibleMessage({
  children,
  header,
  role = 'assistant',
  isCollapsible = true,
  isOpen: initialIsOpen = true,
  className,
}: CollapsibleMessageProps) {
  const [isOpen, setIsOpen] = useState(initialIsOpen);

  return (
    <div
      className={cn(
        'border rounded-lg overflow-hidden',
        role === 'assistant'
          ? 'bg-muted/50 border-border/50'
          : 'bg-primary text-primary-foreground',
        className
      )}
    >
      <div 
        className={cn(
          'flex justify-between items-center p-3',
          isCollapsible ? 'cursor-pointer hover:bg-muted/80' : '',
          role === 'assistant' ? 'border-b border-border/50' : 'border-b border-primary/20'
        )}
        onClick={isCollapsible ? () => setIsOpen(!isOpen) : undefined}
      >
        <div className="flex-1">{header}</div>
        {isCollapsible && (
          <button
            type="button"
            className="p-1 rounded-full hover:bg-muted"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(!isOpen);
            }}
            aria-label={isOpen ? 'Collapse' : 'Expand'}
          >
            {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        )}
      </div>
      
      {isOpen && <div className="p-3">{children}</div>}
    </div>
  );
}
