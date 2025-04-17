'use client';

import type {
  Attachment,
  ChatRequestOptions,
  CreateMessage,
  Message,
} from 'ai';
import cx from 'classnames';
import type React from 'react';
import {
  useRef,
  useEffect,
  useState,
  useCallback,
  type Dispatch,
  type SetStateAction,
  type ChangeEvent,
  memo,
} from 'react';
import { useSidebar } from '@/components/ui/sidebar';
import { toast } from 'sonner';
import { useLocalStorage, useWindowSize } from 'usehooks-ts';
import { nanoid } from 'nanoid';
import { cn, sanitizeUIMessages, generateUUID } from '@/lib/utils';
import { ModelSelector } from '@/components/model-selector';
import {
  Paperclip,
  SendIcon,
  X,
  Globe,
  ArrowUp,
  Loader,
  X as CloseIcon,
  ArrowUpIcon,
  PaperclipIcon,
} from 'lucide-react';
import { ALLOWED_FILE_EXTENSIONS } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import equal from 'fast-deep-equal';
import { AIInputWithSearch } from '@/components/ui/ai-input-with-search';

// Define the interface for the Tavily search options
interface TavilySearchOptions {
  searchDepth?: 'basic' | 'advanced';
  includeAnswer?: boolean;
  maxResults?: number;
  includeDomains?: string[];
  excludeDomains?: string[];
  includeImages?: boolean;
  includeImageDescriptions?: boolean;
  topic?: 'general' | 'news';
  timeRange?: string;
  days?: number;
}

export function PureMultimodalInput({
  chatId,
  input,
  setInput,
  selectedChatModel,
  isLoading,
  stop,
  attachments,
  setAttachments,
  messages,
  setMessages,
  append,
  handleSubmit,
  className,
}: {
  chatId: string;
  input: string;
  setInput: (value: string) => void;
  selectedChatModel: string;
  isLoading: boolean;
  stop: () => void;
  attachments: Array<Attachment>;
  setAttachments: Dispatch<SetStateAction<Array<Attachment>>>;
  messages: Array<Message>;
  setMessages: Dispatch<SetStateAction<Array<Message>>>;
  append: (
    message: Message | CreateMessage,
    chatRequestOptions?: ChatRequestOptions,
  ) => Promise<string | null | undefined>;
  handleSubmit: (
    event?: {
      preventDefault?: () => void;
    },
    chatRequestOptions?: ChatRequestOptions,
  ) => void;
  className?: string;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { width } = useWindowSize();
  const { isMobile, openMobile } = useSidebar();
  const [isSearchEnabled, setIsSearchEnabled] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastInputValue, setLastInputValue] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [showFilePicker, setShowFilePicker] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);

    if (textareaRef.current) {
      adjustHeight();
    }
  }, []);

  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight + 2}px`;
    }
  };

  const resetHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = '98px';
    }
  };

  const [localStorageInput, setLocalStorageInput] = useLocalStorage(
    'input',
    '',
  );

  useEffect(() => {
    if (!isHydrated || !textareaRef.current) return;

    const domValue = textareaRef.current.value;
    const finalValue = domValue || localStorageInput || '';

    if (finalValue !== input) {
      setInput(finalValue);
    }

    adjustHeight();
  }, [isHydrated, localStorageInput, setInput]);

  useEffect(() => {
    if (isHydrated && input) {
      setLocalStorageInput(input);
    }
  }, [input, setLocalStorageInput, isHydrated]);

  const handleInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(event.target.value);
    setLastInputValue(event.target.value);
    adjustHeight();
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadQueue, setUploadQueue] = useState<Array<string>>([]);

  const submitForm = useCallback(() => {
    window.history.replaceState({}, '', `/chat/${chatId}`);

    // Standard submission with or without search based on isSearchEnabled flag
    handleSubmit(undefined, {
      experimental_attachments: attachments,
      ...(isSearchEnabled && {
        body: {
          useSearch: true,
          searchQuery: input,
          searchOptions: {
            searchDepth: 'basic',
            includeAnswer: true,
            maxResults: 10,
            includeDomains: [],
            excludeDomains: [],
            includeImages: true,
            includeImageDescriptions: true,
            topic: 'general',
            timeRange: null,
            days: 3,
          },
        },
      }),
    });

    // Show toast if search is enabled
    if (isSearchEnabled) {
      toast.success('Searching the web for information...', {
        id: 'search-toast',
        duration: 3000,
      });
    }

    setAttachments([]);
    setLocalStorageInput('');
    resetHeight();

    if (width && width > 768) {
      textareaRef.current?.focus();
    }
  }, [
    attachments,
    handleSubmit,
    setAttachments,
    setLocalStorageInput,
    width,
    chatId,
    input,
    isSearchEnabled,
  ]);

  const uploadFile = useCallback(
    async (file: File) => {
      const formData = new FormData();

      // Add the required fields for the upload
      formData.append('file', file);
      formData.append('chatId', chatId); // Add chatId for message attachment

      try {
        const response = await fetch('/api/files/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || `Upload failed with status: ${response.status}`,
          );
        }

        // Parse the response JSON
        const responseData = await response.json();
        const { url, pathname, contentType } = responseData;

        // Return the attachment information
        return {
          url,
          name: pathname,
          contentType: contentType,
        };
      } catch (error) {
        console.error('Upload error:', error);
        toast.error(
          `Failed to upload ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
        return undefined;
      }
    },
    [chatId],
  );

  const handleFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);

      if (files.length === 0) return;

      setUploadQueue(files.map((file) => file.name));

      try {
        // Process files one by one to show individual progress
        const uploadedAttachments: Attachment[] = [];

        for (const file of files) {
          const attachment = await uploadFile(file);
          if (attachment) {
            uploadedAttachments.push(attachment);
          }
        }

        if (uploadedAttachments.length > 0) {
          setAttachments((currentAttachments) => [
            ...currentAttachments,
            ...uploadedAttachments,
          ]);

          // Show toast on successful upload
          toast.success(
            uploadedAttachments.length === 1
              ? `File uploaded successfully: ${uploadedAttachments[0].name?.split('/').pop()}`
              : `Uploaded ${uploadedAttachments.length} files successfully`,
          );
        }
      } catch (error) {
        console.error('Error uploading files!', error);
        toast.error('Error uploading files. Please try again.');
      } finally {
        setUploadQueue([]);
        // Clear the file input value so the same file can be selected again
        if (event.target.value) {
          event.target.value = '';
        }
      }
    },
    [uploadFile, setAttachments],
  );

  const handleAIInputSubmit = (value: string, withSearch: boolean) => {
    // Pastikan nilai tidak kosong dan tidak sedang dalam proses submit
    if (!value.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setInput(value);
    setLastInputValue(value);
    setIsSearchEnabled(withSearch);

    window.history.replaceState({}, '', `/chat/${chatId}`);

    try {
      // Kirim ke server dengan parameter yang sesuai
      handleSubmit(undefined, {
        experimental_attachments: attachments,
        body: {
          useSearch: withSearch,
          searchQuery: value,
          searchOptions: {
            searchDepth: 'basic',
            includeAnswer: true,
            maxResults: 10,
            includeDomains: [],
            excludeDomains: [],
            includeImages: true,
            includeImageDescriptions: true,
            topic: 'general',
            timeRange: null,
            days: 3,
          },
        },
      });

      // Reset state setelah submit
      setAttachments([]);
      setLocalStorageInput('');

      // Tampilkan toast jika search diaktifkan
      if (withSearch) {
        toast.success('Searching the web for information...', {
          id: 'search-toast',
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Error submitting message:', error);
      toast.error('Failed to send message. Please try again.');
    } finally {
      // Reset submission state setelah beberapa saat
      setTimeout(() => {
        setIsSubmitting(false);
      }, 500);
    }
  };

  const handleAIFileSelect = (file: File) => {
    if (fileInputRef.current) {
      // Create a DataTransfer object
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);

      // Set the files property of the input element
      fileInputRef.current.files = dataTransfer.files;

      // Trigger the onChange event handler
      const event = new Event('change', { bubbles: true });
      fileInputRef.current.dispatchEvent(event);
    }
  };

  const handleFormSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    submitForm();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (
      event.key === 'Enter' &&
      !event.shiftKey &&
      !isLoading &&
      input.trim()
    ) {
      event.preventDefault();
      handleFormSubmit(event);
    }
  };

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const uploadedAttachment = await uploadFile(file);
      if (uploadedAttachment) {
        setAttachments((currentAttachments) => [
          ...currentAttachments,
          uploadedAttachment,
        ]);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload file. Please try again.');
    } finally {
      setIsUploading(false);
      setShowFilePicker(false);
    }
  };

  return (
    <div
      className={`flex gap-2 flex-col w-full overflow-y-auto ${className || ''}`}
      data-mobile-sidebar-open={isMobile && openMobile ? 'true' : 'false'}
    >
      <div className="flex flex-col w-full gap-2 relative">
        <div
          className={cn(
            'relative w-full p-0 overflow-hidden rounded-xl border flex flex-col',
            'bg-black/5 dark:bg-white/5',
            'focus-within:ring-1 focus-within:ring-ring focus-within:border-input',
            'dark:border-zinc-700',
            'shadow-sm',
            'flex flex-col',
            className,
          )}
        >
          <Textarea
            ref={textareaRef}
            tabIndex={0}
            placeholder="Send a message..."
            name="message"
            value={input}
            className={cn(
              'min-h-[24px] w-full resize-none border-0 bg-transparent',
              'py-1.5 sm:py-3 px-2 sm:px-4 max-h-[300px] overflow-y-auto',
              'focus-visible:outline-none focus-visible:ring-0',
              'text-sm sm:text-base placeholder:text-muted-foreground placeholder:opacity-70 dark:text-white',
              'rounded-t-xl',
              input.length === 0 && 'min-h-[48px]',
            )}
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            rows={1}
            data-state={isLoading ? 'disabled' : 'enabled'}
            onChange={handleInput}
            data-gramm="false"
            data-gramm_editor="false"
            data-enable-grammarly="false"
            disabled={isLoading || uploadQueue.length > 0}
            onKeyDown={handleKeyDown}
            suppressHydrationWarning
          />

          {input.trim().length > 0 && !isLoading && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-[36px] sm:right-[60px] top-[8px] sm:top-[10px] size-5 sm:size-6 p-0.5 sm:p-1 text-muted-foreground hover:text-foreground z-10"
              onClick={(e) => {
                e.preventDefault();
                setInput('');
                adjustHeight();
                textareaRef.current?.focus();
              }}
              aria-label="Clear input"
            >
              <X size={14} className="sm:size-[16px]" />
            </Button>
          )}

          {/* New bottom row for ModelSelector and action buttons */}
          <div className="flex items-center justify-between px-2 sm:px-3 py-1.5 border-t dark:border-zinc-700 bg-transparent">
            {/* ModelSelector */}
            <ModelSelector
              selectedModelId={selectedChatModel}
              className={cn('h-7 text-xs px-1 border-none bg-transparent hover:bg-black/5 dark:hover:bg-white/5 ring-offset-0 focus-visible:ring-0')}
            />

            {/* Action buttons container */}
            <div className="flex items-center gap-1 sm:gap-2 chat-input-buttons">
              {/* Search web button - now toggles search mode instead of component */}
              <button
                type="button"
                aria-label={
                  isSearchEnabled ? 'Disable web search' : 'Enable web search'
                }
                onClick={() => setIsSearchEnabled(!isSearchEnabled)}
                title={
                  isSearchEnabled ? 'Disable web search' : 'Enable web search'
                }
                className={cn(
                  'p-1.5 rounded-full',
                  isSearchEnabled
                    ? 'bg-blue-500/15 text-blue-500'
                    : 'bg-black/5 dark:bg-white/5 text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white',
                )}
              >
                <Globe
                  className={isSearchEnabled ? 'text-blue-500' : ''}
                  size={18}
                />
              </button>

              {/* Upload button */}
              <button
                type="button"
                aria-label="Upload file"
                disabled={isLoading}
                onClick={(e) => {
                  e.preventDefault();
                  if (fileInputRef.current) {
                    fileInputRef.current.click();
                  }
                }}
                className="p-1.5 rounded-full bg-black/5 dark:bg-white/5 text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white"
              >
                <PaperclipIcon size={18} />
              </button>

              {/* Send/Stop button */}
              {isLoading ? (
                <button
                  type="button"
                  aria-label="Stop generating"
                  onClick={(event) => {
                    event.preventDefault();
                    stop();
                    setMessages((messages) => sanitizeUIMessages(messages));
                  }}
                  className="p-1.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20"
                >
                  <X size={18} />
                </button>
              ) : (
                <button
                  type="button"
                  aria-label={isSearchEnabled ? 'Search web' : 'Send message'}
                  className={cn(
                    'p-1 sm:p-1.5 rounded-full',
                    input.trim()
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                      : 'bg-black/5 dark:bg-white/5 text-black/40 dark:text-white/40',
                  )}
                  onClick={(event) => {
                    event.preventDefault();
                    submitForm();
                  }}
                  disabled={
                    input.length === 0 || uploadQueue.length > 0 || isSubmitting
                  }
                >
                  <ArrowUp size={16} className="sm:size-[18px]" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Display search status indicator if search is enabled */}
      {isSearchEnabled && !isLoading && (
        <div className="text-xs text-blue-500 flex items-center gap-1 px-2">
          <Globe size={12} />
          <span>Web search enabled</span>
        </div>
      )}

      {/* Display selected files */}
      {uploadQueue.length > 0 && <UploadProgress files={uploadQueue} />}

      {/* Display attached files ready to be sent */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {attachments.map((attachment) => {
            // Extract filename from the full path
            const filename = attachment.name?.split('/').pop() || 'File';
            // Get file extension for display
            const extension = filename.split('.').pop()?.toUpperCase() || '';

            return (
              <div
                key={attachment.url}
                className="bg-muted text-xs rounded-md p-2 flex items-center gap-2"
              >
                <div className="flex items-center justify-center size-5 rounded bg-primary/10 text-[10px] font-semibold">
                  {extension}
                </div>
                <span className="truncate max-w-[150px]">{filename}</span>
                <button
                  type="button"
                  className="ml-2 text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    setAttachments((current) =>
                      current.filter((a) => a.url !== attachment.url),
                    );
                  }}
                >
                  <X size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        className="hidden"
        type="file"
        accept={ALLOWED_FILE_EXTENSIONS}
        onChange={handleFileChange}
        multiple
      />
    </div>
  );
}

export const MultimodalInput = memo(
  PureMultimodalInput,
  (prevProps, nextProps) => {
    if (prevProps.input !== nextProps.input) return false;
    if (prevProps.isLoading !== nextProps.isLoading) return false;
    if (prevProps.selectedChatModel !== nextProps.selectedChatModel) return false;
    if (!equal(prevProps.attachments, nextProps.attachments)) return false;

    return true;
  },
);

function PureAttachmentsButton({
  fileInputRef,
  isLoading,
}: {
  fileInputRef: React.MutableRefObject<HTMLInputElement | null>;
  isLoading: boolean;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="rounded-full mobile-tap-target"
      disabled={isLoading}
      onClick={(e) => {
        if (fileInputRef.current) {
          fileInputRef.current.click();
        }
      }}
    >
      <Paperclip className="size-[18px]" />
    </Button>
  );
}

const AttachmentsButton = memo(PureAttachmentsButton);

function PureStopButton({
  stop,
  setMessages,
}: {
  stop: () => void;
  setMessages: Dispatch<SetStateAction<Array<Message>>>;
}) {
  return (
    <Button
      className="rounded-full p-1.5 h-fit border dark:border-zinc-600 mobile-tap-target"
      onClick={(event) => {
        event.preventDefault();
        stop();
        setMessages((messages) => sanitizeUIMessages(messages));
      }}
    >
      <X className="size-[18px]" />
    </Button>
  );
}

const StopButton = memo(PureStopButton);

function PureSendButton({
  submitForm,
  input,
  uploadQueue,
  isSubmitting,
}: {
  submitForm: () => void;
  input: string;
  uploadQueue: Array<string>;
  isSubmitting?: boolean;
}) {
  return (
    <Button
      className="rounded-full p-1.5 h-fit border dark:border-zinc-600 mobile-tap-target"
      onClick={(event) => {
        event.preventDefault();
        submitForm();
      }}
      disabled={input.length === 0 || uploadQueue.length > 0 || isSubmitting}
    >
      <SendIcon className="size-[18px]" />
    </Button>
  );
}

const SendButton = memo(PureSendButton, (prevProps, nextProps) => {
  if (prevProps.uploadQueue.length !== nextProps.uploadQueue.length)
    return false;
  if (prevProps.input !== nextProps.input) return false;
  if (prevProps.isSubmitting !== nextProps.isSubmitting) return false;
  return true;
});

function UploadProgress({ files }: { files: Array<string> }) {
  return (
    <div className="flex flex-col gap-1 mt-1">
      <p className="text-xs text-muted-foreground">Uploading...</p>
      {files.map((filename) => (
        <div
          key={filename}
          className="text-xs bg-muted p-2 rounded-md flex items-center"
        >
          <span className="truncate max-w-[200px]">{filename}</span>
          <span className="ml-auto shrink-0">
            <Loader size={12} className="animate-spin" />
          </span>
        </div>
      ))}
    </div>
  );
}

function FilePickerContent({
  onPickFile,
  onClose,
}: {
  onPickFile: (file: File) => void;
  onClose: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    files.forEach((file) => onPickFile(file));
  };

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={fileInputRef}
        className="hidden"
        type="file"
        accept={ALLOWED_FILE_EXTENSIONS}
        onChange={handleFileChange}
        multiple
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-9 rounded-full text-muted-foreground hover:text-foreground"
        onClick={onClose}
      >
        <CloseIcon className="size-[18px]" />
      </Button>
    </div>
  );
}
