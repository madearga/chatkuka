'use client';

import { useChat as useAIChat } from 'ai/react';

// Re-export the useChat hook from ai/react with additional methods
export const useChat = () => {
  const chat = useAIChat();

  // Add the submitForm method expected by the Overview component
  return {
    ...chat,
    submitForm: (message: string) => {
      if (message.trim()) {
        chat.setInput(message);
        chat.handleSubmit(new Event('submit') as any);
      }
    }
  };
};
