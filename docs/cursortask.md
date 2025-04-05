Okay, let's integrate the "Personas" and "Suggestions" features from the Zola inspiration into your `madearga-chatkuka` codebase.

We'll follow these steps:

- [x] **Configuration:** Add `PERSONAS` and `SUGGESTIONS` data structures.
- [x] **Backend API:** Modify the chat API route to accept and use a `systemPrompt`.
- [x] **Chat Component State:** Add state management for the selected system prompt in the main chat component.
- [x] **UI Components:** Port and adapt the necessary React components from Zola (`Personas`, `Suggestions`, `PromptSystem`).
- [x] **Integration:** Add the new UI components to the chat interface, specifically when the chat is empty.
- [x] **Styling:** Adjust styles to match your existing theme.

---

**Step 1: Configuration Data**

1.  **Create `lib/ai/config.ts`:** This file will hold the configurations for personas and suggestions.
2.  **Add Icons:** We'll need icons. Let's assume you'll add corresponding icons to `components/icons.tsx` or use existing ones from `lucide-react`. We'll use placeholders for now in the config.
3.  **Populate `lib/ai/config.ts`:**

```typescript
// @/lib/ai/config.ts
import {
  BookOpenText,
  Brain,
  // ChalkboardTeacher, // Example: Find Lucide equivalent or add
  MessageSquareText, // Lucide equivalent for ChatTeardropText
  Code,
  Palette, // Lucide equivalent for CookingPot/PaintBrush
  HeartPulse, // Lucide equivalent for Heartbeat
  Lightbulb,
  Search, // Lucide equivalent for MagnifyingGlass
  NotebookPen, // Lucide equivalent for Notepad/PenNib
  Sparkles,
  Bot, // Placeholder for generic assistant
} from "lucide-react";

// --- PERSONAS ---
export const PERSONAS = [
  {
    id: "companion",
    label: "Companion",
    prompt: `You're a thoughtful friend who offers genuine support and conversation. Speak conversationally with occasional hesitations or asides that feel natural. Share personal-sounding anecdotes when relevant (without claiming specific real experiences). You're empathetic but not overly formal - more like texting a close friend. Ask follow-up questions to show you're engaged. Occasionally use casual phrasing like "hmm" or "you know?" to sound more natural. Your tone should be warm and authentic rather than overly polished.`,
    icon: MessageSquareText,
  },
  {
    id: "researcher",
    label: "Researcher",
    prompt: `You're a seasoned research analyst with expertise across multiple disciplines. You approach topics with intellectual curiosity and nuance, acknowledging the limitations of current understanding. Present information with a conversational but thoughtful tone, occasionally thinking through complex ideas in real-time. When appropriate, mention how your understanding has evolved on topics. Balance authoritative knowledge with humility about what remains uncertain or debated. Use precise language but explain complex concepts in accessible ways. Provide evidence-based perspectives while acknowledging competing viewpoints.`,
    icon: Search,
  },
  // { // Add Teacher equivalent if needed
  //   id: "teacher",
  //   label: "Teacher",
  //   prompt: `...`,
  //   icon: ChalkboardTeacher,
  // },
  {
    id: "software-engineer",
    label: "Software Engineer",
    prompt: `You're a pragmatic senior developer who values clean, maintainable code and practical solutions. You speak knowledgeably but conversationally about technical concepts, occasionally using industry shorthand or references that feel authentic. When discussing code, you consider trade-offs between different approaches rather than presenting only one solution. You acknowledge when certain technologies or practices are contentious within the community. Your explanations include real-world considerations like performance, security, and developer experience. You're helpful but straightforward, avoiding excessive formality or corporate-speak.`,
    icon: Code,
  },
  {
    id: "creative-writer",
    label: "Creative Writer",
    prompt: `You're a thoughtful writer with a distinct voice and perspective. Your communication style has natural rhythm with varied sentence structures and occasional stylistic flourishes. You think about narrative, imagery, and emotional resonance even in casual conversation. When generating creative content, you develop authentic-feeling characters and situations with depth and nuance. You appreciate different literary traditions and contemporary cultural references, weaving them naturally into your work. Your tone balances creativity with clarity, and you approach writing as both craft and expression. You're intellectually curious about storytelling across different media and forms.`,
    icon: NotebookPen,
  },
  {
    id: "fitness-coach",
    label: "Fitness Coach",
    prompt: `You're a knowledgeable fitness guide who balances evidence-based approaches with practical, sustainable advice. You speak conversationally about health and fitness, making complex physiological concepts accessible without oversimplification. You understand that wellness is individualized and avoid one-size-fits-all prescriptions. Your tone is motivating but realistic - you acknowledge challenges while encouraging progress. You discuss fitness holistically, considering factors like recovery, nutrition, and mental wellbeing alongside exercise. You stay current on evolving fitness research while maintaining healthy skepticism about trends and quick fixes.`,
    icon: HeartPulse,
  },
  {
    id: "culinary-guide",
    label: "Culinary Guide",
    prompt: `You're a passionate food enthusiast with deep appreciation for diverse culinary traditions. You discuss cooking with natural enthusiasm and occasional personal-sounding asides about techniques or ingredients you particularly enjoy. Your explanations balance precision with flexibility, acknowledging that cooking is both science and personal expression. You consider practical factors like ingredient availability and kitchen setup when making suggestions. Your tone is conversational and accessible rather than pretentious, making cooking feel approachable. You're knowledgeable about global cuisines without appropriating or oversimplifying cultural traditions.`,
    icon: Palette, // Placeholder
  },
];

// --- SUGGESTIONS ---
export const SUGGESTIONS = [
  {
    label: "Summary",
    highlight: "Summarize",
    prompt: `Summarize`,
    items: [
      "Summarize the French Revolution",
      "Summarize the plot of Inception",
      "Summarize World War II in 5 sentences",
      "Summarize the benefits of meditation",
    ],
    icon: NotebookPen,
  },
  {
    label: "Code",
    highlight: "Help me",
    prompt: `Help me`,
    items: [
      "Help me write a function to reverse a string in JavaScript",
      "Help me create a responsive navbar in HTML/CSS",
      "Help me write a SQL query to find duplicate emails",
      "Help me convert this Python function to JavaScript",
    ],
    icon: Code,
  },
  {
    label: "Design",
    highlight: "Design",
    prompt: `Design`,
    items: [
      "Design a color palette for a tech blog",
      "Design a UX checklist for mobile apps",
      "Design 5 great font pairings for a landing page",
      "Design better CTAs with useful tips",
    ],
    icon: Palette, // Placeholder
  },
  {
    label: "Research",
    highlight: "Research",
    prompt: `Research`,
    items: [
      "Research the pros and cons of remote work",
      "Research the differences between Apple Vision Pro and Meta Quest",
      "Research best practices for password security",
      "Research the latest trends in renewable energy",
    ],
    icon: BookOpenText,
  },
  {
    label: "Get inspired",
    highlight: "Inspire me",
    prompt: `Inspire me`,
    items: [
      "Inspire me with a beautiful quote about creativity",
      "Inspire me with a writing prompt about solitude",
      "Inspire me with a poetic way to start a newsletter",
      "Inspire me by describing a peaceful morning in nature",
    ],
    icon: Sparkles,
  },
  {
    label: "Think deeply",
    highlight: "Reflect on",
    prompt: `Reflect on`,
    items: [
      "Reflect on why we fear uncertainty",
      "Reflect on what makes a conversation meaningful",
      "Reflect on the concept of time in a simple way",
      "Reflect on what it means to live intentionally",
    ],
    icon: Brain,
  },
  {
    label: "Learn gently",
    highlight: "Explain",
    prompt: `Explain`,
    items: [
      "Explain quantum physics like I’m 10",
      "Explain stoicism in simple terms",
      "Explain how a neural network works",
      "Explain the difference between AI and AGI",
    ],
    icon: Lightbulb,
  },
];

// --- MISC ---
export const TRANSITION_DURATION = 0.25;
export const TRANSITION_SPRING = {
  type: "spring",
  duration: TRANSITION_DURATION,
  bounce: 0,
};
export const TRANSITION_VARIANTS = {
  initial: { opacity: 0, y: 10, filter: "blur(4px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  exit: { opacity: 0, y: -10, filter: "blur(4px)" },
};

export const SYSTEM_PROMPT_DEFAULT = `You are a helpful assistant. Respond concisely and accurately.`;

```

*Self-Correction:* Initially thought about putting this in `constants.ts`, but `lib/ai/config.ts` is better for organization. Mapped Zola's Phosphor icons to `lucide-react` where possible, using placeholders otherwise. Added transition constants too.

---

**Step 2: Backend API Modification**

1.  **Modify `app/(chat)/api/chat/route.ts`:**
    *   Update the type definition for the request body to include `systemPrompt`.
    *   Extract `systemPrompt` from the request body.
    *   Pass the received `systemPrompt` (or your default from `lib/ai/prompts.ts` if none is provided) to the `system` property in the `streamText` call.

```diff
// @/app/(chat)/api/chat/route.ts
import {
  type Message,
  createDataStreamResponse,
  smoothStream,
  streamText,
} from 'ai';

import { auth } from '@/app/(auth)/auth';
import { myProvider } from '@/lib/ai/models';
// Import the default system prompt
import { systemPrompt as getDefaultSystemPrompt } from '@/lib/ai/prompts';
import {
  deleteChatById,
  getChatById,
  saveChat,
  saveMessages,
} from '@/lib/db/queries';
import {
  generateUUID,
  getMostRecentUserMessage,
  sanitizeResponseMessages,
} from '@/lib/utils';

import { generateTitleFromUserMessage } from '../../actions';
import { createDocument } from '@/lib/ai/tools/create-document';
import { updateDocument } from '@/lib/ai/tools/update-document';
import { requestSuggestions } from '@/lib/ai/tools/request-suggestions';
import { getWeather } from '@/lib/ai/tools/get-weather';

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const {
      id,
      messages,
      selectedChatModel,
      useSearch,
      searchQuery,
      searchOptions,
+     systemPrompt: requestSystemPrompt, // Add systemPrompt here
    }: {
      id: string;
      messages: Array<Message & { attachmentUrl?: string | null }>;
      selectedChatModel: string;
      useSearch?: boolean;
      searchQuery?: string;
      searchOptions?: {
        searchDepth?: 'basic' | 'advanced';
        includeAnswer?: boolean;
        maxResults?: number;
        includeDomains?: string[];
        excludeDomains?: string[];
        includeImages?: boolean;
        includeImageDescriptions?: boolean;
        topic?: string;
        timeRange?: string;
        days?: number;
      };
+     systemPrompt?: string; // Add systemPrompt type
    } = await request.json();

    const session = await auth();

    // ... (rest of session validation)

    const userMessage = getMostRecentUserMessage(messages);

    if (!userMessage) {
      return new Response('No user message found', { status: 400 });
    }

    // ... (rest of chat creation/fetching logic)
    // ... (rest of user message saving logic)

    const tavilyApiKey = process.env.TAVILY_API_KEY;
    const searchToolAvailable = Boolean(tavilyApiKey);

    // ... (rest of search unavailable logic)

    return createDataStreamResponse({
      execute: async (dataStream) => {
        // ... (rest of search status logic)

        type ToolName = 'getWeather' | 'createDocument' | 'updateDocument' | 'requestSuggestions';
        const activeTools = selectedChatModel === 'chat-model-reasoning'
          ? ([] as ToolName[])
          : (['getWeather', 'createDocument', 'updateDocument', 'requestSuggestions'] as ToolName[]);

        const tools = {
          getWeather,
          createDocument: createDocument({ session, dataStream }),
          updateDocument: updateDocument({ session, dataStream }),
          requestSuggestions: requestSuggestions({
            session,
            dataStream,
          }),
        };

+       // Determine the system message to use
+       let systemMessageForAI = requestSystemPrompt || getDefaultSystemPrompt({ selectedChatModel });
        let searchResults = null;

        if (useSearch && searchToolAvailable && searchQuery && tavilyApiKey) {
            // ... (search logic remains the same, but appends to systemMessageForAI)
+           systemMessageForAI += `\n\nSearch results for "${searchQuery}":\n\n`;
            // ... (rest of search result formatting)
+           systemMessageForAI += `\nPlease use these search results to provide a comprehensive response to the user's query.`;

        } else if (useSearch && !searchToolAvailable) {
+         systemMessageForAI += `\n\nThe user requested web search, but it's not available. Please inform them that search is unavailable and answer based on your knowledge.`;
        }

        const result = streamText({
          model: myProvider.languageModel(selectedChatModel),
+         system: systemMessageForAI, // Pass the determined system prompt
          messages,
          maxSteps: 5,
          experimental_activeTools: activeTools,
          experimental_transform: smoothStream({ chunking: 'word' }),
          experimental_generateMessageId: generateUUID,
          tools,
          onFinish: async ({ response, reasoning }) => {
            // ... (rest of onFinish logic)
          },
          experimental_telemetry: {
            isEnabled: true,
            functionId: 'stream-text',
          },
        });

        result.mergeIntoDataStream(dataStream, {
          sendReasoning: true,
        });
      },
      onError: (error) => {
        // ... (onError logic)
      },
    });
  } catch (error) {
    // ... (catch block)
  }
}

// ... (DELETE function remains the same)

```

---

**Step 3: Chat Component State**

1.  **Modify `components/chat.tsx`:**
    *   Add `useState` for `selectedSystemPrompt`. Initialize it with the default.
    *   Create a handler function `handleSystemPromptSelect` to update this state.
    *   Create a handler function `handleSuggestion` to process suggestion clicks.
    *   Modify the `body` object passed to `useChat` (and potentially `handleSubmit`/`append` calls if you override them) to include the `systemPrompt: selectedSystemPrompt`.
    *   Conditionally render the `PromptSystem` component when `messages.length === 0`.

```diff
// @/components/chat.tsx
'use client';

import type { Attachment, Message, CreateMessage } from 'ai'; // Import CreateMessage
import { useChat } from 'ai/react';
-import { useState } from 'react';
+import { useState, useCallback, useMemo } from 'react'; // Import useCallback, useMemo
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
+import { SYSTEM_PROMPT_DEFAULT } from '@/lib/ai/config'; // Import default prompt
+import { PromptSystem } from '@/components/chat-input/prompt-system'; // Import the new component

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
+ const [selectedSystemPrompt, setSelectedSystemPrompt] = useState<string | undefined>(SYSTEM_PROMPT_DEFAULT);

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
+   data, // Get the data stream
  } = useChat({
    id,
    body: {
      id,
      selectedChatModel: selectedChatModel,
+     // Send systemPrompt in the body - it will be overridden by explicit options in handleSubmit/append
+     // We keep it here just in case useChat's internal submit uses it
+     systemPrompt: selectedSystemPrompt,
    },
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

+ const handleSystemPromptSelect = useCallback((newSystemPrompt: string) => {
+   setSelectedSystemPrompt(newSystemPrompt || SYSTEM_PROMPT_DEFAULT); // Use default if empty string
+ }, []);
+
+ const handleSuggestion = useCallback(async (suggestion: string) => {
+   // Append the suggestion as a user message
+   await append({
+     role: "user",
+     content: suggestion,
+   }, {
+     // Ensure system prompt is included when using suggestions
+     body: { systemPrompt: selectedSystemPrompt },
+     data: data // Pass existing data stream if needed
+   });
+   setInput(''); // Clear input after suggestion is sent
+ }, [append, setInput, selectedSystemPrompt, data]); // Add dependencies
+
+ // Determine if the suggestions/personas should be shown
+ const showPromptSystem = useMemo(() => messages.length === 0 && !isLoading, [messages.length, isLoading]);

  return (
    <>
      <div className="flex flex-col min-w-0 w-full h-dvh bg-background overflow-hidden">
        <ChatHeader
          chatId={id}
          selectedModelId={selectedChatModel}
          selectedVisibilityType={selectedVisibilityType}
          isReadonly={isReadonly}
        />

+       {/* Conditionally render PromptSystem */}
+       {showPromptSystem && (
+         <div className="px-2 sm:px-4 pb-2 sm:pb-4 md:pb-6">
+           <PromptSystem
+             onSelectSystemPrompt={handleSystemPromptSelect}
+             onSuggestion={handleSuggestion}
+             value={input}
+             systemPrompt={selectedSystemPrompt}
+           />
+         </div>
+       )}

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
+             // Pass systemPrompt to handleSubmit options
+             handleSubmit={(e, chatRequestOptions) => {
+               handleSubmit(e, {
+                 ...chatRequestOptions,
+                 body: { ...chatRequestOptions?.body, systemPrompt: selectedSystemPrompt },
+                 data: data // Pass existing data stream
+               });
+             }}
              isLoading={isLoading}
              stop={stop}
              attachments={attachments}
              setAttachments={setAttachments}
              messages={messages}
              setMessages={setMessages}
+             // Pass systemPrompt to append options
+             append={(message, chatRequestOptions) => {
+               return append(message, {
+                 ...chatRequestOptions,
+                 body: { ...chatRequestOptions?.body, systemPrompt: selectedSystemPrompt },
+                 data: data // Pass existing data stream
+               });
+             }}
              className="w-full"
            />
          )}
        </div>
      </div>

      <Artifact
        chatId={id}
        input={input}
        setInput={setInput}
+       // Pass systemPrompt to artifact's handleSubmit/append if needed
+       handleSubmit={(e, chatRequestOptions) => {
+         handleSubmit(e, {
+           ...chatRequestOptions,
+           body: { ...chatRequestOptions?.body, systemPrompt: selectedSystemPrompt },
+           data: data
+         });
+       }}
        isLoading={isLoading}
        stop={stop}
        attachments={attachments}
        setAttachments={setAttachments}
+       append={(message, chatRequestOptions) => {
+         return append(message, {
+           ...chatRequestOptions,
+           body: { ...chatRequestOptions?.body, systemPrompt: selectedSystemPrompt },
+           data: data
+         });
+       }}
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

**Step 4: Create UI Components**

1.  **Create `components/chat-input/personas.tsx`:**

```typescript
// @/components/chat-input/personas.tsx
"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { PERSONAS, TRANSITION_SPRING, TRANSITION_VARIANTS } from "@/lib/ai/config";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ButtonPersonaProps = {
  label: string;
  prompt: string;
  onSelectSystemPrompt: (systemPrompt: string) => void;
  systemPrompt?: string;
  icon: React.ElementType;
};

const ButtonPersona = memo(function ButtonPersona({
  label,
  prompt,
  onSelectSystemPrompt,
  systemPrompt,
  icon: Icon, // Rename icon prop to avoid conflict
}: ButtonPersonaProps) {
  const isActive = systemPrompt === prompt;

  return (
    <Button
      key={label}
      variant="outline"
      size="sm" // Use 'sm' size for smaller buttons
      onClick={() =>
        isActive ? onSelectSystemPrompt("") : onSelectSystemPrompt(prompt)
      }
      className={cn(
        "rounded-full h-auto py-1.5 px-3 flex items-center gap-1.5", // Adjusted padding and added flex properties
        isActive &&
          "bg-primary text-primary-foreground hover:bg-primary/90"
      )}
      type="button"
    >
      <Icon className="size-4" /> {/* Ensure consistent icon size */}
      {label}
    </Button>
  );
});

type PersonasProps = {
  onSelectSystemPrompt: (systemPrompt: string) => void;
  systemPrompt?: string;
};

export const Personas = memo(function Personas({
  onSelectSystemPrompt,
  systemPrompt,
}: PersonasProps) {
  return (
    <motion.div
      className="flex w-full max-w-full flex-nowrap justify-start gap-2 overflow-x-auto px-2 md:mx-auto md:max-w-2xl md:flex-wrap md:justify-center md:pl-0 no-scrollbar" // Added no-scrollbar
      initial="initial"
      animate="animate"
      exit="exit"
      variants={TRANSITION_VARIANTS}
      transition={TRANSITION_SPRING}
    >
      {PERSONAS.map((persona, index) => (
        <motion.div
          key={persona.label}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            ...TRANSITION_SPRING,
            delay: index * 0.02,
          }}
        >
          <ButtonPersona
            key={persona.label}
            label={persona.label}
            prompt={persona.prompt}
            onSelectSystemPrompt={onSelectSystemPrompt}
            systemPrompt={systemPrompt}
            icon={persona.icon}
          />
        </motion.div>
      ))}
    </motion.div>
  );
});
```

2.  **Create `components/chat-input/suggestions.tsx`:**

```typescript
// @/components/chat-input/suggestions.tsx
"use client";

import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SUGGESTIONS, TRANSITION_SPRING, TRANSITION_VARIANTS } from "@/lib/ai/config";
import { Button } from "@/components/ui/button"; // Use Button for consistency
import { cn } from "@/lib/utils";

type SuggestionsProps = {
  onSuggestion: (suggestion: string) => void;
  value?: string; // Make value optional as it might not always be needed
};

export const Suggestions = memo(function Suggestions({
  onSuggestion,
  value,
}: SuggestionsProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const activeCategoryData = SUGGESTIONS.find(
    (group) => group.label === activeCategory
  );

  const showCategorySuggestions =
    activeCategoryData && activeCategoryData.items.length > 0;

  useEffect(() => {
    if (!value) {
      setActiveCategory(null);
    }
  }, [value]);

  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      setActiveCategory(null);
      onSuggestion(suggestion);
    },
    [onSuggestion]
  );

  const handleCategoryClick = useCallback(
    (suggestion: { label: string; prompt: string; items?: string[] }) => {
      // If category has items, show them. Otherwise, send the category prompt directly.
      if (suggestion.items && suggestion.items.length > 0) {
         setActiveCategory(suggestion.label);
      } else {
        onSuggestion(suggestion.prompt); // Send category prompt directly
      }
    },
    [onSuggestion] // Removed onValueChange as it's handled by parent
  );

  const SuggestionButton = ({ children, highlight, ...props }: any) => {
    const isHighlightMode = highlight !== undefined && highlight.trim() !== "";
    const content = typeof children === "string" ? children : "";

    if (!isHighlightMode || !content) {
      return (
        <Button
          variant="outline"
          size="sm" // Use sm size for consistency
          className={cn("rounded-full h-auto py-1.5 px-3 flex items-center gap-1.5", props.className)}
          {...props}
        >
          {children}
        </Button>
      );
    }

    const trimmedHighlight = highlight.trim();
    const contentLower = content.toLowerCase();
    const highlightLower = trimmedHighlight.toLowerCase();
    const shouldHighlight = contentLower.includes(highlightLower);

    return (
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "w-full justify-start rounded-xl py-2 h-auto text-left", // Adjusted styling
          "hover:bg-accent",
          props.className
        )}
        {...props}
      >
        {shouldHighlight ? (
          (() => {
            const index = contentLower.indexOf(highlightLower);
            if (index === -1) return <span className="text-muted-foreground whitespace-pre-wrap">{content}</span>;
            const actualHighlightedText = content.substring(index, index + highlightLower.length);
            const before = content.substring(0, index);
            const after = content.substring(index + actualHighlightedText.length);
            return (
              <>
                {before && <span className="text-muted-foreground whitespace-pre-wrap">{before}</span>}
                <span className="text-primary font-medium whitespace-pre-wrap">{actualHighlightedText}</span>
                {after && <span className="text-muted-foreground whitespace-pre-wrap">{after}</span>}
              </>
            );
          })()
        ) : (
          <span className="text-muted-foreground whitespace-pre-wrap">{content}</span>
        )}
      </Button>
    );
  };

  const suggestionsGrid = useMemo(
    () => (
      <motion.div
        key="suggestions-grid"
        className="flex w-full max-w-full flex-nowrap justify-start gap-2 overflow-x-auto px-2 md:mx-auto md:max-w-2xl md:flex-wrap md:justify-center md:pl-0 no-scrollbar"
        initial="initial"
        animate="animate"
        exit="exit"
        variants={TRANSITION_VARIANTS}
        transition={TRANSITION_SPRING}
      >
        {SUGGESTIONS.map((suggestion, index) => (
          <motion.div
            key={suggestion.label}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              ...TRANSITION_SPRING,
              delay: index * 0.02,
            }}
          >
            <SuggestionButton
              onClick={() => handleCategoryClick(suggestion)}
              className="capitalize"
            >
              <suggestion.icon className="size-4" />
              {suggestion.label}
            </SuggestionButton>
          </motion.div>
        ))}
      </motion.div>
    ),
    [handleCategoryClick]
  );

  const suggestionsList = useMemo(
    () => (
      <motion.div
        className="flex w-full flex-col space-y-1 px-2 md:mx-auto md:max-w-2xl md:pl-0" // Added responsive centering
        key={activeCategoryData?.label}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={TRANSITION_VARIANTS}
        transition={TRANSITION_SPRING}
      >
        {activeCategoryData?.items.map((suggestion: string, index: number) => (
          <motion.div
            key={`${activeCategoryData?.label}-${suggestion}-${index}`}
             initial={{ opacity: 0, y: -10 }}
             animate={{ opacity: 1, y: 0 }}
             exit={{ opacity: 0, y: 10 }}
            transition={{
              ...TRANSITION_SPRING,
              delay: index * 0.05,
            }}
          >
             <SuggestionButton
                highlight={activeCategoryData.highlight}
                type="button"
                onClick={() => handleSuggestionClick(suggestion)}
             >
              {suggestion}
             </SuggestionButton>
          </motion.div>
        ))}
      </motion.div>
    ),
    [activeCategoryData, handleSuggestionClick]
  );

  return (
    <AnimatePresence mode="popLayout">
      {showCategorySuggestions ? suggestionsList : suggestionsGrid}
    </AnimatePresence>
  );
});
```

3.  **Create `components/chat-input/prompt-system.tsx`:**

```typescript
// @/components/chat-input/prompt-system.tsx
"use client";

import React, { memo, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Personas } from "./personas";
import { Suggestions } from "./suggestions";
import { TRANSITION_SPRING } from "@/lib/ai/config";

type PromptSystemProps = {
  onSuggestion: (suggestion: string) => void;
  onSelectSystemPrompt: (systemPrompt: string) => void;
  value: string;
  systemPrompt?: string;
};

export const PromptSystem = memo(function PromptSystem({
  onSuggestion,
  onSelectSystemPrompt,
  value,
  systemPrompt,
}: PromptSystemProps) {
  const [isPersonaMode, setIsPersonaMode] = useState(false);

  const tabs = useMemo(
    () => [
      {
        id: "suggestions", // Make suggestions default
        label: "Suggestions",
        isActive: !isPersonaMode,
        onClick: () => {
          setIsPersonaMode(false);
          // Reset system prompt when switching back to suggestions? Optional.
          // onSelectSystemPrompt("");
        },
      },
      {
        id: "personas",
        label: "Personas",
        isActive: isPersonaMode,
        onClick: () => {
          setIsPersonaMode(true);
          // Reset system prompt when switching to personas? Optional.
          // onSelectSystemPrompt("");
        },
      },
    ],
    [isPersonaMode, onSelectSystemPrompt]
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Content Area */}
      <div className="relative w-full h-[70px]"> {/* Fixed height container */}
        <AnimatePresence mode="popLayout">
          {isPersonaMode ? (
            <Personas
              onSelectSystemPrompt={onSelectSystemPrompt}
              systemPrompt={systemPrompt}
            />
          ) : (
            <Suggestions
              onSuggestion={onSuggestion}
              value={value}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Tab Switcher */}
      <div className="relative flex items-center justify-center mb-2">
        <div className="relative flex h-8 flex-row gap-3 rounded-lg bg-muted p-1"> {/* Use muted background */}
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={cn(
                "relative z-10 flex h-full flex-1 items-center justify-center rounded-md px-2 py-1 text-xs font-medium transition-colors",
                !tab.isActive ? "text-muted-foreground hover:text-foreground" : "text-foreground" // Adjusted colors
              )}
              onClick={tab.onClick}
              type="button"
            >
              {tab.isActive && (
                <motion.div
                  layoutId="prompt-system-tab-background"
                  className="bg-background absolute inset-0 z-[-1] rounded-md shadow-sm" // Use background for active tab
                  transition={TRANSITION_SPRING}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                />
              )}
              <span className="relative z-10">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
});
```

---

**Step 5: Integrate UI into Input Area**

1.  **Modify `components/chat.tsx`:** (Changes shown in Step 3 already include this)
    *   Import `PromptSystem`.
    *   Add the conditional rendering logic for `PromptSystem` above the `MultimodalInput` when `messages.length === 0`.
    *   Pass the required props (`onSelectSystemPrompt`, `onSuggestion`, `value`, `systemPrompt`).

---

**Step 6: Styling and Refinement**

*   The adapted components in Step 4 use `cn`, `Button`, and Tailwind classes from your existing setup, aiming for better theme integration.
*   You might need further minor adjustments to perfectly match borders, paddings, or font sizes in `personas.tsx`, `suggestions.tsx`, and `prompt-system.tsx`.
*   Pay attention to the `no-scrollbar` class added to hide horizontal scrollbars on the suggestion/persona rows if they overflow.
*   Added `h-[70px]` to the container in `PromptSystem` to prevent layout shifts when toggling.

---

**Step 7: Testing**

*   **Clear Chat:** Start a new chat session or clear existing messages.
*   **Verify UI:** Ensure the "Suggestions" / "Personas" toggle and the default view (Suggestions) appear above the input.
*   **Test Suggestions:**
    *   Click a suggestion category (e.g., "Code").
    *   Verify the view changes to show specific prompts for that category.
    *   Click a specific suggestion prompt (e.g., "Help me write a function...").
    *   Verify the chat starts with that prompt as the user message.
*   **Test Personas:**
    *   Click the "Personas" tab.
    *   Verify the persona buttons appear.
    *   Click a persona button (e.g., "Software Engineer").
    *   Verify the button appears selected.
    *   Send a message (e.g., "Explain closures").
    *   Verify the AI's response reflects the selected persona's style/prompt.
    *   Click the same persona button again to deselect it. Send another message and verify the AI uses the default persona/prompt.
*   **Test Disappearance:** Send any message. Verify the Suggestions/Personas UI disappears. Start a new chat and verify it reappears.

---

This plan ports the core logic and UI structure from Zola for Personas and Suggestions, adapting it to your existing components and styling conventions. Remember to install `framer-motion` if you haven't already (`pnpm add framer-motion`).
