'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useWindowSize } from 'usehooks-ts';


import { SidebarToggle } from '@/components/sidebar-toggle';
import { Button } from '@/components/ui/button';
import { PlusIcon } from './icons'; // Removed VercelIcon import
import { useSidebar } from './ui/sidebar';
import { memo } from 'react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { VisibilityType, VisibilitySelector } from './visibility-selector';
import { Search } from 'lucide-react';

function PureChatHeader({
  chatId,
  selectedModelId,
  selectedVisibilityType,
  isReadonly,
  setIsSearchOpen,
}: {
  chatId: string;
  selectedModelId: string;
  selectedVisibilityType: VisibilityType;
  isReadonly: boolean;
  setIsSearchOpen: (open: boolean) => void;
}) {
  const router = useRouter();
  const { open } = useSidebar();
  const { width: windowWidth } = useWindowSize();
  const isMobile = windowWidth < 640; // sm breakpoint

  return (
    <header
      className={cn(
        'flex sticky top-0 z-10',
        'bg-background',
        'py-1.5 px-2 md:px-4',
        'items-center',
        'mobile-safe-area',
        'border-b border-border',
      )}
    >
      {/* Left side - toggle and model selector */}
      <div className="flex items-center gap-1 sm:gap-2 min-w-0 flex-1">
        <SidebarToggle />


      </div>

      {/* Right side - search, new chat button and visibility */}
      <div className="flex items-center gap-1 sm:gap-2 justify-end">
        {!isReadonly && (
          <VisibilitySelector
            chatId={chatId}
            selectedVisibilityType={selectedVisibilityType}
            className="shrink-0"
          />
        )}

        {/* Search Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              className="md:px-2 px-2 h-8 sm:h-9 shrink-0 hover:bg-accent" // Adjusted classes based on New Chat button
              onClick={() => setIsSearchOpen(true)}
              aria-label="Search"
            >
              <Search size={16} /> {/* Ensure consistent icon size */}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            Search (
            {navigator?.userAgent?.toLowerCase().includes('mac') ? '⌘' : 'Ctrl'}{' '}
            + K)
          </TooltipContent>
        </Tooltip>

        {/* New Chat Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'md:px-2 px-2 h-8 sm:h-9 flex-shrink-0',
                'hover:bg-accent',
              )}
              onClick={() => {
                router.push('/');
                router.refresh();
              }}
            >
              <PlusIcon />
              <span className="sr-only">New Chat</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>New Chat</TooltipContent>
        </Tooltip>
      </div>
    </header>
  );
}

export const ChatHeader = memo(PureChatHeader, (prevProps, nextProps) => {
  return prevProps.setIsSearchOpen === nextProps.setIsSearchOpen;
});
