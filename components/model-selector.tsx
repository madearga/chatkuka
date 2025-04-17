'use client';

import { startTransition, useMemo, useOptimistic, useState } from 'react';
import { useWindowSize } from 'usehooks-ts';
import { useSession } from 'next-auth/react';
import Image from 'next/image';

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
import {
  getAvailableModelsForUser,
  ModelTier,
  MODEL_TIER_MAP,
} from '@/lib/ai/model-access';

import { CheckCircleFillIcon, ChevronDownIcon } from './icons';
import { UpgradeDialog } from './upgrade-dialog';

export function ModelSelector({
  selectedModelId,
  className,
}: {
  selectedModelId: string;
} & React.ComponentProps<typeof Button>) {
  const [open, setOpen] = useState(false);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [selectedProModel, setSelectedProModel] = useState('');
  const [optimisticModelId, setOptimisticModelId] =
    useOptimistic(selectedModelId);
  const { width } = useWindowSize();
  const isMobile = width < 640; // sm breakpoint
  const { data: session } = useSession();

  // Check if user has a paid subscription
  const isPaidUser = useMemo(() => {
    // Make sure session and user exist before accessing properties
    if (!session || !session.user) {
      return false;
    }
    return (session.user as any)?.subscriptionStatus === 'active';
  }, [session]);

  // Get available models based on user subscription status
  const availableModelIds = useMemo(() => {
    // Make sure session and user exist before accessing properties
    if (!session || !session.user) {
      // Return only free models if no session
      return Object.entries(MODEL_TIER_MAP)
        .filter(([_, tier]) => tier === ModelTier.FREE)
        .map(([modelId]) => modelId);
    }
    return getAvailableModelsForUser(session.user as any);
  }, [session]);

  const selectedChatModel = useMemo(
    () => chatModels.find((chatModel) => chatModel.id === optimisticModelId),
    [optimisticModelId],
  );

  return (
    <>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger
          asChild
          className={cn(
            'w-fit data-[state=open]:bg-accent data-[state=open]:text-accent-foreground truncate',
            className,
          )}
        >
          <Button
            variant="outline"
            className="md:px-2 px-2 h-8 md:h-[34px] text-xs sm:text-sm flex items-center gap-1"
          >
            {selectedChatModel?.provider && (
              <div className="relative w-4 h-4 mr-1.5">
                <Image
                  src={`/providers/logos/${selectedChatModel.provider}.svg`}
                  alt={`${selectedChatModel.provider} logo`}
                  fill
                  className="object-contain"
                />
              </div>
            )}
            <span className="truncate max-w-[80px] sm:max-w-none">
              {selectedChatModel?.name}
            </span>
            <ChevronDownIcon size={14} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="min-w-[200px] sm:min-w-[300px]"
        >
          {chatModels.map((chatModel) => {
            const { id, tier } = chatModel;
            const isPaidModel = tier === ModelTier.PAID;
            const isModelAvailable = availableModelIds.includes(id);

            return (
              <DropdownMenuItem
                key={id}
                onSelect={() => {
                  setOpen(false);

                  // If this is a paid model and user doesn't have access, redirect to subscription page
                  if (isPaidModel && !isPaidUser) {
                    setSelectedProModel(chatModel.name);
                    setUpgradeDialogOpen(true);
                    return;
                  }

                  startTransition(() => {
                    setOptimisticModelId(id);
                    saveChatModelAsCookie(id);
                  });
                }}
                className={`gap-2 sm:gap-4 group/item flex flex-row justify-between items-center ${isPaidModel && !isPaidUser ? 'cursor-pointer hover:bg-primary/10' : ''}`}
                data-active={id === optimisticModelId}
              >
                <div className="flex flex-col gap-1 items-start min-w-0">
                  <div className="truncate w-full flex items-center gap-2">
                    <div className="flex items-center gap-2">
                      <div className="relative w-4 h-4 flex-shrink-0">
                        <Image
                          src={`/providers/logos/${chatModel.provider}.svg`}
                          alt={`${chatModel.provider} logo`}
                          fill
                          className="object-contain"
                        />
                      </div>
                      {chatModel.name}
                    </div>
                    {chatModel.tier === ModelTier.PAID && (
                      <span
                        className={`text-xs ${isPaidUser ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'} px-1.5 py-0.5 rounded-full flex items-center gap-1`}
                      >
                        {!isPaidUser && (
                          <span className="size-1.5 rounded-full bg-primary animate-pulse"></span>
                        )}
                        Pro
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground truncate w-full">
                    {isMobile
                      ? chatModel.description.split('.')[0]
                      : chatModel.description}
                  </div>
                </div>

                <div className="text-foreground dark:text-foreground opacity-0 group-data-[active=true]/item:opacity-100 shrink-0">
                  <CheckCircleFillIcon />
                </div>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      <UpgradeDialog
        isOpen={upgradeDialogOpen}
        onClose={() => setUpgradeDialogOpen(false)}
        modelName={selectedProModel}
      />
    </>
  );
}
