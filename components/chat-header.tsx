'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useWindowSize } from 'usehooks-ts';

import { ModelSelector } from '@/components/model-selector';
import { SidebarToggle } from '@/components/sidebar-toggle';
import { Button } from '@/components/ui/button';
import { PlusIcon } from './icons'; // Removed VercelIcon import
import { useSidebar } from './ui/sidebar';
import { memo } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { VisibilityType, VisibilitySelector } from './visibility-selector';

function PureChatHeader({
  chatId,
  selectedModelId,
  selectedVisibilityType,
  isReadonly,
}: {
  chatId: string;
  selectedModelId: string;
  selectedVisibilityType: VisibilityType;
  isReadonly: boolean;
}) {
  const router = useRouter();
  const { open } = useSidebar();
  const { width: windowWidth } = useWindowSize();
  const isMobile = windowWidth < 640; // sm breakpoint

  return (
    <header className="flex sticky top-0 z-10 bg-background py-1.5 items-center px-2 md:px-4 mobile-safe-area header-gold">
      {/* Left side - toggle and model selector */}
      <div className="flex items-center gap-1 sm:gap-2 min-w-0 flex-1">
        <SidebarToggle />

        {!isReadonly && (
          <ModelSelector
            selectedModelId={selectedModelId}
            className="flex-shrink-0 max-w-[140px] sm:max-w-none"
          />
        )}
      </div>

      {/* Right side - new chat button and visibility */}
      <div className="flex items-center gap-1 sm:gap-2 justify-end">
        {!isReadonly && (
          <VisibilitySelector
            chatId={chatId}
            selectedVisibilityType={selectedVisibilityType}
            className="flex-shrink-0"
          />
        )}

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              className="md:px-2 px-2 h-8 sm:h-9 flex-shrink-0 btn-gold"
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
  return prevProps.selectedModelId === nextProps.selectedModelId;
});
