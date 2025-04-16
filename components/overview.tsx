"use client";

import { useChat } from "@/lib/hooks/use-chat";
import { cn } from "@/lib/utils";
import { suggestions } from "@/lib/ai/config";
import { Sparkles, BookOpenText, Code, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Overview = () => {
  const { setInput, submitForm } = useChat();

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    submitForm(suggestion);
  };

  const categories = [
    { name: "Create", icon: Sparkles },
    { name: "Explore", icon: BookOpenText },
    { name: "Code", icon: Code },
    { name: "Learn", icon: Lightbulb },
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full w-full px-4 py-8">
      <div className="w-full max-w-2xl mx-auto text-center">
        <h2 className="text-xl md:text-2xl font-semibold mb-6">How can I help you?</h2>

        <div className="flex flex-wrap justify-center gap-2 mb-6">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <Button
                key={category.name}
                variant="outline"
                size="sm"
                className="rounded-full py-1.5 px-3 gap-1.5"
                onClick={() => console.log(`Selected category: ${category.name}`)}
              >
                <Icon className="h-4 w-4" />
                <span>{category.name}</span>
              </Button>
            );
          })}
        </div>

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
