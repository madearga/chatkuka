Okay, let's integrate the `Conversation` component structure from the Zola inspiration codebase into your `madearga-chatkuka` project. This will involve replacing your existing `Messages` component and adapting the individual message rendering.

Here's the plan:

1.  **Copy Necessary Components:** We'll copy `Conversation`, `Message`, `MessageAssistant`, `MessageUser`, `ChatContainer`, `ScrollButton`, and `Loader` from the Zola codebase into your project structure.
2.  **Adapt `components/chat.tsx`:** Replace the usage of your `Messages` component with the new `Conversation` component and provide the necessary props.
3.  **Adapt Message Rendering:** Modify the new `components/chat/message.tsx`, `message-assistant.tsx`, and `message-user.tsx` files to incorporate the features from your existing `components/message.tsx` (like tool calls, reasoning, voting, attachments from DB).
4.  **Update Imports & Dependencies:** Ensure all imports point to the correct locations within your project and use your existing UI components (`Button`, `Tooltip`, etc.).

---

**Step 1: Copy Files**

Copy the following files from the **Zola inspiration codebase** into your `madearga-chatkuka/components/` directory (create subdirectories as needed):

*   `app/components/chat/conversation.tsx` -> `components/chat/conversation.tsx`
*   `app/components/chat/message.tsx` -> `components/chat/message.tsx` (This will **overwrite** your existing `message.tsx`. Make a backup if needed!)
*   `app/components/chat/message-assistant.tsx` -> `components/chat/message-assistant.tsx`
*   `app/components/chat/message-user.tsx` -> `components/chat/message-user.tsx`
*   `components/prompt-kit/chat-container.tsx` -> `components/prompt-kit/chat-container.tsx` (Create `prompt-kit` folder)
*   `components/motion-primitives/scroll-button.tsx` -> `components/motion-primitives/scroll-button.tsx` (Create `motion-primitives` folder)
*   `components/prompt-kit/loader.tsx` -> `components/prompt-kit/loader.tsx`

*Self-Correction:* We need to be careful overwriting `message.tsx`. We'll merge the logic later.

---

**Step 2: Adapt `components/chat.tsx`**

Replace the `Messages` component usage with `Conversation`.

```tsx
// @/components/chat.tsx
"use client";

import type { Attachment, ChatRequestOptions, CreateMessage, Message } from "ai";
import { useChat } from "ai/react";
import { useState, useCallback, useMemo } from "react";
import useSWR, { useSWRConfig } from "swr";

import { ChatHeader } from "@/components/chat-header";
import type { Vote } from "@/lib/db/schema";
import { fetcher, generateUUID } from "@/lib/utils";

import { Artifact } from "./artifact";
import { MultimodalInput } from "./multimodal-input";
// import { Messages } from './messages'; // Remove old import
import { VisibilityType } from "./visibility-selector";
import { useArtifactSelector } from "@/hooks/use-artifact";
import { toast } from "sonner";
import { SYSTEM_PROMPT_DEFAULT } from "@/lib/ai/config";
import { PromptSystem } from "@/components/chat-input/prompt-system";
import { Overview } from "./overview"; // Keep Overview for empty state

// Import the new Conversation component
import { Conversation } from "@/components/chat/conversation";

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
  const [selectedSystemPrompt, setSelectedSystemPrompt] = useState<
    string | undefined
  >(SYSTEM_PROMPT_DEFAULT);

  const {
    messages,
    setMessages,
    handleSubmit,
    input,
    setInput,
    append,
    isLoading, // Keep isLoading
    stop,
    reload,
    data,
  } = useChat({
    id,
    body: {
      id,
      selectedChatModel: selectedChatModel,
      systemPrompt: selectedSystemPrompt,
    },
    initialMessages,
    experimental_throttle: 100,
    sendExtraMessageFields: true,
    generateId: generateUUID,
    onFinish: () => {
      mutate("/api/history");
    },
    onError: (error) => {
      toast.error("An error occured, please try again!");
    },
  });

  const { data: votes } = useSWR<Array<Vote>>(
    `/api/vote?chatId=${id}`,
    fetcher
  );

  const [attachments, setAttachments] = useState<Array<Attachment>>([]);
  const isArtifactVisible = useArtifactSelector((state) => state.isVisible);

  const handleSystemPromptSelect = useCallback((newSystemPrompt: string) => {
    setSelectedSystemPrompt(newSystemPrompt || SYSTEM_PROMPT_DEFAULT);
  }, []);

  const handleSuggestion = useCallback(
    async (suggestion: string) => {
      await append(
        {
          role: "user",
          content: suggestion,
        },
        {
          body: { systemPrompt: selectedSystemPrompt },
          data: data,
        }
      );
      setInput("");
    },
    [append, setInput, selectedSystemPrompt, data]
  );

  // --- Handlers needed for Conversation ---
  const handleDelete = useCallback(
    (messageId: string) => {
      setMessages(messages.filter((message) => message.id !== messageId));
      // TODO: Add API call to delete message from DB if needed
      toast.info("Message deleted (locally)");
    },
    [messages, setMessages]
  );

  const handleEdit = useCallback(
    async (messageId: string, newText: string) => {
      // Find the index of the message to edit
      const messageIndex = messages.findIndex((m) => m.id === messageId);
      if (messageIndex === -1) return;

      // Create the updated message list up to the edited message
      const updatedMessages = messages
        .slice(0, messageIndex)
        .concat([{ ...messages[messageIndex], content: newText }]);

      // Update local state optimistically
      setMessages(updatedMessages);

      // Call reload with the modified message list
      try {
        await reload({ messages: updatedMessages });
        toast.success("Message edited and regenerated.");
      } catch (error) {
        toast.error("Failed to regenerate after edit.");
        // Optionally revert the change or handle error
        setMessages(messages); // Revert back
      }
    },
    [messages, setMessages, reload]
  );

  // Map isLoading to Conversation's status prop
  const conversationStatus = useMemo(() => {
    if (!isLoading) return "ready";
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === "user") return "submitted";
    if (lastMessage?.role === "assistant") return "streaming"; // Or adjust based on exact AI SDK status if available
    return "submitted"; // Default loading state
  }, [isLoading, messages]);
  // -----------------------------------------

  const showPromptSystem = useMemo(
    () => messages.length === 0 && !isLoading,
    [messages.length, isLoading]
  );

  return (
    <>
      <div className="flex flex-col min-w-0 w-full h-dvh bg-background overflow-hidden">
        <ChatHeader
          chatId={id}
          selectedModelId={selectedChatModel}
          selectedVisibilityType={selectedVisibilityType}
          isReadonly={isReadonly}
        />

        <div className="flex-1 overflow-y-hidden relative"> {/* Let Conversation handle scroll */}
          {messages.length === 0 && !isLoading ? (
            <div className="flex flex-col items-center justify-center h-full p-4">
              <Overview /> {/* Keep Overview for empty state */}
              <div className="w-full max-w-2xl mx-auto mt-8">
                <PromptSystem
                  onSelectSystemPrompt={handleSystemPromptSelect}
                  onSuggestion={handleSuggestion}
                  value={input}
                  systemPrompt={selectedSystemPrompt}
                />
              </div>
            </div>
          ) : (
            // Use the new Conversation component
            <Conversation
              messages={messages}
              status={conversationStatus}
              onDelete={handleDelete}
              onEdit={handleEdit}
              onReload={reload} // Pass reload directly
            />
          )}
        </div>

        <div className="w-full max-w-2xl mx-auto px-2 sm:px-4 pb-2 sm:pb-4 md:pb-6 bottom-nav">
          {!isReadonly && (
            <MultimodalInput
              chatId={id}
              input={input}
              setInput={setInput}
              handleSubmit={(e, chatRequestOptions) => {
                handleSubmit(e, {
                  ...chatRequestOptions,
                  body: {
                    ...chatRequestOptions?.body,
                    systemPrompt: selectedSystemPrompt,
                  },
                  data: data,
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
                  body: {
                    ...chatRequestOptions?.body,
                    systemPrompt: selectedSystemPrompt,
                  },
                  data: data,
                });
              }}
              className="w-full"
            />
          )}
        </div>
      </div>

      {/* Artifact remains the same */}
      <Artifact
        chatId={id}
        input={input}
        setInput={setInput}
        handleSubmit={(e, chatRequestOptions) => {
          handleSubmit(e, {
            ...chatRequestOptions,
            body: {
              ...chatRequestOptions?.body,
              systemPrompt: selectedSystemPrompt,
            },
            data: data,
          });
        }}
        isLoading={isLoading}
        stop={stop}
        attachments={attachments}
        setAttachments={setAttachments}
        append={(message, chatRequestOptions) => {
          return append(message, {
            ...chatRequestOptions,
            body: {
              ...chatRequestOptions?.body,
              systemPrompt: selectedSystemPrompt,
            },
            data: data,
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
```

---

**Step 3 & 4: Adapt Message Rendering & Imports**

Now, the most involved part: merging your specific message rendering logic into the Zola message components and fixing imports.

1.  **`components/chat/message.tsx` (Copied from Zola):**
    *   This file should now be relatively simple, acting as a dispatcher based on `variant` (role).
    *   **Add `vote` prop:** It needs to receive the `vote` prop from `Conversation` and pass it down to `MessageAssistant`.
    *   **Add `isReadonly` prop:** Pass this down to `MessageAssistant` and `MessageUser`.
    *   **Add `chatId` prop:** Pass this down for voting actions.

    ```typescript
    // @/components/chat/message.tsx (Adapted from Zola)
    import { Message as MessageType } from "@ai-sdk/react";
    import React, { useState } from "react";
    import { MessageAssistant } from "./message-assistant";
    import { MessageUser } from "./message-user";
    import type { Vote } from '@/lib/db/schema'; // Import Vote type

    type MessageProps = {
      chatId: string; // Added
      variant: MessageType["role"];
      children: string;
      id: string;
      attachments?: MessageType["experimental_attachments"];
      attachmentUrl?: string | null; // Added from your ExtendedMessage
      isLast?: boolean;
      onDelete: (id: string) => void;
      onEdit: (id: string, newText: string) => void;
      onReload: () => void;
      hasScrollAnchor?: boolean;
      vote?: Vote; // Added
      isReadonly: boolean; // Added
      reasoning?: string; // Added
      toolInvocations?: MessageType['toolInvocations']; // Added
    };

    export function Message({
      chatId, // Added
      variant,
      children,
      id,
      attachments,
      attachmentUrl, // Added
      isLast,
      onDelete,
      onEdit,
      onReload,
      hasScrollAnchor,
      vote, // Added
      isReadonly, // Added
      reasoning, // Added
      toolInvocations, // Added
    }: MessageProps) {
      const [copied, setCopied] = useState(false);

      const copyToClipboard = () => {
        if (typeof children === 'string') {
           navigator.clipboard.writeText(children);
           setCopied(true);
           setTimeout(() => setCopied(false), 1500); // Longer timeout for visibility
        }
      };

      if (variant === "user") {
        return (
          <MessageUser
            id={id}
            copied={copied}
            copyToClipboard={copyToClipboard}
            onReload={onReload}
            onEdit={onEdit}
            onDelete={onDelete}
            hasScrollAnchor={hasScrollAnchor}
            attachments={attachments}
            attachmentUrl={attachmentUrl} // Pass down
            isReadonly={isReadonly} // Pass down
          >
            {children}
          </MessageUser>
        );
      }

      if (variant === "assistant") {
        return (
          <MessageAssistant
            chatId={chatId} // Pass down
            id={id} // Pass down message ID
            copied={copied}
            copyToClipboard={copyToClipboard}
            onReload={onReload}
            isLast={isLast}
            hasScrollAnchor={hasScrollAnchor}
            vote={vote} // Pass down
            isReadonly={isReadonly} // Pass down
            reasoning={reasoning} // Pass down
            toolInvocations={toolInvocations} // Pass down
            attachments={attachments} // Pass down experimental attachments if needed by assistant
            attachmentUrl={attachmentUrl} // Pass down db attachment URL
          >
            {children}
          </MessageAssistant>
        );
      }

      return null;
    }
    ```

2.  **`components/chat/message-assistant.tsx` (Copied from Zola):**
    *   **Update Imports:** Change imports for UI components (`Button`, `Tooltip`, etc.) to use `@/components/ui/...`.
    *   **Add Props:** Add `chatId`, `id`, `vote`, `isReadonly`, `reasoning`, `toolInvocations`, `attachmentUrl`.
    *   **Merge Rendering Logic:** Integrate the rendering for `reasoning`, `toolInvocations`, `attachmentUrl`, search results, document previews, etc., from your *old* `PreviewMessage` into the `return` statement here.
    *   **Integrate Voting:** Add the voting buttons and logic using the `vote` and `chatId` props (adapt from your `MessageActions`).

    ```typescript
    // @/components/chat/message-assistant.tsx (Adapted from Zola)
    "use client";

    import {
        ArrowClockwise,
        Check,
        Copy,
        // Replace Phosphor icons with lucide-react or your icons
        ThumbsUp,
        ThumbsDown,
        Pencil,
        SparklesIcon
    } from "lucide-react";
    import { Message as MessageType } from '@ai-sdk/react';
    import { motion } from 'framer-motion';

    import { Button } from "@/components/ui/button"; // Use your Button
    import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"; // Use your Tooltip
    import { cn } from "@/lib/utils";
    import { Markdown } from "@/components/markdown"; // Use your Markdown
    import { MessageReasoning } from "@/components/message-reasoning"; // Import from your project
    import { SearchResults } from "@/components/search-results"; // Import from your project
    import { DocumentToolCall, DocumentToolResult } from "@/components/document"; // Import from your project
    import { Weather } from "@/components/weather"; // Import from your project
    import { PreviewAttachment } from "@/components/preview-attachment"; // Import from your project
    import { MessageActions as VotingActions } from "@/components/message-actions"; // Rename import to avoid conflict
    import type { Vote } from '@/lib/db/schema';
    import { useMemo } from "react";
    import { SearchStatus, SearchProgress } from "@/components/search-progress"; // Import SearchProgress

    // Define SearchData interface locally or import if defined elsewhere
    interface SearchData {
        type: 'search-status' | 'search-results';
        status: SearchStatus;
        query: string;
        error?: string;
        results?: any[];
        answer?: string;
        images?: any[];
        responseTime?: number;
    }

    type MessageAssistantProps = {
        chatId: string;
        id: string; // Message ID
        children: string; // Main content
        isLast?: boolean;
        hasScrollAnchor?: boolean;
        copied?: boolean;
        copyToClipboard?: () => void;
        onReload?: () => void;
        vote?: Vote;
        isReadonly: boolean;
        reasoning?: string;
        toolInvocations?: MessageType['toolInvocations'];
        attachments?: MessageType['experimental_attachments'];
        attachmentUrl?: string | null;
    };

    export function MessageAssistant({
        chatId,
        id,
        children,
        isLast,
        hasScrollAnchor,
        copied,
        copyToClipboard,
        onReload,
        vote,
        isReadonly,
        reasoning,
        toolInvocations,
        attachments, // experimental_attachments from Zola
        attachmentUrl // attachmentUrl from your DB
    }: MessageAssistantProps) {

        // Parse search data (similar to your old PreviewMessage)
        const searchData = useMemo(() => {
           try {
             if (typeof children === 'string' && children.startsWith('{') && children.endsWith('}')) {
               const parsed = JSON.parse(children);
               if (parsed.type === 'search-status' || parsed.type === 'search-results') {
                 return parsed as SearchData;
               }
             }
             // Check tool invocations as well if search is a tool
            if (toolInvocations?.some(t => t.toolName === 'search')) {
                // Add logic here if search results come via tool invocation
            }
           } catch (e) { /* ignore parsing errors */ }
           return null;
         }, [children, toolInvocations]);

        return (
            <motion.div
                className={cn(
                    "group flex w-full max-w-3xl flex-col items-start gap-2 px-0 sm:px-6", // Adjusted padding for mobile
                    hasScrollAnchor && "min-h-[60px]", // Simplified scroll anchor
                    isLast && "pb-8" // Add padding to last message
                )}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
            >
                 <div className="flex gap-3 sm:gap-4 w-full"> {/* Added wrapper for icon + content */}
                     <div className="size-8 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border bg-background mt-1">
                         <div className="translate-y-px">
                           <SparklesIcon size={14} />
                         </div>
                     </div>

                     <div className="flex flex-col gap-3 w-full overflow-hidden"> {/* Content container */}
                         {/* --- Render Content from madearga-chatkuka --- */}
                         {reasoning && (
                             <MessageReasoning
                                 isLoading={false} // Assuming reasoning is only shown when not loading
                                 reasoning={reasoning}
                             />
                         )}

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

                         {/* Render main text content if not search data */}
                         {(typeof children === 'string' && !searchData && children.trim() !== '') && (
                            <div className="prose prose-zinc dark:prose-invert max-w-none text-sm markdown-content text-foreground/90">
                                <Markdown>{children}</Markdown>
                            </div>
                         )}

                         {toolInvocations && toolInvocations.length > 0 && (
                             <div className="flex flex-col gap-4 mt-2">
                                 {toolInvocations.map((toolInvocation) => {
                                     const { toolName, state, args, result } = toolInvocation;
                                     // ... (Keep your existing tool rendering logic here) ...
                                      if (state === 'result') {
                                           return (
                                             <div key={toolInvocation.toolCallId}>
                                               {toolName === 'getWeather' ? (
                                                 <Weather weatherAtLocation={result} />
                                               ) : toolName === 'createDocument' ? (
                                                 <DocumentPreview isReadonly={isReadonly} result={result} />
                                               ) : toolName === 'updateDocument' ? (
                                                 <DocumentToolResult type="update" result={result} isReadonly={isReadonly} />
                                               ) : toolName === 'requestSuggestions' ? (
                                                 <DocumentToolResult type="request-suggestions" result={result} isReadonly={isReadonly} />
                                               ) : toolName === 'search' ? (
                                                 null // Already handled by searchData logic
                                               ) : (
                                                 <pre>{JSON.stringify(result, null, 2)}</pre>
                                               )}
                                             </div>
                                           );
                                         }
                                     return (
                                         <div key={toolInvocation.toolCallId} className={cn({'skeleton': toolName === 'getWeather' || toolName === 'search'})}>
                                             {toolName === 'getWeather' ? (
                                                 <Weather />
                                             ) : toolName === 'createDocument' ? (
                                                 <DocumentPreview isReadonly={isReadonly} args={args} />
                                             ) : toolName === 'updateDocument' ? (
                                                 <DocumentToolCall type="update" args={args} isReadonly={isReadonly} />
                                             ) : toolName === 'requestSuggestions' ? (
                                                 <DocumentToolCall type="request-suggestions" args={args} isReadonly={isReadonly} />
                                             ) : toolName === 'search' ? (
                                                  null // Already handled by searchData logic
                                             ) : null}
                                         </div>
                                      );
                                 })}
                             </div>
                         )}
                         {/* --- End Render Content from madearga-chatkuka --- */}

                         {/* Actions (Copy, Reload, Vote) */}
                         {!isReadonly && (typeof children === 'string' && children.trim() !== '') && (
                             <div className={cn("flex gap-2 mt-1 opacity-0 transition-opacity group-hover/message:opacity-100")}>
                                 <TooltipProvider delayDuration={0}>
                                     {/* Copy Button */}
                                     <Tooltip>
                                         <TooltipTrigger asChild>
                                             <Button
                                                 variant="ghost"
                                                 size="icon"
                                                 className="h-6 w-6 text-muted-foreground"
                                                 onClick={copyToClipboard}
                                                 type="button"
                                             >
                                                 {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                                             </Button>
                                         </TooltipTrigger>
                                         <TooltipContent>{copied ? "Copied!" : "Copy text"}</TooltipContent>
                                     </Tooltip>

                                     {/* Reload Button */}
                                     {onReload && (
                                          <Tooltip>
                                              <TooltipTrigger asChild>
                                                  <Button
                                                      variant="ghost"
                                                      size="icon"
                                                      className="h-6 w-6 text-muted-foreground"
                                                      onClick={onReload}
                                                      type="button"
                                                  >
                                                      <ArrowClockwise className="size-4" />
                                                  </Button>
                                              </TooltipTrigger>
                                              <TooltipContent>Regenerate</TooltipContent>
                                          </Tooltip>
                                     )}

                                     {/* Voting Buttons */}
                                     <VotingActions
                                         chatId={chatId}
                                         message={{ id, role: 'assistant', content: children /* Pass necessary fields */}}
                                         vote={vote}
                                         isLoading={false} // Voting is independent of main loading
                                     />
                                 </TooltipProvider>
                             </div>
                         )}
                     </div>
                 </div>
            </motion.div>
        );
    }
    ```

3.  **`components/chat/message-user.tsx` (Copied from Zola):**
    *   **Update Imports:** Change imports for UI components (`Button`, `Tooltip`, etc.).
    *   **Add Props:** Add `attachmentUrl`, `isReadonly`.
    *   **Merge Rendering Logic:** Add logic to display `attachmentUrl` similar to how `experimental_attachments` are handled. Use your `PreviewAttachment` or adapt Zola's `MorphingDialog`.
    *   **Adapt Edit:** Keep the edit logic but ensure it uses your `Button` and `Textarea`. Disable edit button if `isReadonly`.

    ```typescript
    // @/components/chat/message-user.tsx (Adapted from Zola)
    "use client";

    import React, { useRef, useState } from "react";
    import { Message as MessageType } from "@ai-sdk/react";
    import { Check, Copy, Pencil, Trash } from "lucide-react"; // Use Lucide

    import { Button } from "@/components/ui/button"; // Use your Button
    import { Textarea } from "@/components/ui/textarea"; // Use your Textarea
    import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"; // Use your Tooltip
    import { cn } from "@/lib/utils";
    import { PreviewAttachment } from "@/components/preview-attachment"; // Use your attachment preview

    export type MessageUserProps = {
        id: string;
        children: string; // Main content
        copied?: boolean;
        copyToClipboard?: () => void;
        onEdit: (id: string, newText: string) => void;
        onDelete: (id: string) => void;
        onReload: () => void; // Keep for potential future use
        hasScrollAnchor?: boolean;
        attachments?: MessageType["experimental_attachments"];
        attachmentUrl?: string | null; // Add attachmentUrl
        isReadonly: boolean; // Added
    };

    export function MessageUser({
        id,
        children,
        copied,
        copyToClipboard,
        onEdit,
        onDelete,
        onReload, // Keep prop
        hasScrollAnchor,
        attachments,
        attachmentUrl, // Added
        isReadonly, // Added
    }: MessageUserProps) {
        const [editInput, setEditInput] = useState(children);
        const [isEditing, setIsEditing] = useState(false);
        const contentRef = useRef<HTMLDivElement>(null);

        const handleEditCancel = () => {
            setIsEditing(false);
            setEditInput(children);
        };

        const handleSave = () => {
            if (onEdit) {
                onEdit(id, editInput); // Call onEdit which handles reload via chat.tsx
            }
            setIsEditing(false);
        };

        const handleDeleteClick = () => {
            onDelete(id);
        };

        return (
            <div
                className={cn(
                    "group flex w-full max-w-2xl flex-col items-end gap-2 px-0 sm:px-6", // Adjusted padding
                    hasScrollAnchor && "min-h-[60px]" // Simplified scroll anchor
                )}
            >
                 {/* --- Render Attachments --- */}
                 {attachments?.map((attachment, index) => (
                     <PreviewAttachment key={`${id}-exp-${index}`} attachment={attachment} />
                 ))}
                 {attachmentUrl && (
                    <PreviewAttachment key={`${id}-db`} attachment={{ url: attachmentUrl, name: attachmentUrl.split('/').pop() || 'file', contentType: '' }} />
                 )}
                 {/* --- End Render Attachments --- */}

                {/* Content or Edit Textarea */}
                 {isEditing ? (
                     <div
                         className="bg-primary/10 relative flex w-full flex-col gap-2 rounded-xl px-3 py-2"
                         // Attempt to match width - might need adjustments
                         style={{ minWidth: contentRef.current?.offsetWidth ? `${contentRef.current.offsetWidth}px` : 'auto' }}
                     >
                         <Textarea
                             className="w-full resize-none bg-transparent outline-none border-none focus-visible:ring-0 focus-visible:ring-offset-0 p-0 text-sm sm:text-base"
                             value={editInput}
                             onChange={(e) => setEditInput(e.target.value)}
                             onKeyDown={(e) => {
                                 if (e.key === "Enter" && !e.shiftKey) {
                                     e.preventDefault();
                                     handleSave();
                                 }
                                 if (e.key === "Escape") {
                                     handleEditCancel();
                                 }
                             }}
                             autoFocus
                         />
                         <div className="flex justify-end gap-2">
                             <Button size="sm" variant="ghost" onClick={handleEditCancel}>Cancel</Button>
                             <Button size="sm" onClick={handleSave}>Save & Regenerate</Button>
                         </div>
                     </div>
                 ) : (
                    // Use div for non-editing state to avoid prose styles
                     <div
                         ref={contentRef}
                         className="bg-primary text-primary-foreground px-3 py-2 rounded-xl text-sm sm:text-base break-words"
                     >
                         {children}
                     </div>
                 )}

                {/* Actions */}
                {!isEditing && (
                    <div className="flex gap-1 mt-1 opacity-0 transition-opacity group-hover:opacity-100">
                         <TooltipProvider delayDuration={0}>
                            {/* Copy Button */}
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 text-muted-foreground"
                                        onClick={copyToClipboard}
                                        type="button"
                                    >
                                         {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>{copied ? "Copied!" : "Copy text"}</TooltipContent>
                            </Tooltip>

                            {/* Edit Button */}
                            {!isReadonly && (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 text-muted-foreground"
                                            onClick={() => setIsEditing(true)}
                                            type="button"
                                            disabled={isEditing}
                                        >
                                            <Pencil className="size-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Edit</TooltipContent>
                                </Tooltip>
                            )}

                            {/* Delete Button */}
                            {!isReadonly && (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 text-destructive/80 hover:text-destructive"
                                            onClick={handleDeleteClick}
                                            type="button"
                                        >
                                            <Trash className="size-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Delete</TooltipContent>
                                </Tooltip>
                             )}
                        </TooltipProvider>
                    </div>
                )}
            </div>
        );
    }
    ```

4.  **Update Imports in Copied Files:**
    *   Go through `conversation.tsx`, `message.tsx`, `message-assistant.tsx`, `message-user.tsx`, `chat-container.tsx`, `scroll-button.tsx`, `loader.tsx`.
    *   Change imports like `import { Button } from "@/components/ui/button"` to use your actual path (`@/components/ui/button`).
    *   Update paths for other components (`Markdown`, `Loader`, etc.) based on where you placed them.
    *   Replace Phosphor icons with `lucide-react` or your `components/icons`.

5.  **Review Dependencies:**
    *   Ensure you have `framer-motion` installed (`pnpm add framer-motion`).
    *   The Zola `ChatContainer` uses a custom scroll hook (`useAutoScroll`). You might need to adapt this or replace it with your existing `use-scroll-to-bottom` logic if preferred. The copied `conversation.tsx` already uses `ChatContainer`, so ensure `ChatContainer` itself works or adapt `conversation.tsx` to use your scroll container/hook. The provided `conversation.tsx` uses refs (`containerRef`, `scrollRef`) which should integrate with the Zola `ChatContainer`.

---

**Explanation of Key Changes:**

*   **`chat.tsx`:** Now imports and renders `<Conversation />` instead of `<Messages />`. It defines `handleDelete` and `handleEdit` functions using `setMessages` and passes them along with `reload` and the derived `conversationStatus` to `<Conversation />`.
*   **`conversation.tsx`:** Remains largely the same as Zola's, orchestrating the mapping of messages to the `<Message />` component and handling the scroll container and scroll button.
*   **`message.tsx`:** Acts as a simple router based on `message.role` (now called `variant` to match Zola's prop name) to render either `MessageUser` or `MessageAssistant`. It receives and passes down necessary props like `vote`, `isReadonly`, `chatId`, `reasoning`, `toolInvocations`, `attachmentUrl`.
*   **`message-assistant.tsx`:** Now combines Zola's structure with your logic. It renders reasoning, search results, tool calls, and the main markdown content. It also includes the Copy, Reload, and Voting buttons.
*   **`message-user.tsx`:** Integrates your attachment rendering (`PreviewAttachment`) and Zola's edit functionality. The Edit button triggers an inline textarea. Saving triggers the `onEdit` prop passed from `chat.tsx`.

After these changes, test thoroughly to ensure messages render correctly, actions work, attachments display, and scrolling behaves as expected. Adjust styling (`cn` classes) as needed to match your theme.