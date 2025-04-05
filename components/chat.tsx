'use client';

import type { Attachment, Message } from 'ai';
import { useChat } from 'ai/react';
import { useState, useCallback, useMemo } from 'react';
import useSWR, { useSWRConfig } from 'swr';

import { ChatHeader } from '@/components/chat-header';
import type { Vote } from '@/lib/db/schema';
import { fetcher, generateUUID } from '@/lib/utils';

import { Artifact } from './artifact';
import { MultimodalInput } from './multimodal-input';
import { Messages } from './messages';
import { VisibilityType } from './visibility-selector';
import { useArtifactSelector } from '@/hooks/use-artifact';
import { toast } from 'sonner';
import { SYSTEM_PROMPT_DEFAULT } from '@/lib/ai/config';
import { PromptSystem } from '@/components/chat-input/prompt-system';

export function Chat({
  id,
  initialMessages,
  selectedChatModel,
  selectedVisibilityType,
  isReadonly,
}: {
  id: string;
  initialMessages: Array<Message>;
  selectedChatModel: string;
  selectedVisibilityType: VisibilityType;
  isReadonly: boolean;
}) {
  const { mutate } = useSWRConfig();

  const [selectedSystemPrompt, setSelectedSystemPrompt] = useState<string | undefined>(SYSTEM_PROMPT_DEFAULT);

  const {
    messages,
    setMessages,
    handleSubmit,
    input,
    setInput,
    append,
    isLoading,
    stop,
    reload,
    data,
  } = useChat({
    id,
    body: { id, selectedChatModel: selectedChatModel, systemPrompt: selectedSystemPrompt },
    initialMessages,
    experimental_throttle: 100,
    sendExtraMessageFields: true,
    generateId: generateUUID,
    onFinish: () => {
      mutate('/api/history');
    },
    onError: (error) => {
      toast.error('An error occured, please try again!');
    },
  });

  const { data: votes } = useSWR<Array<Vote>>(
    `/api/vote?chatId=${id}`,
    fetcher,
  );

  const [attachments, setAttachments] = useState<Array<Attachment>>([]);
  const isArtifactVisible = useArtifactSelector((state) => state.isVisible);

  const handleSystemPromptSelect = useCallback((newSystemPrompt: string) => {
    setSelectedSystemPrompt(newSystemPrompt || SYSTEM_PROMPT_DEFAULT);
  }, []);

  const handleSuggestion = useCallback(async (suggestion: string) => {
    await append(
      {
        role: 'user',
        content: suggestion,
      },
      {
        body: { systemPrompt: selectedSystemPrompt },
        data,
      }
    );
    setInput('');
  }, [append, setInput, selectedSystemPrompt, data]);

  const showPromptSystem = useMemo(() => messages.length === 0 && !isLoading, [messages.length, isLoading]);

  return (
    <>
      <div className="flex flex-col min-w-0 w-full h-dvh bg-background overflow-hidden">
        <ChatHeader
          chatId={id}
          selectedModelId={selectedChatModel}
          selectedVisibilityType={selectedVisibilityType}
          isReadonly={isReadonly}
        />

        {showPromptSystem && (
          <div className="px-2 sm:px-4 pb-2 sm:pb-4 md:pb-6">
            <PromptSystem
              onSelectSystemPrompt={handleSystemPromptSelect}
              onSuggestion={handleSuggestion}
              value={input}
              systemPrompt={selectedSystemPrompt}
            />
          </div>
        )}

        <Messages
          chatId={id}
          isLoading={isLoading}
          votes={votes}
          messages={messages}
          setMessages={setMessages}
          reload={reload}
          isReadonly={isReadonly}
          isArtifactVisible={isArtifactVisible}
        />

        <div className="flex mx-auto px-2 sm:px-4 bg-background pb-2 sm:pb-4 md:pb-6 gap-2 w-full md:max-w-3xl bottom-nav">
          {!isReadonly && (
            <MultimodalInput
              chatId={id}
              input={input}
              setInput={setInput}
              handleSubmit={(e, chatRequestOptions) => {
                handleSubmit(e, {
                  ...chatRequestOptions,
                  body: { ...chatRequestOptions?.body, systemPrompt: selectedSystemPrompt },
                  data,
                });
              }}
              isLoading={isLoading}
              stop={stop}
              attachments={attachments}
              setAttachments={setAttachments}
              messages={messages}
              setMessages={setMessages}
              append={(message, chatRequestOptions) => {
                return append(message, {
                  ...chatRequestOptions,
                  body: { ...chatRequestOptions?.body, systemPrompt: selectedSystemPrompt },
                  data,
                });
              }}
              className="w-full"
            />
          )}
        </div>
      </div>

      <Artifact
        chatId={id}
        input={input}
        setInput={setInput}
        handleSubmit={(e, chatRequestOptions) => {
          handleSubmit(e, {
            ...chatRequestOptions,
            body: { ...chatRequestOptions?.body, systemPrompt: selectedSystemPrompt },
            data,
          });
        }}
        isLoading={isLoading}
        stop={stop}
        attachments={attachments}
        setAttachments={setAttachments}
        append={(message, chatRequestOptions) => {
          return append(message, {
            ...chatRequestOptions,
            body: { ...chatRequestOptions?.body, systemPrompt: selectedSystemPrompt },
            data,
          });
        }}
        messages={messages}
        setMessages={setMessages}
        reload={reload}
        votes={votes}
        isReadonly={isReadonly}
      />
    </>
  );
}
