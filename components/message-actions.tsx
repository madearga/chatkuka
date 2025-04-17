import type { Message } from 'ai';
import { toast } from 'sonner';
import { useCopyToClipboard } from 'usehooks-ts';

import { CopyIcon } from './icons';
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
  isLoading,
  reload,
}: {
  chatId: string;
  message: Message;
  isLoading: boolean;
  reload: (
    chatRequestOptions?: import('ai').ChatRequestOptions,
  ) => Promise<string | null | undefined>;
}) {
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
          </>
        )}
      </div>
    </TooltipProvider>
  );
}

export const MessageActions = memo(
  PureMessageActions,
  (prevProps, nextProps) => {
    if (prevProps.isLoading !== nextProps.isLoading) return false;

    return true;
  },
);
