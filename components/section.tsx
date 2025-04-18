'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Search, Link2 } from 'lucide-react';

interface SectionProps {
  children: ReactNode;
  title: string;
  icon?: ReactNode;
  className?: string;
}

export function Section({
  children,
  title,
  icon,
  className,
}: SectionProps) {
  return (
    <div className={cn('mb-4', className)}>
      <div className="flex items-center gap-1.5 mb-2">
        {icon}
        <h3 className="text-sm font-medium">{title}</h3>
      </div>
      <div>{children}</div>
    </div>
  );
}

interface ToolArgsSectionProps {
  children: ReactNode;
  tool: 'search' | 'document' | 'weather' | 'suggestions';
  className?: string;
}

export function ToolArgsSection({
  children,
  tool,
  className,
}: ToolArgsSectionProps) {
  const getIcon = () => {
    switch (tool) {
      case 'search':
        return <Search className="size-4 text-sky-500" />;
      case 'document':
        return <Link2 className="size-4 text-emerald-500" />;
      case 'weather':
        return <Link2 className="size-4 text-blue-500" />;
      case 'suggestions':
        return <Link2 className="size-4 text-purple-500" />;
      default:
        return null;
    }
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {getIcon()}
      <span className="font-medium text-sm">
        {tool === 'search' && 'Web search: '}
        {tool === 'document' && 'Document: '}
        {tool === 'weather' && 'Weather: '}
        {tool === 'suggestions' && 'Suggestions: '}
        {children}
      </span>
    </div>
  );
}
