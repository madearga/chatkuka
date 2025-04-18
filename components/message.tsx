'use client';

import type { ChatRequestOptions, Message, UIMessage } from 'ai';
import cx from 'classnames';
import { AnimatePresence, motion } from 'framer-motion';
import { memo, useMemo, useState } from 'react';

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
import { cn, getFileTypeFromUrl, generateUUID } from '@/lib/utils';
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
import { CollapsibleMessage } from './collapsible-message';
import { Section, ToolArgsSection } from './section';
import { ToolBadge } from './tool-badge';

import { File, FileText, FileSpreadsheet, FileCode, Search, Globe } from 'lucide-react';

// Simple loading indicator component for text responses
const ThinkingDots = () => (
  <div className="flex space-x-1 items-center h-full py-1">
    <span className="sr-only">Generating response...</span>
    <div className="h-1.5 w-1.5 bg-current rounded-full animate-bounce [animation-delay:-0.3s]"></div>
    <div className="h-1.5 w-1.5 bg-current rounded-full animate-bounce [animation-delay:-0.15s]"></div>
    <div className="h-1.5 w-1.5 bg-current rounded-full animate-bounce"></div>
  </div>
);

// Component to render tool invocations
interface RenderToolInvocationProps {
  toolInvocation: any;
  isReadonly: boolean;
}

function RenderToolInvocation({ toolInvocation, isReadonly }: RenderToolInvocationProps) {
  const { toolName, toolCallId, state, args } = toolInvocation;
  const result = toolInvocation.result;

  // Helper function to parse JSON if it's a string
  const parseJsonIfString = (data: any) => {
    if (typeof data === 'string') {
      try {
        return JSON.parse(data);
      } catch (e) {
        console.warn('Failed to parse JSON string:', e);
        return data;
      }
    }
    return data;
  };

  // Parse result and args if they're JSON strings (happens when loaded from history)
  const parsedResult = parseJsonIfString(result);
  const parsedArgs = parseJsonIfString(args);

  // Handle Tavily Search Tool
  if (toolName === 'tavilySearchTool') {
    if (state === 'call') {
      return (
        <CollapsibleMessage
          header={<ToolArgsSection tool="search">{parsedArgs?.query}</ToolArgsSection>}
          isOpen={true}
        >
          <SearchProgress status="searching" query={parsedArgs?.query} />
        </CollapsibleMessage>
      );
    }

    if (state === 'result' && parsedResult) {
      // Check if we have a valid search result
      const searchResult = parsedResult;

      if (searchResult.error) {
        return (
          <CollapsibleMessage
            header={<ToolArgsSection tool="search">{args?.query || searchResult.query}</ToolArgsSection>}
            isOpen={true}
          >
            <SearchProgress status="error" query={args?.query || searchResult.query} error={searchResult.error} />
          </CollapsibleMessage>
        );
      }

      return (
        <CollapsibleMessage
          header={<ToolArgsSection tool="search">{args?.query || searchResult.query}</ToolArgsSection>}
          isOpen={true}
        >
          <Section title="Sources" icon={<Globe className="size-4 text-sky-500" />}>
            <SearchResults
              results={searchResult.results || []}
              query={searchResult.query || 'Unknown query'}
              answer={searchResult.answer}
              images={searchResult.images}
              responseTime={searchResult.responseTime}
            />
          </Section>
        </CollapsibleMessage>
      );
    }
  }

  // Handle other tools without CollapsibleMessage
  if (state === 'call') {
    return (
      <div key={toolCallId}>
        {toolName === 'getWeather' ? (
          <Weather />
        ) : toolName === 'createDocument' ? (
          <DocumentPreview
            isReadonly={isReadonly}
            args={parsedArgs}
          />
        ) : toolName === 'updateDocument' ? (
          <DocumentToolCall
            type="update"
            args={parsedArgs}
            isReadonly={isReadonly}
          />
        ) : toolName === 'requestSuggestions' ? (
          <DocumentToolCall
            type="request-suggestions"
            args={parsedArgs}
            isReadonly={isReadonly}
          />
        ) : (
          <div className="p-3 border rounded-md bg-muted/50">
            <ToolBadge tool={toolName} className="mb-2" />
            <pre className="text-xs overflow-auto">{JSON.stringify(parsedArgs, null, 2)}</pre>
          </div>
        )}
      </div>
    );
  }

  if (state === 'result' && parsedResult !== undefined) {
    // Check if this is a document result
    const isDocumentResult = toolName === 'createDocument' ||
                            (parsedResult && typeof parsedResult === 'object' &&
                             (parsedResult.kind === 'text' || parsedResult.kind === 'code' ||
                              parsedResult.kind === 'sheet' || parsedResult.kind === 'image'));

    // Check if this is a search result
    const isSearchResult = toolName === 'tavilySearchTool' ||
                          (parsedResult && typeof parsedResult === 'object' &&
                           parsedResult.results && Array.isArray(parsedResult.results) &&
                           parsedResult.query);

    return (
      <div key={toolCallId}>
        {toolName === 'getWeather' ? (
          <Weather weatherAtLocation={parsedResult} />
        ) : isDocumentResult ? (
          <DocumentPreview
            isReadonly={isReadonly}
            result={parsedResult}
          />
        ) : toolName === 'updateDocument' ? (
          <DocumentToolResult
            type="update"
            result={parsedResult}
            isReadonly={isReadonly}
          />
        ) : toolName === 'requestSuggestions' ? (
          <DocumentToolResult
            type="request-suggestions"
            result={parsedResult}
            isReadonly={isReadonly}
          />
        ) : isSearchResult ? (
          <CollapsibleMessage
            header={<ToolArgsSection tool="search">{parsedResult.query}</ToolArgsSection>}
            isOpen={true}
          >
            <Section title="Sources" icon={<Globe className="size-4 text-sky-500" />}>
              <SearchResults
                results={parsedResult.results || []}
                query={parsedResult.query || 'Unknown query'}
                answer={parsedResult.answer}
                images={parsedResult.images}
                responseTime={parsedResult.responseTime}
              />
            </Section>
          </CollapsibleMessage>
        ) : (
          <div className="p-3 border rounded-md bg-muted/50">
            <ToolBadge tool={toolName} className="mb-2" />
            <pre className="text-xs overflow-auto">{JSON.stringify(parsedResult, null, 2)}</pre>
          </div>
        )}
      </div>
    );
  }

  return null;
}

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
  isLoading,
  setMessages,
  reload,
  isReadonly,
}: {
  chatId: string;
  message: UIMessage;
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
      const fullName =
        (message as any).attachmentUrl.split('/').pop() || 'file';
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
              className="w-full mx-auto max-w-3xl px-0.5 sm:px-4 group/message"
              initial={{ y: 5, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ opacity: 0, y: -5, transition: { duration: 0.1 } }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              layout
              data-role={message.role}
            >
              <div
                className={cn(
                  'flex gap-2 sm:gap-4 w-full group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl',
                  {
                    'w-full': mode === 'edit',
                    'group-data-[role=user]/message:w-fit': mode !== 'edit',
                  },
                )}
              >
                {message.role === 'assistant' && (
                  <div className="size-7 sm:size-8 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border bg-background/80">
                    <div className="translate-y-px">
                      <SparklesIcon size={12} />
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-2 sm:gap-3 w-full overflow-hidden max-w-full">
                  {/* Render message.parts */}
                  {message.parts?.map((part, index) => {
                    switch (part.type) {
                      case 'text':
                        // Helper function to check if text is a JSON string
                        const isJsonString = (str: string) => {
                          try {
                            const parsed = JSON.parse(str);
                            return typeof parsed === 'object' && parsed !== null;
                          } catch (e) {
                            return false;
                          }
                        };

                        // Try to parse JSON if it's a string
                        let parsedContent = null;
                        if (part.text && isJsonString(part.text)) {
                          try {
                            parsedContent = JSON.parse(part.text);
                          } catch (e) {
                            console.warn('Failed to parse JSON content:', e);
                          }
                        }

                        // Direct check for the exact format seen in the screenshots
                        // This handles the case where the text is exactly in the format: {"query": "...", "maxResults": 3}
                        const isExactSearchFormat = part.text && (
                          (part.text.includes('"query"') && part.text.includes('"maxResults"')) ||
                          (part.text.includes('"query":') && part.text.includes('"maxResults":'))
                        );

                        // Check if the text looks like a raw JSON object (starts with { and ends with })
                        const isRawJson = part.text &&
                          part.text.trim().startsWith('{') &&
                          part.text.trim().endsWith('}');

                        // Check if this text part might be a search result stored as JSON
                        const isSearchResult =
                          // Direct text match for the exact format
                          isExactSearchFormat ||
                          // Parsed content checks
                          (parsedContent && (
                            // Full search result format
                            (parsedContent.query && (parsedContent.results || parsedContent.maxResults)) ||
                            // Simple query+maxResults format
                            (typeof parsedContent.query === 'string' && typeof parsedContent.maxResults === 'number')
                          ));

                        // Log for debugging
                        if (isRawJson || isExactSearchFormat) {
                          console.log('[Message] Raw JSON text part:', part.text);
                          console.log('[Message] Is exact search format:', isExactSearchFormat);
                          if (parsedContent) {
                            console.log('[Message] Parsed content:', parsedContent);
                          }
                        }

                        // Check if the text looks like a document result stored as JSON
                        const isDocumentJson = part.text &&
                          part.text.trim().startsWith('{') &&
                          part.text.trim().endsWith('}') &&
                          (part.text.includes('"kind"') || part.text.includes('"kind":'));

                        // Check if this text part might be a document result stored as JSON
                        const isDocumentResult =
                          // Direct check for document JSON format
                          isDocumentJson ||
                          // Parsed content checks
                          (parsedContent && (
                            parsedContent.id &&
                            parsedContent.title &&
                            (parsedContent.kind === 'text' ||
                             parsedContent.kind === 'code' ||
                             parsedContent.kind === 'sheet' ||
                             parsedContent.kind === 'image')
                          ));

                        // If it looks like a search result, render it as a search component
                        if (isSearchResult || isRawJson) {
                          // For any raw JSON or exact format seen in the screenshot, we need special handling
                          if (isExactSearchFormat || isRawJson) {
                            // Extract query and maxResults directly from the text
                            let query = '';
                            let maxResults = 3; // Default
                            let results = null;

                            try {
                              // Try to parse the JSON format
                              const parsedJson = JSON.parse(part.text);

                              // Check if this is a search result with results
                              if (parsedJson.query && parsedJson.results && Array.isArray(parsedJson.results)) {
                                // This is a full search result, render it as such
                                return (
                                  <div key={index} className="w-full">
                                    <CollapsibleMessage
                                      header={<ToolArgsSection tool="search">{parsedJson.query}</ToolArgsSection>}
                                      isOpen={true}
                                    >
                                      <Section title="Sources" icon={<Globe className="size-4 text-sky-500" />}>
                                        <SearchResults
                                          results={parsedJson.results || []}
                                          query={parsedJson.query}
                                          answer={parsedJson.answer}
                                          images={parsedJson.images}
                                          responseTime={parsedJson.responseTime}
                                        />
                                      </Section>
                                    </CollapsibleMessage>
                                  </div>
                                );
                              }

                              // Otherwise, extract query for the simplified format
                              query = parsedJson.query || '';
                              maxResults = parsedJson.maxResults || 3;
                            } catch (e) {
                              console.warn('Failed to parse JSON for search:', e);
                              // If parsing fails, try to extract using regex
                              const queryMatch = part.text.match(/"query"\s*:\s*"([^"]+)"/i);
                              if (queryMatch && queryMatch[1]) {
                                query = queryMatch[1];
                              }
                            }

                            // If we couldn't extract a query, don't render as search
                            if (!query) {
                              return (
                                <div key={index} className="prose dark:prose-invert">
                                  <Markdown content={part.text} />
                                </div>
                              );
                            }

                            console.log('[Message] Extracted query:', query);

                            // Create a web search component that will re-run the search
                            return (
                              <div key={index} className="w-full">
                                <CollapsibleMessage
                                  header={<ToolArgsSection tool="search">{query}</ToolArgsSection>}
                                  isOpen={true}
                                >
                                  <div className="p-4 bg-muted/30 rounded-lg">
                                    <div className="flex items-center gap-2 mb-2">
                                      <Globe className="size-4 text-sky-500" />
                                      <span className="font-medium">Web search: {query}</span>
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      <p>This search result was loaded from history. Click below to refresh the search.</p>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="mt-2"
                                        onClick={() => {
                                          // Create a new tool invocation for the search
                                          const toolInvocation = {
                                            toolName: 'tavilySearchTool',
                                            toolCallId: generateUUID(),
                                            state: 'call',
                                            args: { query },
                                          };

                                          // Add the tool invocation to the message
                                          const newPart = {
                                            type: 'tool-invocation',
                                            toolInvocation,
                                          } as any; // Use type assertion to avoid TypeScript errors

                                          // Update the message with the new part
                                          if (setMessages) {
                                            setMessages(prev => {
                                              const updatedMessages = [...prev];
                                              const messageIndex = updatedMessages.findIndex(m => m.id === message.id);
                                              if (messageIndex !== -1) {
                                                const updatedParts = [...(updatedMessages[messageIndex].parts || [])];
                                                const partIndex = updatedParts.findIndex(p => p === part);
                                                if (partIndex !== -1) {
                                                  updatedParts[partIndex] = newPart;
                                                  updatedMessages[messageIndex].parts = updatedParts;
                                                }
                                              }
                                              return updatedMessages;
                                            });
                                          }
                                        }}
                                      >
                                        Refresh Search
                                      </Button>
                                    </div>
                                  </div>
                                </CollapsibleMessage>
                              </div>
                            );
                          }

                          // For the simplified format (just query and maxResults), we need to create a proper search component
                          // that will trigger a new search with the same query
                          const isSimplifiedFormat = parsedContent && parsedContent.query && parsedContent.maxResults && !parsedContent.results;

                          if (isSimplifiedFormat) {
                            // Create a web search component that will re-run the search
                            return (
                              <div key={index} className="w-full">
                                <CollapsibleMessage
                                  header={<ToolArgsSection tool="search">{parsedContent.query}</ToolArgsSection>}
                                  isOpen={true}
                                >
                                  <div className="p-4 bg-muted/30 rounded-lg">
                                    <div className="flex items-center gap-2 mb-2">
                                      <Globe className="size-4 text-sky-500" />
                                      <span className="font-medium">Web search: {parsedContent.query}</span>
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      <p>This search result was loaded from history. Click below to refresh the search.</p>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="mt-2"
                                        onClick={() => {
                                          // Create a new tool invocation for the search
                                          const toolInvocation = {
                                            toolName: 'tavilySearchTool',
                                            toolCallId: generateUUID(),
                                            state: 'call',
                                            args: { query: parsedContent.query },
                                          };

                                          // Add the tool invocation to the message
                                          const newPart = {
                                            type: 'tool-invocation',
                                            toolInvocation,
                                          } as any; // Use type assertion to avoid TypeScript errors

                                          // Update the message with the new part
                                          if (setMessages) {
                                            setMessages(prev => {
                                              const updatedMessages = [...prev];
                                              const messageIndex = updatedMessages.findIndex(m => m.id === message.id);
                                              if (messageIndex !== -1) {
                                                const updatedParts = [...(updatedMessages[messageIndex].parts || [])];
                                                const partIndex = updatedParts.findIndex(p => p === part);
                                                if (partIndex !== -1) {
                                                  updatedParts[partIndex] = newPart;
                                                  updatedMessages[messageIndex].parts = updatedParts;
                                                }
                                              }
                                              return updatedMessages;
                                            });
                                          }
                                        }}
                                      >
                                        Refresh Search
                                      </Button>
                                    </div>
                                  </div>
                                </CollapsibleMessage>
                              </div>
                            );
                          }

                          // For the full format with results, render the normal search results component
                          return (
                            <div key={index} className="w-full">
                              <CollapsibleMessage
                                header={<ToolArgsSection tool="search">{parsedContent.query}</ToolArgsSection>}
                                isOpen={true}
                              >
                                <Section title="Sources" icon={<Globe className="size-4 text-sky-500" />}>
                                  <SearchResults
                                    results={parsedContent.results || []}
                                    query={parsedContent.query}
                                    answer={parsedContent.answer}
                                    images={parsedContent.images}
                                    responseTime={parsedContent.responseTime}
                                  />
                                </Section>
                              </CollapsibleMessage>
                            </div>
                          );
                        }

                        // If it looks like a document result, render it as a document preview
                        if (isDocumentResult) {
                          return (
                            <div key={index} className="w-full">
                              <DocumentPreview
                                isReadonly={isReadonly}
                                result={parsedContent}
                              />
                            </div>
                          );
                        }

                        // Regular text rendering
                        return (
                          <div
                            key={index}
                            className="flex flex-row items-start gap-1 sm:gap-2"
                          >
                            {message.role === 'user' &&
                              !isReadonly &&
                              mode === 'view' && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="size-6 shrink-0 mt-1"
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
                                message.role === 'user'
                                  ? 'bg-primary text-white dark:bg-zinc-800 dark:text-white px-2 py-1.5 sm:px-3 sm:py-2 rounded-xl group-data-[role=user]/message:ml-auto'
                                  : 'bg-muted/50 text-foreground border border-border/50 px-2 py-1.5 sm:px-3 sm:py-2 rounded-xl',
                              )}
                            >
                              {message.role === 'assistant' && isLoading ? (
                                <ThinkingDots />
                              ) : (
                                <Markdown
                                  className={cn(
                                    'prose max-w-full text-sm sm:text-base',
                                    message.role === 'user'
                                      ? 'text-white dark:text-white'
                                      : 'text-foreground',
                                  )}
                                >
                                  {part.text}
                                </Markdown>
                              )}
                            </div>
                          </div>
                        );
                      case 'tool-invocation': {
                        // Log the incoming part
                        console.log(
                          '[PurePreviewMessage] Rendering part...',
                          part,
                        );

                        return <RenderToolInvocation
                          key={index}
                          toolInvocation={part.toolInvocation}
                          isReadonly={isReadonly}
                        />;
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
                              ...(part.mimeType
                                ? { mimeType: part.mimeType }
                                : {}),
                            }}
                          />
                        );
                      case 'source':
                        return (
                          <div
                            key={index}
                            className="text-xs text-muted-foreground"
                          >
                            <a
                              href={part.source.url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {part.source.title || part.source.url}
                            </a>
                          </div>
                        );
                      default:
                        console.warn(
                          `Unhandled message part type: ${(part as any).type}`,
                        );
                        return null;
                    }
                  })}

                  {/* Display attachment from database (legacy) */}
                  {(message as any).attachmentUrl && (
                    <div
                      className={cn(
                        'flex items-start gap-3 p-3 rounded-lg shadow-sm',
                        message.role === 'user'
                          ? 'bg-zinc-800/20 ml-auto dark:bg-zinc-700/20'
                          : 'bg-muted/80',
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center size-10 rounded-md bg-zinc-800/20 dark:bg-zinc-700/20 shrink-0">
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
                        className="mt-2 sm:mt-0 sm:ml-auto py-1.5 px-3 text-sm bg-zinc-800/20 hover:bg-zinc-800/30 text-zinc-800 dark:text-white dark:bg-zinc-700/50 dark:hover:bg-zinc-700/70 rounded-md transition-colors"
                      >
                        Open
                      </a>
                    </div>
                  )}

                  {!isReadonly && (
                    <MessageActions
                      chatId={chatId}
                      message={message}
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
              ? formatDistanceToNow(new Date(message.createdAt), {
                  addSuffix: true,
                })
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
    if (
      (prevProps.message as any).attachmentUrl !==
      (nextProps.message as any).attachmentUrl
    )
      return false;
    if (
      !equal(
        prevProps.message.toolInvocations,
        nextProps.message.toolInvocations,
      )
    )
      return false;

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
