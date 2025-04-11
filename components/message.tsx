'use client';

import type { ChatRequestOptions, Message } from 'ai';
import type { UIMessage } from 'ai';
import cx from 'classnames';
import { AnimatePresence, motion } from 'framer-motion';
import { memo, useMemo, useState } from 'react';

import type { Vote } from '@/lib/db/schema';

import { DocumentToolCall, DocumentToolResult } from './document';
import {
  ChevronDownIcon,
  LoaderIcon,
  PencilEditIcon,
  SparklesIcon,
  FileIcon,
} from './icons';
import { Markdown } from './markdown';
import { MessageActions } from './message-actions';
import { PreviewAttachment } from './preview-attachment';
import { Weather } from './weather';
import equal from 'fast-deep-equal';
import { cn, getFileTypeFromUrl } from '@/lib/utils';
import { Button } from './ui/button';
import { formatDistanceToNow } from 'date-fns';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';
import { MessageEditor } from './message-editor';
import { DocumentPreview } from './document-preview';
import { MessageReasoning } from './message-reasoning';
import { SearchResults } from './search-results';
import { SearchProgress, type SearchStatus } from './search-progress';

import { File, FileText, FileSpreadsheet, FileCode } from 'lucide-react';
import { ResponseStream } from './ui/response-stream';

// Tambahkan interface untuk data pencarian
interface SearchData {
  type: 'search-status' | 'search-results';
  status: SearchStatus;
  query: string;
  error?: string;
  results?: any[];
  answer?: string;
  images?: any[];
  responseTime?: number;
  topic?: string;
  timeRange?: string;
}

// Function to get file icon based on file type
function getFileIcon(fileType: string): React.ReactNode {
  switch (fileType) {
    case 'pdf':
    case 'document':
      return <FileText size={16} />;
    case 'spreadsheet':
    case 'csv':
      return <FileSpreadsheet size={16} />;
    case 'code':
      return <FileCode size={16} />;
    case 'text':
      return <FileText size={16} />;
    default:
      return <File size={16} />;
  }
}

 // Extended message type with attachmentUrl
interface ExtendedMessage extends Message {
  attachmentUrl?: string | null;
  createdAt?: Date;
}

const PurePreviewMessage = ({
  chatId,
  message,
  vote,
  isLoading,
  setMessages,
  reload,
  isReadonly,
}: {
  chatId: string;
  message: UIMessage;
  vote: Vote | undefined;
  isLoading: boolean;
  setMessages: (
    messages: Message[] | ((messages: Message[]) => Message[]),
  ) => void;
  reload: (
    chatRequestOptions?: ChatRequestOptions,
  ) => Promise<string | null | undefined>;
  isReadonly: boolean;
}) => {
  const [mode, setMode] = useState<'view' | 'edit'>('view');

  // Get file information if attachment URL exists
  const fileType = useMemo(() => {
    if ((message as any).attachmentUrl) {
      return getFileTypeFromUrl((message as any).attachmentUrl);
    }
    return 'unknown';
  }, [(message as any).attachmentUrl]);

  // Get the file name from the URL
  const fileName = useMemo(() => {
    if ((message as any).attachmentUrl) {
      const fullName = (message as any).attachmentUrl.split('/').pop() || 'file';
      const parts = fullName.split('-');
      return parts.length > 1 ? parts.slice(1).join('-') : fullName;
    }
    return 'Attached file';
  }, [(message as any).attachmentUrl]);

  return (
    <AnimatePresence>
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.div
              className="w-full mx-auto max-w-3xl px-2 sm:px-4 group/message"
              initial={{ y: 5, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ opacity: 0, y: -5, transition: { duration: 0.1 } }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              layout
              data-role={message.role}
            >
              <div
                className={cn(
                  'flex gap-3 sm:gap-4 w-full group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl',
                  {
                    'w-full': mode === 'edit',
                    'group-data-[role=user]/message:w-fit': mode !== 'edit',
                  },
                )}
              >
                {message.role === 'assistant' && (
                  <div className="size-8 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border bg-background">
                    <div className="translate-y-px">
                      <SparklesIcon size={14} />
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-4 w-full overflow-hidden max-w-full">
                  {/* Render message.parts */}
                  {message.parts?.map((part, index) => {
                    switch (part.type) {
                      case 'text':
                        return (
                          <div key={index} className="flex flex-row items-start gap-2">
                            {message.role === 'user' && !isReadonly && mode === 'view' && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 shrink-0 mt-1"
                                    onClick={() => setMode('edit')}
                                  >
                                    <PencilEditIcon />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Edit</TooltipContent>
                              </Tooltip>
                            )}
                            <div
                              className={cn(
                                'flex-grow break-words max-w-full overflow-hidden',
                                message.role === 'user' ? 'bg-zinc-200 text-zinc-900 px-3 py-2 rounded-xl dark:bg-zinc-700 dark:text-zinc-100' : 'bg-muted/50 border border-border/50 px-3 py-2 rounded-xl'
                              )}
                            >
                              <ResponseStream
                                textStream={part.text}
                                mode="fade"
                                speed={20}
                                className="prose max-w-full text-foreground"
                              />
                            </div>
                          </div>
                        );
                      case 'tool-invocation': {
                        const { toolInvocation } = part;
                        const { toolName, toolCallId, state, args } = toolInvocation;
                        // The result property is only present when state === 'result'
                        const result = (toolInvocation as any).result;
                        if (state === 'call') {
                          return (
                            <div key={toolCallId}>
                              {toolName === 'getWeather' ? (
                                <Weather />
                              ) : toolName === 'createDocument' ? (
                                <DocumentPreview isReadonly={isReadonly} args={args} />
                              ) : toolName === 'updateDocument' ? (
                                <DocumentToolCall
                                  type="update"
                                  args={args}
                                  isReadonly={isReadonly}
                                />
                              ) : toolName === 'requestSuggestions' ? (
                                <DocumentToolCall
                                  type="request-suggestions"
                                  args={args}
                                  isReadonly={isReadonly}
                                />
                              ) : toolName === 'search' ? (
                                <SearchProgress
                                  status="searching"
                                  query={args.query}
                                />
                              ) : null}
                            </div>
                          );
                        }
                        if (state === 'result' && result !== undefined) {
                          return (
                            <div key={toolCallId}>
                              {toolName === 'getWeather' ? (
                                <Weather weatherAtLocation={result} />
                              ) : toolName === 'createDocument' ? (
                                <DocumentPreview
                                  isReadonly={isReadonly}
                                  result={result}
                                />
                              ) : toolName === 'updateDocument' ? (
                                <DocumentToolResult
                                  type="update"
                                  result={result}
                                  isReadonly={isReadonly}
                                />
                              ) : toolName === 'requestSuggestions' ? (
                                <DocumentToolResult
                                  type="request-suggestions"
                                  result={result}
                                  isReadonly={isReadonly}
                                />
                              ) : toolName === 'search' ? (
                                <SearchResults
                                  results={result.results}
                                  query={result.query}
                                  answer={result.answer}
                                  images={result.images}
                                  responseTime={result.responseTime}
                                />
                              ) : (
                                <pre>{JSON.stringify(result, null, 2)}</pre>
                              )}
                            </div>
                          );
                        }
                        return null;
                      }
                      case 'reasoning':
                        return (
                          <MessageReasoning
                            key={index}
                            isLoading={isLoading}
                            reasoning={part.reasoning}
                          />
                        );
                      case 'file':
                        return (
                          <PreviewAttachment
                            key={index}
                            attachment={{
                              url: part.data,
                              // Only include mimeType if present
                              ...(part.mimeType ? { mimeType: part.mimeType } : {}),
                            }}
                          />
                        );
                      case 'source':
                        return (
                          <div key={index} className="text-xs text-muted-foreground">
                            <a href={part.source.url} target="_blank" rel="noopener noreferrer">
                              {part.source.title || part.source.url}
                            </a>
                          </div>
                        );
                      default:
                        console.warn(`Unhandled message part type: ${(part as any).type}`);
                        return null;
                    }
                  })}

                  {/* Display attachment from database (legacy) */}
                  {(message as any).attachmentUrl && (
                    <div className={cn(
                      "flex items-start gap-3 p-3 rounded-lg shadow-sm",
                      message.role === 'user' ? "bg-zinc-800/20 ml-auto dark:bg-zinc-700/20" : "bg-muted/80"
                    )}>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-md bg-zinc-800/20 dark:bg-zinc-700/20 shrink-0">
                          {getFileIcon(fileType)}
                        </div>
                        <div className="flex flex-col overflow-hidden">
                          <span className="text-sm font-medium truncate max-w-[150px] sm:max-w-[200px]">
                            {fileName}
                          </span>
                          <span className="text-xs text-muted-foreground capitalize">
                            {fileType} file
                          </span>
                        </div>
                      </div>
                      <a
                        href={(message as any).attachmentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 sm:mt-0 sm:ml-auto py-1.5 px-3 text-sm bg-zinc-800/20 hover:bg-zinc-800/30 text-zinc-800 dark:text-zinc-300 rounded-md transition-colors"
                      >
                        Open
                      </a>
                    </div>
                  )}

                  {!isReadonly && (
                    <MessageActions
                      key={`action-${message.id}`}
                      chatId={chatId}
                      message={message}
                      vote={vote}
                      isLoading={isLoading}
                      reload={reload}
                    />
                  )}
                </div>
              </div>
            </motion.div>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {message.createdAt
              ? formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })
              : 'Timestamp unavailable'}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </AnimatePresence>
  );
};

export const PreviewMessage = memo(
  PurePreviewMessage,
  (prevProps, nextProps) => {
    if (prevProps.isLoading !== nextProps.isLoading) return false;
    if (prevProps.message.reasoning !== nextProps.message.reasoning)
      return false;
    if (prevProps.message.content !== nextProps.message.content) return false;
    if ((prevProps.message as any).attachmentUrl !== (nextProps.message as any).attachmentUrl)
      return false;
    if (
      !equal(
        prevProps.message.toolInvocations,
        nextProps.message.toolInvocations,
      )
    )
      return false;
    if (!equal(prevProps.vote, nextProps.vote)) return false;

    return true;
  },
);

export const ThinkingMessage = () => {
  const role = 'assistant';

  return (
    <motion.div
      className="w-full mx-auto max-w-3xl px-4 group/message "
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1, transition: { delay: 1 } }}
      data-role={role}
    >
      <div
        className={cx(
          'flex gap-4 group-data-[role=user]/message:px-3 w-full group-data-[role=user]/message:w-fit group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl group-data-[role=user]/message:py-2 rounded-xl',
          {
            'group-data-[role=user]/message:bg-muted': true,
          },
        )}
      >
        <div className="size-8 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border">
          <SparklesIcon size={14} />
        </div>

        <div className="flex flex-col gap-2 w-full">
          <div className="flex flex-col gap-4 text-muted-foreground">
            Thinking...
          </div>
        </div>
      </div>
    </motion.div>
  );
};
