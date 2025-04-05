// @/components/chat-input/prompt-system.tsx
"use client";

import React, { memo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Personas } from "./personas";
import { Suggestions } from "./suggestions";
import { TRANSITION_SPRING } from "@/lib/ai/config";
import { Button } from "@/components/ui/button"; // Import Button
import { ArrowLeftRight } from "lucide-react"; // Correct icon import

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

  const handleToggleMode = () => {
    setIsPersonaMode(!isPersonaMode);
  };

  return (
    <div className="flex flex-col items-center w-full gap-4">
      {/* Content area - Renders Suggestions or Personas */}
      <div className="relative w-full min-h-[70px]">
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

      {/* Toggle Button */}  
      <div className="flex items-center justify-center w-full mt-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleToggleMode}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
        >
          <ArrowLeftRight className="size-3.5" /> {/* Correct icon */}
          {isPersonaMode ? "Switch to Suggestions" : "Switch to Personas"}
        </Button>
      </div>
    </div>
  );
});
