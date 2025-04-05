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
        id: "suggestions",
        label: "Suggestions",
        isActive: !isPersonaMode,
        onClick: () => {
          setIsPersonaMode(false);
        },
      },
      {
        id: "personas",
        label: "Personas",
        isActive: isPersonaMode,
        onClick: () => {
          setIsPersonaMode(true);
        },
      },
    ],
    [isPersonaMode, onSelectSystemPrompt]
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="relative w-full h-[70px]">
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

      <div className="relative flex items-center justify-center mb-2">
        <div className="relative flex h-8 flex-row gap-3 rounded-lg bg-muted p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={cn(
                "relative z-10 flex h-full flex-1 items-center justify-center rounded-md px-2 py-1 text-xs font-medium transition-colors",
                !tab.isActive ? "text-muted-foreground hover:text-foreground" : "text-foreground"
              )}
              onClick={tab.onClick}
              type="button"
            >
              {tab.isActive && (
                <motion.div
                  layoutId="prompt-system-tab-background"
                  className="bg-background absolute inset-0 z-[-1] rounded-md shadow-sm"
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
