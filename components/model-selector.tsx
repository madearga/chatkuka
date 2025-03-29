'use client';

import { startTransition, useMemo, useOptimistic, useState } from 'react';
import { useWindowSize } from 'usehooks-ts';

import { saveChatModelAsCookie } from '@/app/(chat)/actions';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { chatModels } from '@/lib/ai/models';
import { cn } from '@/lib/utils';

import { CheckCircleFillIcon, ChevronDownIcon } from './icons';

export function ModelSelector({
  selectedModelId,
  className,
}: {
  selectedModelId: string;
} & React.ComponentProps<typeof Button>) {
  const [open, setOpen] = useState(false);
  const [optimisticModelId, setOptimisticModelId] =
    useOptimistic(selectedModelId);
  const { width } = useWindowSize();
  const isMobile = width < 640; // sm breakpoint

  const selectedChatModel = useMemo(
    () => chatModels.find((chatModel) => chatModel.id === optimisticModelId),
    [optimisticModelId],
  );

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        asChild
        className={cn(
          'w-fit data-[state=open]:bg-accent data-[state=open]:text-accent-foreground truncate',
          className,
        )}
      >
        <Button variant="outline" className="md:px-2 px-2 h-8 md:h-[34px] text-xs sm:text-sm">
          <span className="truncate max-w-[80px] sm:max-w-none">
            {selectedChatModel?.name}
          </span>
          <ChevronDownIcon size={14} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[200px] sm:min-w-[300px]">
        {chatModels.map((chatModel) => {
          const { id } = chatModel;

          return (
            <DropdownMenuItem
              key={id}
              onSelect={() => {
                setOpen(false);

                startTransition(() => {
                  setOptimisticModelId(id);
                  saveChatModelAsCookie(id);
                });
              }}
              className="gap-2 sm:gap-4 group/item flex flex-row justify-between items-center"
              data-active={id === optimisticModelId}
            >
              <div className="flex flex-col gap-1 items-start min-w-0">
                <div className="truncate w-full">{chatModel.name}</div>
                <div className="text-xs text-muted-foreground truncate w-full">
                  {isMobile 
                    ? chatModel.description.split('.')[0] 
                    : chatModel.description}
                </div>
              </div>

              <div className="text-foreground dark:text-foreground opacity-0 group-data-[active=true]/item:opacity-100 flex-shrink-0">
                <CheckCircleFillIcon />
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
