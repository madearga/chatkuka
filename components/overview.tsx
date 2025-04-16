"use client";

import { useChat } from "@/lib/hooks/use-chat";
import { cn } from "@/lib/utils";
import { suggestions } from "@/lib/ai/config";

export const Overview = () => {
  const { setInput, submitForm } = useChat();

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    submitForm(suggestion);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full w-full px-4 py-8">
      <div className="w-full max-w-2xl mx-auto text-center">
        <h2 className="text-xl md:text-2xl font-semibold mb-6">How can I help you?</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-4">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              className={cn(
                "p-4 text-sm text-left rounded-xl border border-border",
                "hover:bg-accent/50 transition-colors",
                "flex items-start"
              )}
              onClick={() => handleSuggestionClick(suggestion.prompt)}
            >
              <span>{suggestion.title}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
