"use client";

import { AIInputWithSearch } from "@/components/ui/ai-input-with-search";

export function AIInputWithSearchDemo() {
  return (
    <div className="space-y-8 min-w-[350px]">
      <div>
        <AIInputWithSearch 
          onSubmit={(value, withSearch) => {
            console.log('Message:', value);
            console.log('Search enabled:', withSearch);
          }}
          onFileSelect={(file) => {
            console.log('Selected file:', file);
          }}
        />
      </div>
    </div>
  );
} 