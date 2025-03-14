<file_map>
/Users/madearga/search/open-deep-research
├── app
│   └── api
│       ├── feedback
│       │   └── route.ts
│       ├── keys
│       │   └── route.ts
│       └── research
│           └── route.ts
├── components
│   └── chat
│       ├── api-key-dialog.tsx
│       ├── chat.tsx
│       ├── download-txt.tsx
│       ├── input.tsx
│       ├── markdown.tsx
│       ├── message.tsx
│       ├── research-progress.tsx
│       └── site-header.tsx
└── lib
    ├── deep-research
    │   ├── ai
    │   │   ├── providers.ts
    │   │   ├── text-splitter.test.ts
    │   │   └── text-splitter.ts
    │   ├── deep-research.ts
    │   ├── feedback.ts
    │   ├── index.ts
    │   └── prompt.ts
    ├── hooks
    │   └── use-scroll-to-bottom.ts
    └── utils.ts

</file_map>

<file_contents>
File: components/chat/api-key-dialog.tsx
```tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import {
  LockIcon,
  KeyIcon,
  Loader2Icon,
  ShieldCheckIcon,
  GithubIcon,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface ApiKeyDialogProps {
  show: boolean;
  onClose: (open: boolean) => void;
  onSuccess: () => void;
}

export function ApiKeyDialog({ show, onClose, onSuccess }: ApiKeyDialogProps) {
  const [openaiKey, setOpenaiKey] = useState("");
  const [firecrawlKey, setFirecrawlKey] = useState("");
  const [loading, setLoading] = useState(false);

  const handleApiKeySubmit = async () => {
    if (!openaiKey || !firecrawlKey) return;
    setLoading(true);
    const res = await fetch("/api/keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ openaiKey, firecrawlKey }),
    });
    if (res.ok) {
      onClose(false);
      onSuccess();
    }
    setLoading(false);
  };

  return (
    <Dialog open={show} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-w-[95%] h-[90vh] sm:h-auto overflow-y-auto bg-white/80 backdrop-blur-xl border border-zinc-200 shadow-2xl p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl mb-2 sm:mb-4 font-bold text-black">
            Open Deep Research
          </DialogTitle>
          <DialogDescription className="text-zinc-600 space-y-3 sm:space-y-4 mt-2 sm:mt-4">
            <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-3 sm:p-4">
              <h3 className="font-semibold text-zinc-900 mb-2 flex items-center text-sm sm:text-base">
                <KeyIcon className="w-4 h-4 mr-2" />
                Secure API Key Setup
              </h3>
              <p className="text-xs text-zinc-600">
                To use Deep Research, you'll need to provide your API keys.
                These keys are stored securely using HTTP-only cookies and are
                never exposed to client-side JavaScript.
              </p>
              <div className="mt-3 flex flex-col space-y-2 text-xs">
                <div className="text-zinc-600">
                  <p>
                    <span className="font-medium">Self-hosting option:</span>{" "}
                    You can clone the repository and host this application on
                    your own infrastructure. This gives you complete control
                    over your data and API key management.
                  </p>
                  <a
                    href="https://github.com/fdarkaou/open-deep-research"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center mt-1 text-zinc-700 hover:text-zinc-900 transition-colors"
                  >
                    View self-hosting instructions
                    <svg
                      className="w-3 h-3 ml-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M14 5l7 7m0 0l-7 7m7-7H3"
                      />
                    </svg>
                  </a>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-4 sm:mt-6">
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 sm:p-4">
                <h4 className="font-medium text-blue-900 flex items-center mb-2 text-sm">
                  <Image
                    src="/providers/openai.webp"
                    alt="OpenAI Logo"
                    width={16}
                    height={16}
                    className="mr-2"
                  />
                  OpenAI API Key
                </h4>
                <p className="text-xs text-blue-700">
                  Powers our advanced language models for research analysis and
                  synthesis.
                  <a
                    href="https://platform.openai.com/api-keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block mt-2 text-blue-600 hover:text-blue-800 underline"
                  >
                    Get your OpenAI key →
                  </a>
                </p>
              </div>

              <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 sm:p-4">
                <h4 className="font-medium text-emerald-900 flex items-center mb-2 text-sm">
                  🔥 FireCrawl API Key
                </h4>
                <p className="text-xs text-emerald-700">
                  Enables real-time web crawling and data gathering
                  capabilities.
                  <a
                    href="https://www.firecrawl.dev/app/api-keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block mt-2 text-emerald-600 hover:text-emerald-800 underline"
                  >
                    Get your FireCrawl key →
                  </a>
                </p>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 sm:space-y-6 py-2 sm:py-4">
          <div className="space-y-3 sm:space-y-4">
            <div>
              <label className="text-sm font-medium text-zinc-700 mb-1 block">
                OpenAI API Key
              </label>
              <div className="relative">
                <Input
                  type="password"
                  value={openaiKey}
                  onChange={(e) => setOpenaiKey(e.target.value)}
                  placeholder="sk-..."
                  className="pr-10 font-mono text-sm bg-white/50 border-zinc-200 focus:border-zinc-400 focus:ring-zinc-400 h-9 sm:h-10"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <LockIcon className="h-4 w-4 text-zinc-400" />
                </div>
              </div>
              <p className="mt-1 text-xs text-zinc-500">
                Starts with 'sk-' and contains about 50 characters
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-zinc-700 mb-1 block">
                FireCrawl API Key
              </label>
              <div className="relative">
                <Input
                  type="password"
                  value={firecrawlKey}
                  onChange={(e) => setFirecrawlKey(e.target.value)}
                  placeholder="fc-..."
                  className="pr-10 font-mono text-sm bg-white/50 border-zinc-200 focus:border-zinc-400 focus:ring-zinc-400 h-9 sm:h-10"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <LockIcon className="h-4 w-4 text-zinc-400" />
                </div>
              </div>
              <p className="mt-1 text-xs text-zinc-500">
                Usually starts with 'fc-' for production keys
              </p>
            </div>
          </div>
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-3 sm:justify-between mt-4">
          <div className="flex items-center text-xs text-zinc-500 justify-center sm:justify-start">
            <ShieldCheckIcon className="w-4 h-4 mr-1 text-zinc-400" />
            Your keys are stored securely
          </div>
          <div className="flex items-center justify-center sm:justify-end space-x-4 text-xs text-zinc-500">
            <a
              href="https://github.com/fdarkaou/open-deep-research"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-zinc-600 hover:text-zinc-900 transition-colors"
            >
              <GithubIcon className="w-4 h-4 mr-1" />
              Get source code
            </a>
          </div>
          <Button
            type="submit"
            onClick={handleApiKeySubmit}
            className="w-full sm:w-auto bg-black text-white hover:bg-zinc-800 transition-all duration-200"
            disabled={!openaiKey || !firecrawlKey || loading}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                Setting up...
              </div>
            ) : (
              "Start Researching"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

```

File: components/chat/chat.tsx
```tsx
"use client";

import { useState, useEffect } from "react";
import { Message } from "ai";
import { motion } from "framer-motion";
import { BrainCircuitIcon, GithubIcon, PanelRightOpen } from "lucide-react";

import { useScrollToBottom } from "@/lib/hooks/use-scroll-to-bottom";

import DownloadTxtButton from "./download-txt";
import { MultimodalInput } from "./input";
import { PreviewMessage, ProgressStep } from "./message";
import { ResearchProgress } from "./research-progress";

export function Chat({
  id,
  initialMessages,
}: {
  id: string;
  initialMessages: Message[];
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState<ProgressStep[]>([]);
  const [containerRef, messagesEndRef] = useScrollToBottom<HTMLDivElement>();

  // New state to store the final report text
  const [finalReport, setFinalReport] = useState<string | null>(null);

  // States for interactive feedback workflow
  const [stage, setStage] = useState<"initial" | "feedback" | "researching">(
    "initial"
  );
  const [initialQuery, setInitialQuery] = useState("");

  // Add state for mobile progress panel visibility
  const [showProgress, setShowProgress] = useState(false);

  // New state to track if we're on mobile (using 768px as breakpoint for md)
  const [isMobile, setIsMobile] = useState<boolean>(false);
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Update the condition to only be true when there are actual research steps
  const hasStartedResearch =
    progress.filter(
      (step) =>
        // Only count non-report steps or initial report steps
        step.type !== "report" ||
        step.content.includes("Generating") ||
        step.content.includes("Synthesizing")
    ).length > 0;

  // Helper function to call the research endpoint
  const sendResearchQuery = async (
    query: string,
    config: { breadth: number; depth: number; modelId: string }
  ) => {
    try {
      setIsLoading(true);
      setProgress([]);
      // Inform the user that research has started
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: "Starting in-depth research based on your inputs...",
        },
      ]);

      const response = await fetch("/api/research", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query,
          breadth: config.breadth,
          depth: config.depth,
          modelId: config.modelId,
        }),
      });

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader available");

      const textDecoder = new TextDecoder();
      let buffer = "";
      const reportParts: string[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += textDecoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() || "";

        for (const part of parts) {
          if (part.startsWith("data: ")) {
            const jsonStr = part.substring(6).trim();
            if (!jsonStr) continue;
            try {
              const event = JSON.parse(jsonStr);
              if (event.type === "progress") {
                if (event.step.type !== "report") {
                  // Check for duplicates before adding this progress step.
                  setProgress((prev) => {
                    if (
                      prev.length > 0 &&
                      prev[prev.length - 1].content === event.step.content
                    ) {
                      return prev;
                    }
                    return [...prev, event.step];
                  });
                }
              } else if (event.type === "result") {
                // Save the final report so we can download it later
                setFinalReport(event.report);
                setMessages((prev) => [
                  ...prev,
                  {
                    id: Date.now().toString(),
                    role: "assistant",
                    content: event.report,
                  },
                ]);
              } else if (event.type === "report_part") {
                reportParts.push(event.content);
              }
            } catch (e) {
              console.error("Error parsing event:", e);
            }
          }
        }
      }

      if (reportParts.length > 0) {
        // In case the report was sent in parts
        const fullReport = reportParts.join("\n");
        setFinalReport(fullReport);
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            role: "assistant",
            content: fullReport,
          },
        ]);
      }
    } catch (error) {
      console.error("Research error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: "Sorry, there was an error conducting the research.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (
    userInput: string,
    config: { breadth: number; depth: number; modelId: string }
  ) => {
    if (!userInput.trim() || isLoading) return;

    // Add user message immediately
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        role: "user",
        content: userInput,
      },
    ]);

    setIsLoading(true);

    if (stage === "initial") {
      // Add thinking message only for initial query
      setMessages((prev) => [
        ...prev,
        {
          id: "thinking",
          role: "assistant",
          content: "Thinking...",
        },
      ]);

      // Handle the user's initial query
      setInitialQuery(userInput);

      try {
        const response = await fetch("/api/feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: userInput,
            numQuestions: 3,
            modelId: config.modelId,
          }),
        });
        const data = await response.json();
        const questions: string[] = data.questions || [];
        setMessages((prev) => {
          const filtered = prev.filter((m) => m.id !== "thinking");
          if (questions.length > 0) {
            const formattedQuestions = questions
              .map((q, index) => `${index + 1}. ${q}`)
              .join("\n\n");
            return [
              ...filtered,
              {
                id: Date.now().toString(),
                role: "assistant",
                content: `Please answer the following follow-up questions to help clarify your research:\n\n${formattedQuestions}`,
              },
            ];
          }
          return filtered;
        });
        setStage("feedback");
      } catch (error) {
        console.error("Feedback generation error:", error);
        setMessages((prev) => [
          ...prev.filter((m) => m.id !== "thinking"),
          {
            id: Date.now().toString(),
            role: "assistant",
            content: "Sorry, there was an error generating feedback questions.",
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    } else if (stage === "feedback") {
      // In feedback stage, combine the initial query and follow-up answers
      const combined = `Initial Query: ${initialQuery}\nFollow-up Answers:\n${userInput}`;
      setStage("researching");
      try {
        await sendResearchQuery(combined, config);
      } finally {
        setIsLoading(false);
        // Reset the stage so further messages will be processed
        setStage("initial");
        // Inform the user that a new research session can be started
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            role: "assistant",
            content:
              "Research session complete. You can now ask another question to begin a new research session.",
          },
        ]);
      }
    }
  };

  return (
    <div className="flex w-full h-full relative">
      {/* Main container with dynamic width */}
      <motion.div
        className={`mx-auto flex flex-col h-full pt-10 ${
          hasStartedResearch ? "md:mr-0" : "md:mx-auto"
        }`}
        initial={{ width: "100%", maxWidth: "800px" }}
        animate={{
          width: !isMobile && hasStartedResearch ? "55%" : "100%",
          maxWidth: !isMobile && hasStartedResearch ? "1000px" : "800px",
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        {/* Messages Container */}
        <div
          ref={containerRef}
          className={`${
            showProgress ? "hidden md:block" : "block"
          } flex-1 overflow-y-auto relative`}
        >
          {/* Welcome Message (if no research started and no messages) */}
          {!hasStartedResearch && messages.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 100,
                  damping: 20,
                }}
                className="relative text-center space-y-4 p-4 md:p-12
                  before:absolute before:inset-0 
                  before:bg-gradient-to-b before:from-primary/[0.03] before:to-primary/[0.01]
                  before:rounded-[32px] before:blur-xl before:-z-10
                  after:absolute after:inset-0 
                  after:bg-gradient-to-br after:from-primary/[0.08] after:via-transparent after:to-primary/[0.03]
                  after:rounded-[32px] after:blur-md after:-z-20"
              >
                <motion.div
                  animate={{
                    y: [-2, 2, -2],
                    rotate: [-1, 1, -1],
                  }}
                  transition={{
                    duration: 5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="relative"
                >
                  <motion.div
                    animate={{
                      scale: [1, 1.05, 1],
                      opacity: [0.8, 1, 0.8],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/30 
                      blur-2xl rounded-full -z-10"
                  />
                  <BrainCircuitIcon className="w-12 h-12 mx-auto text-primary drop-shadow-[0_0_15px_rgba(var(--primary),0.3)]" />
                </motion.div>

                <div className="space-y-2">
                  <motion.h2
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-base md:text-2xl font-semibold bg-clip-text text-transparent 
                      bg-gradient-to-r from-primary via-primary/90 to-primary/80"
                  >
                    Open Deep Research
                  </motion.h2>

                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-xs md:text-base text-muted-foreground/80 max-w-[340px] mx-auto leading-relaxed"
                  >
                    An open source alternative to OpenAI and Gemini's deep
                    research capabilities. Ask any question to generate a
                    comprehensive report.
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="pt-2"
                  >
                    <a
                      href="https://github.com/fdarkaou/open-deep-research"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-2 py-1 md:px-6 md:py-2.5 text-xs md:text-sm font-medium 
                        bg-gradient-to-r from-primary/10 to-primary/5 hover:from-primary/15 hover:to-primary/10
                        text-primary hover:text-primary/90 rounded-full transition-all duration-300
                        shadow-[0_0_0_1px_rgba(var(--primary),0.1)] hover:shadow-[0_0_0_1px_rgba(var(--primary),0.2)]
                        hover:scale-[1.02]"
                    >
                      <GithubIcon className="w-4 h-4 mr-1" />
                      View source code
                    </a>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          )}

          {/* Messages */}
          <div className="p-4 md:p-6 space-y-6">
            {messages.map((message) => (
              <PreviewMessage key={message.id} message={message} />
            ))}
            <div ref={messagesEndRef} className="h-4" />
            {finalReport && (
              <div className="mt-4">
                <DownloadTxtButton reportText={finalReport} />
              </div>
            )}
          </div>
        </div>

        {/* Input - Fixed to bottom */}
        <div className="sticky bottom-0">
          <div className="p-4 md:p-6 mx-auto">
            <MultimodalInput
              onSubmit={handleSubmit}
              isLoading={isLoading}
              placeholder={
                stage === "initial"
                  ? "What would you like to research?"
                  : stage === "feedback"
                  ? "Please provide your answers to the follow-up questions..."
                  : "Research in progress..."
              }
            />
          </div>
        </div>
      </motion.div>

      {/* Research Progress Panel */}
      <motion.div
        className={`
          pt-10 fixed md:relative
          inset-0 md:inset-auto
          bg-background md:bg-transparent
          md:w-[45%]
          ${showProgress ? "flex" : "hidden md:flex"}
          ${hasStartedResearch ? "md:flex" : "md:hidden"}
        `}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
      >
        <ResearchProgress progress={progress} isLoading={isLoading} />
      </motion.div>

      {/* Mobile Toggle Button - Only show when research has started */}
      {hasStartedResearch && (
        <button
          onClick={() => setShowProgress(!showProgress)}
          className={`
            md:hidden
            fixed
            bottom-24
            right-4
            z-50
            p-3
            bg-primary
            text-primary-foreground
            rounded-full
            shadow-lg
            transition-transform
            ${showProgress ? "rotate-180" : ""}
          `}
          aria-label="Toggle research progress"
        >
          <PanelRightOpen className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}

```

File: components/chat/input.tsx
```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import cx from "classnames";
import { motion } from "framer-motion";
import {
  ArrowUpIcon,
  CheckCircleIcon,
  ChevronDown,
  DownloadIcon,
  Settings2,
  XCircleIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  availableModels,
  type AIModelDisplayInfo,
} from "@/lib/deep-research/ai/providers";
import { ApiKeyDialog } from "@/components/chat/api-key-dialog";

interface MultimodalInputProps {
  onSubmit: (
    input: string,
    config: {
      breadth: number;
      depth: number;
      modelId: string;
    }
  ) => void;
  isLoading: boolean;
  placeholder?: string;
  isAuthenticated?: boolean;
  onDownload?: () => void;
  canDownload?: boolean;
}

export function MultimodalInput({
  onSubmit,
  isLoading,
  placeholder = "What would you like to research?",
  onDownload,
  canDownload = false,
}: MultimodalInputProps) {
  const [input, setInput] = useState("");
  const [breadth, setBreadth] = useState(4);
  const [depth, setDepth] = useState(2);
  const [selectedModel, setSelectedModel] = useState<AIModelDisplayInfo>(
    availableModels.find((model) => model.id === "o3-mini") ||
      availableModels[0]
  );
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [showApiKeyPrompt, setShowApiKeyPrompt] = useState(false);
  const [hasKeys, setHasKeys] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Read the feature flag from environment variables.
  const enableApiKeys = process.env.NEXT_PUBLIC_ENABLE_API_KEYS === "true";
  // When API keys are disabled via env flag, always consider keys as present.
  const effectiveHasKeys = enableApiKeys ? hasKeys : true;

  // Check for keys using the consolidated endpoint
  useEffect(() => {
    const checkKeys = async () => {
      const res = await fetch("/api/keys");
      const data = await res.json();
      setHasKeys(data.keysPresent);
      if (!data.keysPresent && enableApiKeys) {
        setShowApiKeyPrompt(true);
      } else {
        setShowApiKeyPrompt(false);
      }
    };
    checkKeys();
  }, [enableApiKeys]);

  // New: Remove API keys handler
  const handleRemoveKeys = async () => {
    if (!window.confirm("Are you sure you want to remove your API keys?"))
      return;
    try {
      const res = await fetch("/api/keys", {
        method: "DELETE",
      });
      if (res.ok) {
        setHasKeys(false);
      }
    } catch (error) {
      console.error("Error removing keys:", error);
    }
  };

  const handleSubmit = () => {
    if (!input.trim() || isLoading) return;
    if (enableApiKeys && !effectiveHasKeys) {
      // Re-open the API key modal if keys are missing
      setShowApiKeyPrompt(true);
      return;
    }
    onSubmit(input, {
      breadth,
      depth,
      modelId: selectedModel.id,
    });
    setInput("");
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "inherit";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const DownloadButton = () => (
    <Button
      variant="outline"
      size="sm"
      onClick={onDownload}
      className="bg-primary/5 hover:bg-primary/10 border-primary/20 hover:border-primary/30 transition-colors"
    >
      <DownloadIcon className="h-4 w-4 mr-1.5" />
      <span className="text-xs font-medium">Download Report</span>
    </Button>
  );

  return (
    <div className="relative w-full flex flex-col gap-4 border-none">
      {/* Conditionally render API key dialog only if enabled */}
      {enableApiKeys && (
        <ApiKeyDialog
          show={showApiKeyPrompt}
          onClose={setShowApiKeyPrompt}
          onSuccess={() => {
            setShowApiKeyPrompt(false);
            setHasKeys(true);
          }}
        />
      )}

      <textarea
        ref={textareaRef}
        placeholder={placeholder}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        className={cx(
          "bg-white min-h-[72px] max-h-[calc(100dvh-200px)] overflow-y-auto text-sm w-full",
          "overflow-hidden resize-none px-4 pb-10 pt-4 rounded-2xl",
          "outline-none focus:outline-none focus:ring-0 border-0"
        )}
        rows={3}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
          }
        }}
      />

      {/* Mobile Controls - Shown in a row above the input */}
      <div className="md:hidden flex flex-wrap gap-2 px-4 py-2 border-t border-border/40 bg-background/80 rounded-xl backdrop-blur-sm">
        {/* API Keys Status */}
        <button
          type="button"
          onClick={
            enableApiKeys
              ? effectiveHasKeys
                ? handleRemoveKeys
                : () => setShowApiKeyPrompt(true)
              : undefined
          }
          className="flex items-center gap-1"
        >
          {enableApiKeys ? (
            effectiveHasKeys ? (
              <>
                <CheckCircleIcon size={16} className="text-green-500" />
                <span className="text-xs text-green-600">
                  API keys configured
                </span>
              </>
            ) : (
              <>
                <XCircleIcon size={16} className="text-red-500" />
                <span className="text-xs text-red-600">API keys missing</span>
              </>
            )
          ) : (
            <span className="text-xs text-green-600">Using .env API keys</span>
          )}
        </button>

        {/* Model Selector with Dropdown */}
        <div className="relative">
          <button
            type="button"
            className="cursor-pointer text-xs inline-flex items-center justify-center font-medium text-muted-foreground hover:text-primary/80 h-7 rounded-md px-2 py-1"
            onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
          >
            <Image
              src={selectedModel.logo}
              alt={selectedModel.name}
              width={16}
              height={16}
              className="mr-1 rounded-sm"
            />
            {selectedModel.name}
            <ChevronDown
              className={`ml-1 h-4 w-4 transition-transform ${
                isModelDropdownOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {isModelDropdownOpen && (
            <div className="absolute left-0 top-full mt-1 z-50 w-48 rounded-md bg-background shadow-lg border border-border/40">
              <div className="py-1">
                {availableModels.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => {
                      setSelectedModel(model);
                      setIsModelDropdownOpen(false);
                    }}
                    className={`
                      w-full px-3 py-2 text-left text-xs
                      flex items-center gap-2
                      ${
                        selectedModel.id === model.id
                          ? "bg-muted"
                          : "hover:bg-muted/50"
                      }
                    `}
                  >
                    <Image
                      src={model.logo}
                      alt={model.name}
                      width={16}
                      height={16}
                      className="rounded-sm"
                    />
                    {model.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Research Controls */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">B:{breadth}</span>
          <Slider
            value={[breadth]}
            min={2}
            max={10}
            step={1}
            className="w-20"
            onValueChange={([value]) => setBreadth(value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">D:{depth}</span>
          <Slider
            value={[depth]}
            min={1}
            max={5}
            step={1}
            className="w-20"
            onValueChange={([value]) => setDepth(value)}
          />
        </div>

        {/* Mobile Download Button */}
        {canDownload && <DownloadButton />}
      </div>

      {/* Desktop Controls - Original layout */}
      <div className="hidden md:flex bg-white absolute bottom-0 py-3 left-2 gap-2 items-center">
        {/* Original desktop controls - unchanged */}
        <button
          type="button"
          onClick={
            enableApiKeys
              ? effectiveHasKeys
                ? handleRemoveKeys
                : () => setShowApiKeyPrompt(true)
              : undefined
          }
          className="flex items-center gap-1"
        >
          {enableApiKeys ? (
            effectiveHasKeys ? (
              <>
                <CheckCircleIcon size={16} className="text-green-500" />
                <span className="text-xs text-green-600">
                  API keys configured
                </span>
              </>
            ) : (
              <>
                <XCircleIcon size={16} className="text-red-500" />
                <span className="text-xs text-red-600">API keys missing</span>
              </>
            )
          ) : (
            <span className="text-xs text-green-600">Using .env API keys</span>
          )}
        </button>

        {/* Model Selector with Dropdown */}
        <div className="relative">
          <button
            type="button"
            className="cursor-pointer text-xs inline-flex items-center justify-center text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 text-muted-foreground hover:text-primary/80 h-7 rounded-md px-2 py-1"
            onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
          >
            <Image
              src={selectedModel.logo}
              alt={selectedModel.name}
              width={16}
              height={16}
              className="mr-1 rounded-sm"
            />
            {selectedModel.name}
            <ChevronDown
              className={`ml-1 h-4 w-4 transition-transform ${
                isModelDropdownOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {isModelDropdownOpen && (
            <div className="absolute left-0 bottom-full mb-1 z-50 w-48 rounded-md bg-background shadow-lg border border-border/40">
              <div className="py-1">
                {availableModels.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => {
                      setSelectedModel(model);
                      setIsModelDropdownOpen(false);
                    }}
                    className={`
                      w-full px-3 py-2 text-left text-xs
                      flex items-center gap-2
                      ${
                        selectedModel.id === model.id
                          ? "bg-muted"
                          : "hover:bg-muted/50"
                      }
                    `}
                  >
                    <Image
                      src={model.logo}
                      alt={model.name}
                      width={16}
                      height={16}
                      className="rounded-sm"
                    />
                    {model.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              Breadth: {breadth}
            </span>
            <Slider
              value={[breadth]}
              min={2}
              max={10}
              step={1}
              className="w-24"
              onValueChange={([value]) => setBreadth(value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              Depth: {depth}
            </span>
            <Slider
              value={[depth]}
              min={1}
              max={5}
              step={1}
              className="w-24"
              onValueChange={([value]) => setDepth(value)}
            />
          </div>
        </div>

        {/* Desktop Download Button */}
        {canDownload && <DownloadButton />}
      </div>

      {/* Submit Button */}
      <Button
        className="rounded-full p-1.5 h-fit absolute bottom-2 right-2 m-0.5 border dark:border-zinc-600"
        onClick={handleSubmit}
        disabled={!input.trim() || isLoading}
      >
        {isLoading ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <Settings2 className="h-4 w-4" />
          </motion.div>
        ) : (
          <ArrowUpIcon className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}

```

File: components/chat/markdown.tsx
```tsx
import React, { memo } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const NonMemoizedMarkdown = ({ children }: { children: string }) => {
  const components = {
    // Root wrapper
    root: ({ children }: any) => (
      <div className="prose prose-zinc dark:prose-invert max-w-none text-sm">
        {children}
      </div>
    ),

    // Code blocks remain the same size
    code: ({ node, inline, className, children, ...props }: any) => {
      const match = /language-(\w+)/.exec(className || '');
      return !inline && match ? (
        <pre
          {...props}
          className="
            relative
            text-sm
            w-full
            overflow-x-auto
            bg-background/50
            border-[0.5px] border-border/40
            p-4
            rounded-lg
            shadow-[0_1px_3px_0_rgb(0,0,0,0.02)]
            backdrop-blur-[2px]
          "
        >
          <code className={match[1]}>{children}</code>
        </pre>
      ) : (
        <code
          className="
            text-sm
            bg-background/50
            border-[0.5px] border-border/40
            py-0.5 px-1.5
            rounded-md
            font-mono
          "
          {...props}
        >
          {children}
        </code>
      );
    },

    // Headings keep their larger sizes
    h1: ({ node, children, ...props }: any) => {
      return (
        <h1
          className="
            text-2xl
            font-semibold
            text-foreground
            mb-4
            pb-2
            border-b
            border-border/40
          "
          {...props}
        >
          {children}
        </h1>
      );
    },

    h2: ({ node, children, ...props }: any) => {
      return (
        <h2
          className="
            text-xl
            font-medium
            text-foreground
            mt-8
            mb-4
          "
          {...props}
        >
          {children}
        </h2>
      );
    },

    h3: ({ node, children, ...props }: any) => {
      return (
        <h3
          className="
            text-lg
            font-medium
            text-foreground
            mt-6
            mb-3
          "
          {...props}
        >
          {children}
        </h3>
      );
    },

    // All regular text elements use text-sm
    p: ({ node, children, ...props }: any) => {
      return (
        <p
          className="
            text-sm
            text-foreground/90
            leading-relaxed
            mb-4
          "
          {...props}
        >
          {children}
        </p>
      );
    },

    ul: ({ node, children, ...props }: any) => {
      return (
        <ul
          className="
            text-sm
            list-disc
            list-outside
            ml-4
            space-y-2
            mb-4
            text-foreground/90
          "
          {...props}
        >
          {children}
        </ul>
      );
    },

    ol: ({ node, children, ...props }: any) => {
      return (
        <ol
          className="
            text-sm
            list-decimal
            list-outside
            ml-4
            space-y-2
            mb-4
            text-foreground/90
          "
          {...props}
        >
          {children}
        </ol>
      );
    },

    li: ({ node, children, ...props }: any) => {
      return (
        <li
          className="
            text-sm
            leading-relaxed
            pl-1
          "
          {...props}
        >
          {children}
        </li>
      );
    },

    // Table elements use text-sm
    table: ({ node, children, ...props }: any) => {
      return (
        <div className="w-full overflow-x-auto mb-4">
          <table
            className="
              min-w-full
              border-collapse
              text-sm
              my-4
            "
            {...props}
          >
            {children}
          </table>
        </div>
      );
    },

    th: ({ node, children, ...props }: any) => {
      return (
        <th
          className="
            text-sm
            border-b
            border-border/40
            bg-background/50
            p-3
            text-left
            font-medium
            text-foreground/90
          "
          {...props}
        >
          {children}
        </th>
      );
    },

    td: ({ node, children, ...props }: any) => {
      return (
        <td
          className="
            text-sm
            border-b
            border-border/40
            p-3
            text-foreground/90
          "
          {...props}
        >
          {children}
        </td>
      );
    },

    // Blockquotes use text-sm
    blockquote: ({ node, children, ...props }: any) => {
      return (
        <blockquote
          className="
            text-sm
            border-l-2
            border-primary/30
            pl-4
            italic
            text-foreground/80
            my-4
          "
          {...props}
        >
          {children}
        </blockquote>
      );
    },

    // Links
    a: ({ node, children, ...props }: any) => {
      return (
        <Link
          className="
            text-primary
            hover:text-primary/80
            underline
            decoration-primary/30
            hover:decoration-primary/50
            transition-colors
            duration-200
          "
          target="_blank"
          rel="noreferrer"
          {...props}
        >
          {children}
        </Link>
      );
    },

    // Bold text
    strong: ({ node, children, ...props }: any) => {
      return (
        <span
          className="
            font-medium
            text-foreground/90
          "
          {...props}
        >
          {children}
        </span>
      );
    },
  };

  return (
    <div className="p-6">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  );
};

export const Markdown = memo(
  NonMemoizedMarkdown,
  (prevProps, nextProps) => prevProps.children === nextProps.children,
);

```

File: components/chat/download-txt.tsx
```tsx
import React from 'react';
import { DownloadIcon } from 'lucide-react';

interface DownloadTxtButtonProps {
  reportText: string;
  fileName?: string;
}

const DownloadTxtButton: React.FC<DownloadTxtButtonProps> = ({
  reportText,
  fileName = 'research_report.txt',
}) => {
  const handleDownload = () => {
    // Create a blob from the report text content.
    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
    // Create a temporary URL for the blob.
    const url = window.URL.createObjectURL(blob);
    // Create a temporary anchor element.
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    // Append the link, trigger click, remove it, and revoke the URL.
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={handleDownload}
      className="
        group
        relative
        flex
        items-center
        justify-center
        gap-2
        px-4
        py-2
        bg-background/50
        hover:bg-muted/30
        border-[0.5px]
        border-border/40
        hover:border-border/60
        rounded-lg
        text-sm
        font-medium
        text-muted-foreground
        hover:text-foreground
        shadow-[0_1px_3px_0_rgb(0,0,0,0.02)]
        hover:shadow-[0_2px_4px_0_rgb(0,0,0,0.02)]
        transition-all
        duration-300
        ease-out
        backdrop-blur-[2px]
        hover:translate-y-[-1px]
      "
    >
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-background/5 to-muted/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg" />
      <DownloadIcon className="w-4 h-4" />
      <span>Download Report</span>
    </button>
  );
};

export default DownloadTxtButton;

```

File: components/chat/message.tsx
```tsx
"use client";

import { Message } from "ai";
import { motion } from "framer-motion";
import {
  BookOpenIcon,
  BrainCircuitIcon,
  GavelIcon,
  SearchIcon,
} from "lucide-react";

import { Markdown } from "./markdown";

export type ProgressStep = {
  type: "query" | "research" | "learning" | "report";
  content: string;
  queries?: Array<{
    query: string;
    researchGoal: string;
  }>;
};

export function PreviewMessage({ message }: { message: Message }) {
  // Helper function to format follow-up questions into markdown
  const formatFollowUpQuestions = (content: string) => {
    if (content.includes("follow-up questions")) {
      // Split the content into introduction and questions
      const [intro, ...questions] = content.split("\n").filter(Boolean);

      // Format as markdown
      return `${intro}\n\n${questions
        .map((q) => {
          // If the line starts with a number, format it as a markdown list item
          if (/^\d+\./.test(q)) {
            return q.trim();
          }
          return q;
        })
        .join("\n\n")}`;
    }
    return content;
  };

  return (
    <motion.div
      className="w-full"
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
    >
      <div
        className={`flex gap-4 ${
          message.role === "user"
            ? "bg-foreground/5 py-3 px-4 rounded-2xl text-sm w-fit ml-auto max-w-[85%] break-words whitespace-pre-wrap"
            : "w-full"
        }`}
      >
        <div
          className={`flex-1 ${
            message.role === "assistant"
              ? "prose prose-zinc dark:prose-invert max-w-none"
              : ""
          }`}
        >
          {message.role === "assistant" ? (
            <div className="markdown-content text-foreground/90">
              <Markdown>{formatFollowUpQuestions(message.content)}</Markdown>
            </div>
          ) : (
            <p className="text-primary leading-relaxed">{message.content}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function ResearchProgress({
  progress,
  isLoading,
}: {
  progress: ProgressStep[];
  isLoading: boolean;
}) {
  // Filter out individual report word updates
  const filteredProgress = progress.filter((step) => {
    if (step.type === "report") {
      // Only show the initial "Generating report" step
      return (
        step.content.includes("Generating") ||
        step.content.includes("Synthesizing")
      );
    }
    return true;
  });

  if (!isLoading && filteredProgress.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-neutral/50">
        <div className="text-center space-y-3">
          <BrainCircuitIcon className="w-12 h-12 mx-auto" />
          <p className="text-sm font-light tracking-wide">
            Begin your research journey
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6 space-y-4">
      {filteredProgress.map((step, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-4"
        >
          <div className="w-8 h-8 flex items-center justify-center rounded-lg">
            {step.type === "query" && <SearchIcon size={14} />}
            {step.type === "research" && <BookOpenIcon size={14} />}
            {step.type === "learning" && <BrainCircuitIcon size={14} />}
            {step.type === "report" && <GavelIcon size={14} />}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium capitalize mb-1">{step.type}</p>
            <p className="text-sm text-base-content/60">{step.content}</p>

            {step.queries && (
              <div className="mt-3 space-y-3">
                {step.queries.map((query, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.1 }}
                    className="rounded-lg p-4 space-y-2"
                  >
                    <p className="text-sm font-medium">{query.query}</p>
                    <p className="text-xs text-base-content/60">
                      {query.researchGoal}
                    </p>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

```

File: components/chat/research-progress.tsx
```tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BrainCircuitIcon,
  FileSearchIcon,
  Loader2Icon,
  PlayIcon,
  SearchIcon,
  SparklesIcon,
} from 'lucide-react';

import { ProgressStep } from './message';

// Simplified configuration with a more minimal color palette
const actionConfig = {
  'Generating up to': {
    icon: <Loader2Icon className="h-[15px] w-[15px] animate-spin" />,
    text: 'Generating',
  },
  Created: {
    icon: <FileSearchIcon className="h-[15px] w-[15px]" />,
    text: 'Created',
  },
  Researching: {
    icon: <SearchIcon className="h-[15px] w-[15px]" />,
    text: 'Researching',
  },
  Found: {
    icon: <SearchIcon className="h-[15px] w-[15px]" />,
    text: 'Found',
  },
  Ran: {
    icon: <PlayIcon className="h-[15px] w-[15px]" />,
    text: 'Processing',
  },
  Generated: {
    icon: <SparklesIcon className="h-[15px] w-[15px]" />,
    text: 'Generated',
  },
};

export function ResearchProgress({
  progress,
  isLoading,
}: {
  progress: ProgressStep[];
  isLoading: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [userHasScrolled, setUserHasScrolled] = useState(false);

  // Handle auto-scrolling
  useEffect(() => {
    const container = containerRef.current;
    if (!container || userHasScrolled) return;

    container.scrollTop = container.scrollHeight;
  }, [progress, userHasScrolled]);

  // Handle scroll events
  const handleScroll = () => {
    const container = containerRef.current;
    if (!container) return;

    const isAtBottom =
      Math.abs(
        container.scrollHeight - container.scrollTop - container.clientHeight,
      ) < 10;

    setUserHasScrolled(!isAtBottom);
  };

  const getConfig = (content: string) => {
    const firstWord = content.split('\n')[0].split(' ')[0];
    for (const [key, config] of Object.entries(actionConfig)) {
      if (firstWord.startsWith(key)) {
        return config;
      }
    }
    return actionConfig['Researching'];
  };

  // Remove the empty state UI since it's now in the main chat
  if (!isLoading && progress.length === 0) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="h-full w-full overflow-y-auto no-scrollbar px-3 py-2 md:px-4 md:py-3 space-y-2"
    >
      <AnimatePresence mode="popLayout">
        {progress.map((step, index) => {
          const [title, ...details] = step.content.split('\n');
          const config = getConfig(title);

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{
                duration: 0.2,
                ease: [0.4, 0, 0.2, 1],
              }}
            >
              <div
                className={`
                  group
                  relative
                  bg-background/50
                  hover:bg-muted/30
                  cursor-default
                  border-[0.5px] border-border/40
                  hover:border-border/60
                  py-2.5 px-3.5
                  rounded-lg
                  flex flex-row
                  gap-3
                  items-start
                  shadow-[0_1px_3px_0_rgb(0,0,0,0.02)]
                  hover:shadow-[0_2px_4px_0_rgb(0,0,0,0.02)]
                  transition-all
                  duration-300
                  ease-out
                  backdrop-blur-[2px]
                  overflow-hidden
                  hover:translate-y-[-1px]
                `}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-background/5 to-muted/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <div className="text-muted-foreground/70 group-hover:text-primary/70 transition-colors duration-300 flex items-center pt-0.5">
                  {config.icon}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-[13px] leading-[15px] text-primary group-hover:text-foreground transition-colors duration-300">
                    <span className="opacity-100 font-normal">
                      {config.text}
                    </span>{' '}
                    <span className="opacity-100 font-medium">
                      {title.split(' ').slice(1).join(' ')}
                    </span>
                  </div>

                  {details.length > 0 && (
                    <p className="mt-2 text-xs text-muted-foreground/70 line-clamp-2">
                      {details.join('\n')}
                    </p>
                  )}

                  {step.queries && (
                    <div className="mt-2.5 space-y-2">
                      {step.queries.map((query, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{
                            delay: idx * 0.1,
                            duration: 0.2,
                            ease: [0.4, 0, 0.2, 1],
                          }}
                          className="
                            bg-background/50
                            hover:bg-muted/30
                            border-[0.5px] border-border/40
                            hover:border-border/60
                            rounded-lg 
                            px-3 py-2.5
                            shadow-[0_1px_3px_0_rgb(0,0,0,0.02)]
                            transition-all 
                            duration-300
                            backdrop-blur-[2px]
                          "
                        >
                          <p className="text-[13px] leading-[15px] text-muted-foreground/90">
                            {query.query}
                          </p>
                          <p className="mt-1.5 text-[11px] leading-[13px] text-muted-foreground/70">
                            {query.researchGoal}
                          </p>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

```

File: components/chat/site-header.tsx
```tsx
import Image from "next/image";
import Link from "next/link";

export function Header() {
  return (
    <>
      <header className="pt-4 fixed left-0 top-0 z-50 w-full translate-y-[-1rem] animate-fade-in border-b border-base-200 backdrop-blur-[12px] [--animation-delay:600ms]">
        <div className="container flex h-[3.5rem] items-center justify-center">
          <Link
            className="flex items-center text-md text-black"
            href="https://anotherwrapper.com"
            target="_blank"
          >
            <Image
              src="/logo-text.png"
              alt="Anotherwrapper Logo"
              width={400}
              height={100}
              className="w-48"
            />
          </Link>
        </div>
      </header>
    </>
  );
}

```

File: lib/deep-research/ai/providers.ts
```ts
import { createOpenAI } from '@ai-sdk/openai';
import { getEncoding } from 'js-tiktoken';

import { RecursiveCharacterTextSplitter } from './text-splitter';

// Model Display Information
export const AI_MODEL_DISPLAY = {
  'gpt-4o': {
    id: 'gpt-4o',
    name: 'GPT-4o',
    logo: '/providers/openai.webp',
    vision: true,
  },
  'gpt-4o-mini': {
    id: 'gpt-4o-mini',
    name: 'GPT-4o mini',
    logo: '/providers/openai.webp',
    vision: true,
  },
  'o3-mini': {
    id: 'o3-mini',
    name: 'o3 mini',
    logo: '/providers/openai.webp',
    vision: false,
  },
} as const;

export type AIModel = keyof typeof AI_MODEL_DISPLAY;
export type AIModelDisplayInfo = (typeof AI_MODEL_DISPLAY)[AIModel];
export const availableModels = Object.values(AI_MODEL_DISPLAY);

// OpenAI Client
const openai = createOpenAI({
  apiKey: process.env.OPENAI_KEY!,
});

// Create model instances with configurations
export function createModel(modelId: AIModel, apiKey?: string) {
  const client = createOpenAI({
    apiKey: apiKey || process.env.OPENAI_KEY!,
  });

  return client(modelId, {
    structuredOutputs: true,
    ...(modelId === 'o3-mini' ? { reasoningEffort: 'medium' } : {}),
  });
}

// Token handling
const MinChunkSize = 140;
const encoder = getEncoding('o200k_base');

// trim prompt to maximum context size
export function trimPrompt(prompt: string, contextSize = 120_000) {
  if (!prompt) {
    return '';
  }

  const length = encoder.encode(prompt).length;
  if (length <= contextSize) {
    return prompt;
  }

  const overflowTokens = length - contextSize;
  // on average it's 3 characters per token, so multiply by 3 to get a rough estimate of the number of characters
  const chunkSize = prompt.length - overflowTokens * 3;
  if (chunkSize < MinChunkSize) {
    return prompt.slice(0, MinChunkSize);
  }

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize,
    chunkOverlap: 0,
  });
  const trimmedPrompt = splitter.splitText(prompt)[0] ?? '';

  // last catch, there's a chance that the trimmed prompt is same length as the original prompt, due to how tokens are split & innerworkings of the splitter, handle this case by just doing a hard cut
  if (trimmedPrompt.length === prompt.length) {
    return trimPrompt(prompt.slice(0, chunkSize), contextSize);
  }

  // recursively trim until the prompt is within the context size
  return trimPrompt(trimmedPrompt, contextSize);
}

```

File: lib/deep-research/ai/text-splitter.test.ts
```ts
import assert from 'node:assert';
import { describe, it } from 'node:test';

import { RecursiveCharacterTextSplitter } from './text-splitter';

describe('RecursiveCharacterTextSplitter', () => {
  it('Should correctly split text by separators', () => {
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 50,
      chunkOverlap: 10,
    });
    assert.deepEqual(
      splitter.splitText(
        'Hello world, this is a test of the recursive text splitter.',
      ),
      ['Hello world', 'this is a test of the recursive text splitter'],
    );

    splitter.chunkSize = 100;
    assert.deepEqual(
      splitter.splitText(
        'Hello world, this is a test of the recursive text splitter. If I have a period, it should split along the period.',
      ),
      [
        'Hello world, this is a test of the recursive text splitter',
        'If I have a period, it should split along the period.',
      ],
    );

    splitter.chunkSize = 110;
    assert.deepEqual(
      splitter.splitText(
        'Hello world, this is a test of the recursive text splitter. If I have a period, it should split along the period.\nOr, if there is a new line, it should prioritize splitting on new lines instead.',
      ),
      [
        'Hello world, this is a test of the recursive text splitter',
        'If I have a period, it should split along the period.',
        'Or, if there is a new line, it should prioritize splitting on new lines instead.',
      ],
    );
  });

  it('Should handle empty string', () => {
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 50,
      chunkOverlap: 10,
    });
    assert.deepEqual(splitter.splitText(''), []);
  });
});

```

File: lib/deep-research/ai/text-splitter.ts
```ts
interface TextSplitterParams {
  chunkSize: number;

  chunkOverlap: number;
}

abstract class TextSplitter implements TextSplitterParams {
  chunkSize = 1000;
  chunkOverlap = 200;

  constructor(fields?: Partial<TextSplitterParams>) {
    this.chunkSize = fields?.chunkSize ?? this.chunkSize;
    this.chunkOverlap = fields?.chunkOverlap ?? this.chunkOverlap;
    if (this.chunkOverlap >= this.chunkSize) {
      throw new Error('Cannot have chunkOverlap >= chunkSize');
    }
  }

  abstract splitText(text: string): string[];

  createDocuments(texts: string[]): string[] {
    const documents: string[] = [];
    for (let i = 0; i < texts.length; i += 1) {
      const text = texts[i];
      for (const chunk of this.splitText(text!)) {
        documents.push(chunk);
      }
    }
    return documents;
  }

  splitDocuments(documents: string[]): string[] {
    return this.createDocuments(documents);
  }

  private joinDocs(docs: string[], separator: string): string | null {
    const text = docs.join(separator).trim();
    return text === '' ? null : text;
  }

  mergeSplits(splits: string[], separator: string): string[] {
    const docs: string[] = [];
    const currentDoc: string[] = [];
    let total = 0;
    for (const d of splits) {
      const _len = d.length;
      if (total + _len >= this.chunkSize) {
        if (total > this.chunkSize) {
          console.warn(
            `Created a chunk of size ${total}, +
which is longer than the specified ${this.chunkSize}`,
          );
        }
        if (currentDoc.length > 0) {
          const doc = this.joinDocs(currentDoc, separator);
          if (doc !== null) {
            docs.push(doc);
          }
          // Keep on popping if:
          // - we have a larger chunk than in the chunk overlap
          // - or if we still have any chunks and the length is long
          while (
            total > this.chunkOverlap ||
            (total + _len > this.chunkSize && total > 0)
          ) {
            total -= currentDoc[0]!.length;
            currentDoc.shift();
          }
        }
      }
      currentDoc.push(d);
      total += _len;
    }
    const doc = this.joinDocs(currentDoc, separator);
    if (doc !== null) {
      docs.push(doc);
    }
    return docs;
  }
}

export interface RecursiveCharacterTextSplitterParams
  extends TextSplitterParams {
  separators: string[];
}

export class RecursiveCharacterTextSplitter
  extends TextSplitter
  implements RecursiveCharacterTextSplitterParams
{
  separators: string[] = ['\n\n', '\n', '.', ',', '>', '<', ' ', ''];

  constructor(fields?: Partial<RecursiveCharacterTextSplitterParams>) {
    super(fields);
    this.separators = fields?.separators ?? this.separators;
  }

  splitText(text: string): string[] {
    const finalChunks: string[] = [];

    // Get appropriate separator to use
    let separator: string = this.separators[this.separators.length - 1]!;
    for (const s of this.separators) {
      if (s === '') {
        separator = s;
        break;
      }
      if (text.includes(s)) {
        separator = s;
        break;
      }
    }

    // Now that we have the separator, split the text
    let splits: string[];
    if (separator) {
      splits = text.split(separator);
    } else {
      splits = text.split('');
    }

    // Now go merging things, recursively splitting longer texts.
    let goodSplits: string[] = [];
    for (const s of splits) {
      if (s.length < this.chunkSize) {
        goodSplits.push(s);
      } else {
        if (goodSplits.length) {
          const mergedText = this.mergeSplits(goodSplits, separator);
          finalChunks.push(...mergedText);
          goodSplits = [];
        }
        const otherInfo = this.splitText(s);
        finalChunks.push(...otherInfo);
      }
    }
    if (goodSplits.length) {
      const mergedText = this.mergeSplits(goodSplits, separator);
      finalChunks.push(...mergedText);
    }
    return finalChunks;
  }
}

```

File: lib/deep-research/feedback.ts
```ts
import { generateObject } from 'ai';
import { z } from 'zod';

import { createModel, type AIModel } from './ai/providers';
import { systemPrompt } from './prompt';

export async function generateFeedback({
  query,
  numQuestions = 3,
  modelId = 'o3-mini',
  apiKey,
}: {
  query: string;
  numQuestions?: number;
  modelId?: AIModel;
  apiKey?: string;
}) {
  const model = createModel(modelId, apiKey);

  const userFeedback = await generateObject({
    model,
    system: systemPrompt(),
    prompt: `Given the following query from the user, ask some follow up questions to clarify the research direction. Return a maximum of ${numQuestions} questions, but feel free to return less if the original query is clear: <query>${query}</query>`,
    schema: z.object({
      questions: z
        .array(z.string())
        .describe(
          `Follow up questions to clarify the research direction, max of ${numQuestions}`,
        ),
    }),
  });

  return userFeedback.object.questions.slice(0, numQuestions);
}

```

File: lib/deep-research/index.ts
```ts
export { deepResearch } from './deep-research';
export { generateFeedback } from './feedback';
export { writeFinalReport } from './deep-research';
export { systemPrompt } from './prompt';

```

File: lib/deep-research/deep-research.ts
```ts
import FirecrawlApp, { SearchResponse } from '@mendable/firecrawl-js';
import { generateObject } from 'ai';
import { compact } from 'lodash-es';
import { z } from 'zod';

import { createModel, trimPrompt } from './ai/providers';
import { systemPrompt } from './prompt';

type ResearchResult = {
  learnings: string[];
  visitedUrls: string[];
};

type DeepResearchOptions = {
  query: string;
  breadth?: number;
  depth?: number;
  learnings?: string[];
  visitedUrls?: string[];
  onProgress?: (update: string) => Promise<void>;
  model: ReturnType<typeof createModel>;
  firecrawlKey?: string;
};

// Update the firecrawl initialization to use the provided key
const getFirecrawl = (apiKey?: string) =>
  new FirecrawlApp({
    apiKey: apiKey ?? process.env.FIRECRAWL_KEY ?? '',
    apiUrl: process.env.FIRECRAWL_BASE_URL,
  });

// Helper function to format progress messages consistently
const formatProgress = {
  generating: (count: number, query: string) =>
    `Generating up to ${count} SERP queries\n${query}`,

  created: (count: number, queries: string) =>
    `Created ${count} SERP queries\n${queries}`,

  researching: (query: string) => `Researching\n${query}`,

  found: (count: number, query: string) => `Found ${count} results\n${query}`,

  ran: (query: string, count: number) =>
    `Ran "${query}"\n${count} content items found`,

  generated: (count: number, query: string) =>
    `Generated ${count} learnings\n${query}`,
};

// Helper function to log and stream messages
async function logProgress(
  message: string,
  onProgress?: (update: string) => Promise<void>,
) {
  if (onProgress) {
    await onProgress(message);
  }
}

// take en user query, return a list of SERP queries
async function generateSerpQueries({
  query,
  numQueries = 3,
  learnings,
  onProgress,
  model,
}: {
  query: string;
  numQueries?: number;

  // optional, if provided, the research will continue from the last learning
  learnings?: string[];
  onProgress?: (update: string) => Promise<void>;
  model: ReturnType<typeof createModel>;
}) {
  await logProgress(formatProgress.generating(numQueries, query), onProgress);

  const res = await generateObject({
    model,
    system: systemPrompt(),
    prompt: `Given the following prompt from the user, generate a list of SERP queries to research the topic. Return a maximum of ${numQueries} queries, but feel free to return less if the original prompt is clear. Make sure each query is unique and not similar to each other: <prompt>${query}</prompt>\n\n${
      learnings
        ? `Here are some learnings from previous research, use them to generate more specific queries: ${learnings.join(
            '\n',
          )}`
        : ''
    }`,
    schema: z.object({
      queries: z
        .array(
          z.object({
            query: z.string().describe('The SERP query'),
            researchGoal: z
              .string()
              .describe(
                'First talk about the goal of the research that this query is meant to accomplish, then go deeper into how to advance the research once the results are found, mention additional research directions. Be as specific as possible, especially for additional research directions.',
              ),
          }),
        )
        .describe(`List of SERP queries, max of ${numQueries}`),
    }),
  });

  const queriesList = res.object.queries.map(q => q.query).join(', ');
  await logProgress(
    formatProgress.created(res.object.queries.length, queriesList),
    onProgress,
  );

  return res.object.queries.slice(0, numQueries).map(q => q.query);
}

async function processSerpResult({
  query,
  result,
  numLearnings = 3,
  numFollowUpQuestions = 3,
  onProgress,
  model,
}: {
  query: string;
  result: SearchResponse;
  numLearnings?: number;
  numFollowUpQuestions?: number;
  onProgress?: (update: string) => Promise<void>;
  model: ReturnType<typeof createModel>;
}) {
  const contents = compact(result.data.map(item => item.markdown)).map(
    content => trimPrompt(content, 25_000),
  );

  await logProgress(formatProgress.ran(query, contents.length), onProgress);

  const res = await generateObject({
    model,
    abortSignal: AbortSignal.timeout(60_000),
    system: systemPrompt(),
    prompt: `Given the following contents from a SERP search for the query <query>${query}</query>, generate a list of learnings from the contents. Return a maximum of ${numLearnings} learnings, but feel free to return less if the contents are clear. Make sure each learning is unique and not similar to each other. The learnings should be concise and to the point, as detailed and information dense as possible. Make sure to include any entities like people, places, companies, products, things, etc in the learnings, as well as any exact metrics, numbers, or dates. The learnings will be used to research the topic further.\n\n<contents>${contents
      .map(content => `<content>\n${content}\n</content>`)
      .join('\n')}</contents>`,
    schema: z.object({
      learnings: z
        .array(z.string())
        .describe(`List of learnings, max of ${numLearnings}`),
      followUpQuestions: z
        .array(z.string())
        .describe(
          `List of follow-up questions to research the topic further, max of ${numFollowUpQuestions}`,
        ),
    }),
  });

  await logProgress(
    formatProgress.generated(res.object.learnings.length, query),
    onProgress,
  );

  return res.object;
}

export async function writeFinalReport({
  prompt,
  learnings,
  visitedUrls,
  model,
}: {
  prompt: string;
  learnings: string[];
  visitedUrls: string[];
  model: ReturnType<typeof createModel>;
}) {
  const learningsString = trimPrompt(
    learnings
      .map(learning => `<learning>\n${learning}\n</learning>`)
      .join('\n'),
    150_000,
  );

  const res = await generateObject({
    model,
    system: systemPrompt(),
    prompt: `Given the following prompt from the user, write a final report on the topic using the learnings from research and format it in proper Markdown. Use Markdown syntax (headings, lists, horizontal rules, etc.) to structure the document. Aim for a detailed report of at least 3 pages.\n\n<prompt>${prompt}</prompt>\n\nHere are all the learnings from previous research:\n\n<learnings>\n${learningsString}\n</learnings>`,
    schema: z.object({
      reportMarkdown: z
        .string()
        .describe('Final report on the topic in Markdown'),
    }),
  });

  // Append the visited URLs as a markdown formatted Sources section
  const urlsSection = `\n\n## Sources\n\n${visitedUrls
    .map(url => `- ${url}`)
    .join('\n')}`;

  // Prepend a primary markdown heading to make sure the UI renders it as markdown
  return `# Research Report\n\n${res.object.reportMarkdown}${urlsSection}`;
}

export async function deepResearch({
  query,
  breadth = 3,
  depth = 2,
  learnings = [],
  visitedUrls = [],
  onProgress,
  model,
  firecrawlKey,
}: DeepResearchOptions): Promise<ResearchResult> {
  const firecrawl = getFirecrawl(firecrawlKey);
  const results: ResearchResult[] = [];

  // Generate SERP queries
  await logProgress(formatProgress.generating(breadth, query), onProgress);

  const serpQueries = await generateSerpQueries({
    query,
    learnings,
    numQueries: breadth,
    onProgress,
    model,
  });

  await logProgress(
    formatProgress.created(serpQueries.length, serpQueries.join(', ')),
    onProgress,
  );

  // Process each SERP query
  for (const serpQuery of serpQueries) {
    try {
      await logProgress(formatProgress.researching(serpQuery), onProgress);

      const searchResults = await firecrawl.search(serpQuery, {
        timeout: 15000,
        limit: 5,
        scrapeOptions: { formats: ['markdown'] },
      });

      await logProgress(
        formatProgress.found(searchResults.data.length, serpQuery),
        onProgress,
      );

      if (searchResults.data.length > 0) {
        await logProgress(
          formatProgress.ran(serpQuery, searchResults.data.length),
          onProgress,
        );

        const newLearnings = await processSerpResult({
          query: serpQuery,
          result: searchResults,
          numLearnings: Math.ceil(breadth / 2),
          numFollowUpQuestions: Math.ceil(breadth / 2),
          onProgress,
          model,
        });

        await logProgress(
          formatProgress.generated(newLearnings.learnings.length, serpQuery),
          onProgress,
        );

        results.push({
          learnings: newLearnings.learnings,
          visitedUrls: searchResults.data
            .map(r => r.url)
            .filter((url): url is string => url != null),
        });
      }
    } catch (e) {
      console.error(`Error running query: ${serpQuery}: `, e);
      await logProgress(`Error running "${serpQuery}": ${e}`, onProgress);
      results.push({
        learnings: [],
        visitedUrls: [],
      });
    }
  }

  return {
    learnings: Array.from(new Set(results.flatMap(r => r.learnings))),
    visitedUrls: Array.from(new Set(results.flatMap(r => r.visitedUrls))),
  };
}

```

File: lib/deep-research/prompt.ts
```ts
export const systemPrompt = () => {
  const now = new Date().toISOString();
  return `You are an expert researcher. Today is ${now}. Follow these instructions when responding:
  - You may be asked to research subjects that is after your knowledge cutoff, assume the user is right when presented with news.
  - The user is a highly experienced analyst, no need to simplify it, be as detailed as possible and make sure your response is correct.
  - Be highly organized.
  - Suggest solutions that I didn't think about.
  - Be proactive and anticipate my needs.
  - Treat me as an expert in all subject matter.
  - Mistakes erode my trust, so be accurate and thorough.
  - Provide detailed explanations, I'm comfortable with lots of detail.
  - Value good arguments over authorities, the source is irrelevant.
  - Consider new technologies and contrarian ideas, not just the conventional wisdom.
  - You may use high levels of speculation or prediction, just flag it for me.`;
};

```

File: lib/hooks/use-scroll-to-bottom.ts
```ts
import { useEffect, useRef, RefObject } from 'react';

export function useScrollToBottom<T extends HTMLElement>(): [
  RefObject<T>,
  RefObject<T>,
] {
  const containerRef = useRef<T>(null);
  const endRef = useRef<T>(null);

  useEffect(() => {
    const container = containerRef.current;
    const end = endRef.current;

    if (container && end) {
      const observer = new MutationObserver(() => {
        end.scrollIntoView({ behavior: 'instant', block: 'end' });
      });

      observer.observe(container, {
        childList: true,
        subtree: true,
        attributes: true,
        characterData: true,
      });

      return () => observer.disconnect();
    }
  }, []);

  return [containerRef, endRef];
}

```

File: lib/utils.ts
```ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const isMobile = () => {
  if (typeof window === "undefined") return false;
  const width = window.innerWidth;
  return width <= 1024;
};

export function getCurrentFormattedDate(): string {
  const currentDate = new Date();
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  };
  return new Intl.DateTimeFormat("en-US", options).format(currentDate);
}

export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const dateString = date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const timeString = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return `${dateString} at ${timeString}`;
}

```

File: app/api/research/route.ts
```ts
import { NextRequest } from "next/server";

import {
  deepResearch,
  generateFeedback,
  writeFinalReport,
} from "@/lib/deep-research";
import { createModel, type AIModel } from "@/lib/deep-research/ai/providers";

export async function POST(req: NextRequest) {
  try {
    const {
      query,
      breadth = 3,
      depth = 2,
      modelId = "o3-mini",
    } = await req.json();

    // Retrieve API keys from secure cookies
    const openaiKey = req.cookies.get("openai-key")?.value;
    const firecrawlKey = req.cookies.get("firecrawl-key")?.value;

    // Add API key validation
    if (process.env.NEXT_PUBLIC_ENABLE_API_KEYS === "true") {
      if (!openaiKey || !firecrawlKey) {
        return Response.json(
          { error: "API keys are required but not provided" },
          { status: 401 }
        );
      }
    }

    console.log("\n🔬 [RESEARCH ROUTE] === Request Started ===");
    console.log("Query:", query);
    console.log("Model ID:", modelId);
    console.log("Configuration:", {
      breadth,
      depth,
    });
    console.log("API Keys Present:", {
      OpenAI: openaiKey ? "✅" : "❌",
      FireCrawl: firecrawlKey ? "✅" : "❌",
    });

    try {
      const model = createModel(modelId as AIModel, openaiKey);
      console.log("\n🤖 [RESEARCH ROUTE] === Model Created ===");
      console.log("Using Model:", modelId);

      const encoder = new TextEncoder();
      const stream = new TransformStream();
      const writer = stream.writable.getWriter();

      (async () => {
        try {
          console.log("\n🚀 [RESEARCH ROUTE] === Research Started ===");

          const feedbackQuestions = await generateFeedback({
            query,
            modelId,
            apiKey: openaiKey,
          });
          await writer.write(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "progress",
                step: {
                  type: "query",
                  content: "Generated feedback questions",
                },
              })}\n\n`
            )
          );

          const { learnings, visitedUrls } = await deepResearch({
            query,
            breadth,
            depth,
            model,
            firecrawlKey,
            onProgress: async (update: string) => {
              console.log("\n📊 [RESEARCH ROUTE] Progress Update:", update);
              await writer.write(
                encoder.encode(
                  `data: ${JSON.stringify({
                    type: "progress",
                    step: {
                      type: "research",
                      content: update,
                    },
                  })}\n\n`
                )
              );
            },
          });

          console.log("\n✅ [RESEARCH ROUTE] === Research Completed ===");
          console.log("Learnings Count:", learnings.length);
          console.log("Visited URLs Count:", visitedUrls.length);

          const report = await writeFinalReport({
            prompt: query,
            learnings,
            visitedUrls,
            model,
          });

          await writer.write(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "result",
                feedbackQuestions,
                learnings,
                visitedUrls,
                report,
              })}\n\n`
            )
          );
        } catch (error) {
          console.error("\n❌ [RESEARCH ROUTE] === Research Process Error ===");
          console.error("Error:", error);
          await writer.write(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "error",
                message: "Research failed",
              })}\n\n`
            )
          );
        } finally {
          await writer.close();
        }
      })();

      return new Response(stream.readable, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    } catch (error) {
      console.error("\n💥 [RESEARCH ROUTE] === Route Error ===");
      console.error("Error:", error);
      return Response.json({ error: "Research failed" }, { status: 500 });
    }
  } catch (error) {
    console.error("\n💥 [RESEARCH ROUTE] === Parse Error ===");
    console.error("Error:", error);
    return Response.json({ error: "Research failed" }, { status: 500 });
  }
}

```

File: app/api/keys/route.ts
```ts
import { NextRequest, NextResponse } from 'next/server';

// Handle GET requests to check keys and POST requests to set keys
export async function GET(req: NextRequest) {
  const openaiKey = req.cookies.get('openai-key')?.value;
  const firecrawlKey = req.cookies.get('firecrawl-key')?.value;
  const keysPresent = Boolean(openaiKey && firecrawlKey);
  return NextResponse.json({ keysPresent });
}

export async function POST(req: NextRequest) {
  try {
    const { openaiKey, firecrawlKey } = await req.json();
    const response = NextResponse.json({ success: true });
    response.cookies.set('openai-key', openaiKey, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'strict',
    });
    response.cookies.set('firecrawl-key', firecrawlKey, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'strict',
    });
    return response;
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Failed to set API keys' },
      { status: 500 },
    );
  }
}

// New: DELETE handler to remove API keys
export async function DELETE(req: NextRequest) {
  try {
    const response = NextResponse.json({ success: true });
    response.cookies.delete('openai-key');
    response.cookies.delete('firecrawl-key');
    return response;
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Failed to remove API keys' },
      { status: 500 },
    );
  }
}

```

File: app/api/feedback/route.ts
```ts
import { NextRequest, NextResponse } from "next/server";

import { AIModel } from "@/lib/deep-research/ai/providers";
import { generateFeedback } from "@/lib/deep-research/feedback";

export async function POST(req: NextRequest) {
  try {
    const { query, numQuestions, modelId = "o3-mini" } = await req.json();

    // Retrieve API key(s) from secure cookies
    const openaiKey = req.cookies.get("openai-key")?.value;
    const firecrawlKey = req.cookies.get("firecrawl-key")?.value;

    // Add API key validation
    if (process.env.NEXT_PUBLIC_ENABLE_API_KEYS === "true") {
      if (!openaiKey || !firecrawlKey) {
        return NextResponse.json(
          { error: "API keys are required but not provided" },
          { status: 401 }
        );
      }
    }

    console.log("\n🔍 [FEEDBACK ROUTE] === Request Started ===");
    console.log("Query:", query);
    console.log("Model ID:", modelId);
    console.log("Number of Questions:", numQuestions);
    console.log("API Keys Present:", {
      OpenAI: openaiKey ? "✅" : "❌",
      FireCrawl: firecrawlKey ? "✅" : "❌",
    });

    try {
      const questions = await generateFeedback({
        query,
        numQuestions,
        modelId: modelId as AIModel,
        apiKey: openaiKey,
      });

      console.log("\n✅ [FEEDBACK ROUTE] === Success ===");
      console.log("Generated Questions:", questions);
      console.log("Number of Questions Generated:", questions.length);

      return NextResponse.json({ questions });
    } catch (error) {
      console.error("\n❌ [FEEDBACK ROUTE] === Generation Error ===");
      console.error("Error:", error);
      throw error;
    }
  } catch (error) {
    console.error("\n💥 [FEEDBACK ROUTE] === Route Error ===");
    console.error("Error:", error);

    return NextResponse.json(
      {
        error: "Feedback generation failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

```
</file_contents>

