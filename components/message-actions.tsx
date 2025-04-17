import type { Message } from 'ai';
import { toast } from 'sonner';
import { useSWRConfig } from 'swr';
import { useCopyToClipboard } from 'usehooks-ts';

import type { Vote } from '@/lib/db/schema';

import { CopyIcon, ThumbDownIcon, ThumbUpIcon } from './icons';
import { RotateCw } from 'lucide-react';
import { Button } from './ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';
import { memo } from 'react';
import equal from 'fast-deep-equal';

export function PureMessageActions({
  chatId,
  message,
  vote,
  isLoading,
  reload,
}: {
  chatId: string;
  message: Message;
  vote: Vote | undefined;
  isLoading: boolean;
  reload: (
    chatRequestOptions?: import('ai').ChatRequestOptions,
  ) => Promise<string | null | undefined>;
}) {
  const { mutate } = useSWRConfig();
  const [_, copyToClipboard] = useCopyToClipboard();

  if (message.toolInvocations && message.toolInvocations.length > 0)
    return null;
  if (typeof message.content !== 'string') return null;

  const handleCopy = async () => {
    // Prefer copying all text parts from message.parts if available
    const textToCopy = (message as any).parts
      ?.filter(
        (part: any): part is { type: 'text'; text: string } =>
          part.type === 'text',
      )
      .map((part: any) => part.text)
      .join('\n\n')
      .trim();

    if (textToCopy && textToCopy.length > 0) {
      await copyToClipboard(textToCopy);
      toast.success('Copied to clipboard!');
      return;
    }

    // Fallback: copy message.content if it's a string
    if (typeof message.content === 'string' && message.content.trim() !== '') {
      await copyToClipboard(message.content);
      toast.success('Copied to clipboard!');
      return;
    }

    toast.error("There's no text content to copy!");
  };

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex flex-row gap-1 sm:gap-2">
        {message.role === 'user' && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                className="py-0.5 px-1.5 sm:py-1 sm:px-2 h-fit text-muted-foreground"
                variant="outline"
                onClick={handleCopy}
                disabled={isLoading}
              >
                <CopyIcon />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Copy Prompt</TooltipContent>
          </Tooltip>
        )}

        {message.role === 'assistant' && (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  className="py-0.5 px-1.5 sm:py-1 sm:px-2 h-fit text-muted-foreground"
                  variant="outline"
                  onClick={() => reload()}
                  disabled={isLoading}
                >
                  <RotateCw />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Regenerate Response</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  className="py-0.5 px-1.5 sm:py-1 sm:px-2 h-fit text-muted-foreground"
                  variant="outline"
                  onClick={handleCopy}
                  disabled={isLoading}
                >
                  <CopyIcon />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Copy</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  className="py-0.5 px-1.5 sm:py-1 sm:px-2 h-fit text-muted-foreground !pointer-events-auto"
                  variant="outline"
                  disabled={isLoading || vote?.isUpvoted}
                  onClick={async () => {
                    const upvote = fetch('/api/vote', {
                      method: 'PATCH',
                      body: JSON.stringify({
                        chatId,
                        messageId: message.id,
                        type: 'up',
                      }),
                    });

                    toast.promise(upvote, {
                      loading: 'Upvoting Response...',
                      success: () => {
                        mutate<Array<Vote>>(
                          `/api/vote?chatId=${chatId}`,
                          (currentVotes) => {
                            if (!currentVotes) return [];

                            const votesWithoutCurrent = currentVotes.filter(
                              (vote) => vote.messageId !== message.id,
                            );

                            return [
                              ...votesWithoutCurrent,
                              {
                                chatId,
                                messageId: message.id,
                                isUpvoted: true,
                              },
                            ];
                          },
                          { revalidate: false },
                        );

                        return 'Upvoted Response!';
                      },
                      error: 'Failed to upvote response.',
                    });
                  }}
                >
                  <ThumbUpIcon />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Upvote Response</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  className="py-0.5 px-1.5 sm:py-1 sm:px-2 h-fit text-muted-foreground !pointer-events-auto"
                  variant="outline"
                  disabled={isLoading || (vote && !vote.isUpvoted)}
                  onClick={async () => {
                    const downvote = fetch('/api/vote', {
                      method: 'PATCH',
                      body: JSON.stringify({
                        chatId,
                        messageId: message.id,
                        type: 'down',
                      }),
                    });

                    toast.promise(downvote, {
                      loading: 'Downvoting Response...',
                      success: () => {
                        mutate<Array<Vote>>(
                          `/api/vote?chatId=${chatId}`,
                          (currentVotes) => {
                            if (!currentVotes) return [];

                            const votesWithoutCurrent = currentVotes.filter(
                              (vote) => vote.messageId !== message.id,
                            );

                            return [
                              ...votesWithoutCurrent,
                              {
                                chatId,
                                messageId: message.id,
                                isUpvoted: false,
                              },
                            ];
                          },
                          { revalidate: false },
                        );

                        return 'Downvoted Response!';
                      },
                      error: 'Failed to downvote response.',
                    });
                  }}
                >
                  <ThumbDownIcon />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Downvote Response</TooltipContent>
            </Tooltip>
          </>
        )}
      </div>
    </TooltipProvider>
  );
}

export const MessageActions = memo(
  PureMessageActions,
  (prevProps, nextProps) => {
    if (!equal(prevProps.vote, nextProps.vote)) return false;
    if (prevProps.isLoading !== nextProps.isLoading) return false;

    return true;
  },
);
