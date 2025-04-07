'use client';

import type { ChatRequestOptions, Message } from 'ai';
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
  message: ExtendedMessage;
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
  
  // Parse search data if available - simplify to avoid hydration issues
  const searchData = useMemo(() => {
    try {
      // Check for direct search data in message content
      if (typeof message.content === 'object' && message.content !== null) {
        const content = message.content as any;
        if (content.type === 'search-status' || content.type === 'search-results') {
          return content as SearchData;
        }
      }
      
      // Check for search data in tool invocations
      if (message.toolInvocations && Array.isArray(message.toolInvocations) && message.toolInvocations.length > 0) {
        for (const toolInvocation of message.toolInvocations) {
          if (toolInvocation.toolName === 'search' && toolInvocation.state === 'result' && toolInvocation.result) {
            const result = toolInvocation.result;
            return {
              type: 'search-results',
              status: 'complete',
              query: result.query || '',
              results: result.results || [],
              answer: result.answer || '',
              images: result.images || [],
              responseTime: result.responseTime || 0,
              topic: result.topic || 'general',
              timeRange: result.timeRange || ''
            } as SearchData;
          }
        }
      }
    } catch (error) {
      console.error('Error parsing search data:', error);
    }
    
    return null;
  }, [message.content, message.toolInvocations]);

  // Get file information if attachment URL exists
  const fileType = useMemo(() => {
    if (message.attachmentUrl) {
      return getFileTypeFromUrl(message.attachmentUrl);
    }
    return 'unknown';
  }, [message.attachmentUrl]);

  // Get the file name from the URL
  const fileName = useMemo(() => {
    if (message.attachmentUrl) {
      // Extract filename from URL, removing the unique ID prefix
      const fullName = message.attachmentUrl.split('/').pop() || 'file';
      // Split by dash and remove the first part (usually a UUID)
      const parts = fullName.split('-');
      return parts.length > 1 ? parts.slice(1).join('-') : fullName;
    }
    return 'Attached file';
  }, [message.attachmentUrl]);

  return (
    <AnimatePresence>
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.div
              className="w-full mx-auto max-w-3xl px-2 sm:px-4 group/message"
              initial={{ y: 5, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
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
            {/* Display experimental attachments */}
            {message.experimental_attachments && (
              <div className="flex flex-row flex-wrap justify-end gap-2 max-w-full">
                {message.experimental_attachments.map((attachment) => (
                  <PreviewAttachment
                    key={attachment.url}
                    attachment={attachment}
                  />
                ))}
              </div>
            )}

            {/* Display attachment from database */}
            {message.attachmentUrl && (
              <div className={cn(
                "flex items-start gap-3 p-3 rounded-lg shadow-sm",
                message.role === 'user' ? "bg-primary/5 ml-auto" : "bg-muted/80"
              )}>
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-md bg-primary/10 shrink-0">
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
                  href={message.attachmentUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="mt-2 sm:mt-0 sm:ml-auto py-1.5 px-3 text-sm bg-primary/10 hover:bg-primary/20 text-primary rounded-md transition-colors"
                >
                  Open
                </a>
              </div>
            )}

            {message.reasoning && (
              <MessageReasoning
                isLoading={isLoading}
                reasoning={message.reasoning}
              />
            )}

            {/* Render search status or results if available */}
            {searchData && (
              <div className="w-full">
                {searchData.type === 'search-status' ? (
                  <SearchProgress 
                    status={searchData.status}
                    query={searchData.query}
                    error={searchData.error}
                  />
                ) : searchData.type === 'search-results' && Array.isArray(searchData.results) ? (
                  <SearchResults 
                    results={searchData.results}
                    query={searchData.query}
                    answer={searchData.answer}
                    images={searchData.images}
                    responseTime={searchData.responseTime}
                  />
                ) : null}
              </div>
            )}

            {(message.content && typeof message.content === 'string' || (message.reasoning && Array.isArray(message.reasoning))) && mode === 'view' && (
              <div className="flex flex-row gap-2 items-start w-full overflow-hidden">
                {message.role === 'user' && !isReadonly && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => setMode('edit')}
                      >
                        <PencilEditIcon />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Edit</TooltipContent>
                  </Tooltip>
                )}

                      <div className={cn(
                        'flex flex-col gap-4 break-words max-w-full overflow-hidden',
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground px-3 py-2 rounded-xl'
                          : 'bg-muted/50 border border-border/50 px-3 py-2 rounded-xl'
                      )}>
                  {message.reasoning && Array.isArray(message.reasoning) && message.reasoning.length > 0 && (
                    <div className="text-muted-foreground w-full overflow-hidden text-ellipsis">
                      <div className="flex">
                        <div className="flex-1" />
                        <span className="prose p-0.5 px-1 text-xs ">Reasoning</span>
                      </div>
                      <div className="text-sm italic mb-4">
                        {message.reasoning.map((reason, index) => (
                          <div key={index} className="my-2 max-w-full break-words">
                            {reason}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {typeof message.content === 'string' && message.content.trim() !== '' && (
                    <div className="w-full overflow-hidden break-words">
                      <Markdown>
                        {message.content}
                      </Markdown>
                    </div>
                  )}
                </div>
              </div>
            )}

            {message.content && typeof message.content === 'string' && mode === 'edit' && (
              <div className="flex flex-row gap-2 items-start">
                <div className="size-8" />

                <MessageEditor
                  key={message.id}
                  message={message}
                  setMode={setMode}
                  setMessages={setMessages}
                  reload={reload}
                />
              </div>
            )}

            {message.toolInvocations && message.toolInvocations.length > 0 && (
              <div className="flex flex-col gap-4">
                {message.toolInvocations.map((toolInvocation) => {
                  const { toolName, toolCallId, state, args } = toolInvocation;

                  if (state === 'result') {
                    const { result } = toolInvocation;

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
                  return (
                    <div
                      key={toolCallId}
                      className={cx({
                        skeleton: ['getWeather', 'search'].includes(toolName),
                      })}
                    >
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
                })}
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
    if (prevProps.message.attachmentUrl !== nextProps.message.attachmentUrl) 
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
