// @/components/chat-input/suggestions.tsx
"use client";

import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SUGGESTIONS, TRANSITION_SPRING, TRANSITION_VARIANTS } from "@/lib/ai/config";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SuggestionsProps = {
  onSuggestion: (suggestion: string) => void;
  value?: string;
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
      if (suggestion.items && suggestion.items.length > 0) {
         setActiveCategory(suggestion.label);
      } else {
        onSuggestion(suggestion.prompt);
      }
    },
    [onSuggestion]
  );

  const SuggestionButton = ({ children, highlight, ...props }: any) => {
    const isHighlightMode = highlight !== undefined && highlight.trim() !== "";
    const content = typeof children === "string" ? children : "";

    if (!isHighlightMode || !content) {
      return (
        <Button
          variant="outline"
          size="sm"
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
          "w-full justify-start rounded-xl py-2 h-auto text-left",
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
        className="flex w-full flex-col space-y-1 px-2 md:mx-auto md:max-w-2xl md:pl-0"
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
