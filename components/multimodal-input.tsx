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
import { toast } from 'sonner';
import { useLocalStorage, useWindowSize } from 'usehooks-ts';
import { nanoid } from 'nanoid';

import { sanitizeUIMessages, generateUUID } from '@/lib/utils';

import { ArrowUpIcon, PaperclipIcon, StopIcon } from './icons';
import { PreviewAttachment } from './preview-attachment';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { SuggestedActions } from './suggested-actions';
import equal from 'fast-deep-equal';
import { AIInputWithSearch } from './ui/ai-input-with-search';
import { Globe } from 'lucide-react';

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

function PureMultimodalInput({
  chatId,
  input,
  setInput,
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
  const [useAIInput, setUseAIInput] = useState(false);
  const [searchEnabled, setSearchEnabled] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastInputValue, setLastInputValue] = useState("");

  useEffect(() => {
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
    if (textareaRef.current) {
      const domValue = textareaRef.current.value;
      // Prefer DOM value over localStorage to handle hydration
      const finalValue = domValue || localStorageInput || '';
      setInput(finalValue);
      adjustHeight();
    }
    // Only run once after hydration
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setLocalStorageInput(input);
  }, [input, setLocalStorageInput]);

  const handleInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(event.target.value);
    setLastInputValue(event.target.value);
    adjustHeight();
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadQueue, setUploadQueue] = useState<Array<string>>([]);

  const submitForm = useCallback(() => {
    window.history.replaceState({}, '', `/chat/${chatId}`);

    // Standard submission without search
    handleSubmit(undefined, {
      experimental_attachments: attachments,
    });

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
  ]);

  const uploadFile = async (file: File) => {
    const formData = new FormData();
    
    // Add the required fields for the upload
    const docId = generateUUID();
    formData.append('file', file);
    formData.append('id', docId);
    formData.append('kind', 'image'); // Assuming uploads are always images for now

    try {
      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
      });

      // Parse the response JSON once
      const responseData = await response.json();
      
      if (response.ok) {
        const { url, pathname, contentType } = responseData;

        return {
          url,
          name: pathname,
          contentType: contentType,
          id: responseData.documentId || docId, // Store document ID for reference
        };
      }
      
      // If we get here, there was an error
      toast.error(responseData.error || 'Unknown error occurred');
      return undefined;
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload file, please try again!');
      return undefined;
    }
  };

  const handleFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);

      setUploadQueue(files.map((file) => file.name));

      try {
        const uploadPromises = files.map((file) => uploadFile(file));
        const uploadedAttachments = await Promise.all(uploadPromises);
        const successfullyUploadedAttachments = uploadedAttachments.filter(
          (attachment) => attachment !== undefined,
        );

        setAttachments((currentAttachments) => [
          ...currentAttachments,
          ...successfullyUploadedAttachments,
        ]);
      } catch (error) {
        console.error('Error uploading files!', error);
      } finally {
        setUploadQueue([]);
      }
    },
    [setAttachments],
  );

  const handleAIInputSubmit = (value: string, withSearch: boolean) => {
    // Pastikan nilai tidak kosong dan tidak sedang dalam proses submit
    if (!value.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    setInput(value);
    setLastInputValue(value);
    setSearchEnabled(withSearch);
    
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
            days: 3
          }
        }
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

  return (
    <div className="relative w-full flex flex-col gap-4">
      {messages.length === 0 &&
        attachments.length === 0 &&
        uploadQueue.length === 0 && (
          <SuggestedActions append={append} chatId={chatId} />
        )}

      <input
        type="file"
        className="fixed -top-4 -left-4 size-0.5 opacity-0 pointer-events-none"
        ref={fileInputRef}
        multiple
        onChange={handleFileChange}
        tabIndex={-1}
      />

      {(attachments.length > 0 || uploadQueue.length > 0) && (
        <div className="flex flex-row gap-2 overflow-x-auto pb-2 items-end w-full max-w-full">
          {attachments.map((attachment) => (
            <PreviewAttachment key={attachment.url} attachment={attachment} />
          ))}

          {uploadQueue.map((filename) => (
            <PreviewAttachment
              key={filename}
              attachment={{
                url: '',
                name: filename,
                contentType: '',
              }}
              isUploading={true}
            />
          ))}
        </div>
      )}

      {useAIInput ? (
        <div className="relative">
          <AIInputWithSearch 
            placeholder="Send a message..."
            onSubmit={handleAIInputSubmit}
            onFileSelect={handleAIFileSelect}
            className="pb-0"
            defaultSearchEnabled={searchEnabled}
            initialValue={lastInputValue}
          />
          <Button
            className="absolute top-4 right-4 rounded-full p-1.5 h-fit border dark:border-zinc-600 z-10"
            onClick={() => {
              setUseAIInput(false);
              setInput(lastInputValue);
            }}
            variant="ghost"
            disabled={isSubmitting}
          >
            <Globe size={14} />
          </Button>
        </div>
      ) : (
        <>
          <Textarea
            ref={textareaRef}
            placeholder="Send a message..."
            value={input}
            onChange={handleInput}
            className={cx(
              'min-h-[24px] max-h-[calc(75dvh)] overflow-hidden resize-none rounded-2xl !text-base bg-muted pb-10 dark:border-zinc-700 w-full',
              className,
            )}
            rows={2}
            autoFocus
            disabled={isSubmitting}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();

                if (isLoading) {
                  toast.error('Please wait for the model to finish its response!');
                } else {
                  submitForm();
                }
              }
            }}
          />

          <div className="absolute bottom-0 left-0 p-2 w-fit flex flex-row justify-start z-10">
            <AttachmentsButton fileInputRef={fileInputRef} isLoading={isLoading || isSubmitting} />
            <Button
              className="rounded-md rounded-bl-lg p-[7px] h-fit dark:border-zinc-700 hover:dark:bg-zinc-900 hover:bg-zinc-200 ml-2"
              onClick={() => {
                setUseAIInput(true);
              }}
              disabled={isLoading || isSubmitting}
              variant="ghost"
            >
              <Globe size={14} />
            </Button>
          </div>

          <div className="absolute bottom-0 right-0 p-2 w-fit flex flex-row justify-end z-10">
            {isLoading ? (
              <StopButton stop={stop} setMessages={setMessages} />
            ) : (
              <SendButton
                input={input}
                submitForm={submitForm}
                uploadQueue={uploadQueue}
                isSubmitting={isSubmitting}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}

export const MultimodalInput = memo(
  PureMultimodalInput,
  (prevProps, nextProps) => {
    if (prevProps.input !== nextProps.input) return false;
    if (prevProps.isLoading !== nextProps.isLoading) return false;
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
      className="rounded-md rounded-bl-lg p-[7px] h-fit dark:border-zinc-700 hover:dark:bg-zinc-900 hover:bg-zinc-200"
      onClick={(event) => {
        event.preventDefault();
        fileInputRef.current?.click();
      }}
      disabled={isLoading}
      variant="ghost"
    >
      <PaperclipIcon size={14} />
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
      className="rounded-full p-1.5 h-fit border dark:border-zinc-600"
      onClick={(event) => {
        event.preventDefault();
        stop();
        setMessages((messages) => sanitizeUIMessages(messages));
      }}
    >
      <StopIcon size={14} />
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
      className="rounded-full p-1.5 h-fit border dark:border-zinc-600"
      onClick={(event) => {
        event.preventDefault();
        submitForm();
      }}
      disabled={input.length === 0 || uploadQueue.length > 0 || isSubmitting}
    >
      <ArrowUpIcon size={14} />
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
