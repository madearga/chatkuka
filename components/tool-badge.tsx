'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Search, FileText, Cloud, Lightbulb } from 'lucide-react';

interface ToolBadgeProps {
  tool: string;
  className?: string;
}

export function ToolBadge({ tool, className }: ToolBadgeProps) {
  const getToolInfo = (): { icon: ReactNode; color: string; label: string } => {
    switch (tool) {
      case 'tavilySearchTool':
      case 'search':
        return {
          icon: <Search className="size-3" />,
          color: 'bg-sky-500/10 text-sky-500 border-sky-200 dark:border-sky-800',
          label: 'Search',
        };
      case 'createDocument':
      case 'updateDocument':
        return {
          icon: <FileText className="size-3" />,
          color: 'bg-emerald-500/10 text-emerald-500 border-emerald-200 dark:border-emerald-800',
          label: 'Document',
        };
      case 'getWeather':
        return {
          icon: <Cloud className="size-3" />,
          color: 'bg-blue-500/10 text-blue-500 border-blue-200 dark:border-blue-800',
          label: 'Weather',
        };
      case 'requestSuggestions':
        return {
          icon: <Lightbulb className="size-3" />,
          color: 'bg-purple-500/10 text-purple-500 border-purple-200 dark:border-purple-800',
          label: 'Suggestions',
        };
      default:
        return {
          icon: null,
          color: 'bg-gray-500/10 text-gray-500 border-gray-200 dark:border-gray-800',
          label: tool,
        };
    }
  };

  const { icon, color, label } = getToolInfo();

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 px-1.5 py-0.5 text-xs rounded border',
        color,
        className
      )}
    >
      {icon}
      <span>{label}</span>
    </div>
  );
}
