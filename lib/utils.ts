import type {
  CoreAssistantMessage,
  CoreToolMessage,
  Message,
  TextStreamPart,
  ToolInvocation,
  ToolSet,
} from 'ai';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

import type { Message as DBMessage, Document } from '@/lib/db/schema';
import { type DBSchemaMessage } from '@/lib/db/queries';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ApplicationError extends Error {
  info: string;
  status: number;
}

export const fetcher = async (url: string) => {
  const res = await fetch(url);

  if (!res.ok) {
    const error = new Error(
      'An error occurred while fetching the data.',
    ) as ApplicationError;

    error.info = await res.json();
    error.status = res.status;

    throw error;
  }

  return res.json();
};

export function getLocalStorage(key: string) {
  if (typeof window !== 'undefined') {
    return JSON.parse(localStorage.getItem(key) || '[]');
  }
  return [];
}

export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function convertToUIMessages(
  messages: Array<DBSchemaMessage>,
): Array<Message> {
  return messages.map((dbMessage) => {
    // Define expected part structure for type safety
    type ExpectedPart = { type: string; text?: string };

    const uiMessage: Message = {
      id: dbMessage.id,
      role: dbMessage.role as Message['role'],
      parts: dbMessage.parts as any, // Map parts, cast needed if types differ
      // Add deprecated content field, asserting parts type
      content: ((dbMessage.parts as ExpectedPart[] | undefined)
        ?.find((p: ExpectedPart) => p.type === 'text')
        ?.text
      ) ?? '',
      experimental_attachments: dbMessage.attachments as any, // Map attachments
    };

    if (dbMessage.createdAt) {
      (uiMessage as any).createdAt = new Date(dbMessage.createdAt);
    }

    return uiMessage;
  });
}

type ResponseMessageWithoutId = CoreToolMessage | CoreAssistantMessage;
type ResponseMessage = ResponseMessageWithoutId & { id: string };

export function sanitizeResponseMessages({
  messages,
  reasoning,
}: {
  messages: Array<ResponseMessage>;
  reasoning: string | undefined;
}) {
  const toolResultIds: Array<string> = [];

  for (const message of messages) {
    if (message.role === 'tool') {
      for (const content of message.content) {
        if (content.type === 'tool-result') {
          toolResultIds.push(content.toolCallId);
        }
      }
    }
  }

  const messagesBySanitizedContent = messages.map((message) => {
    if (message.role !== 'assistant') return message;

    if (typeof message.content === 'string') return message;

    const sanitizedContent = message.content.filter((content) =>
      content.type === 'tool-call'
        ? toolResultIds.includes(content.toolCallId)
        : content.type === 'text'
          ? content.text.length > 0
          : true,
    );

    if (reasoning) {
      // @ts-expect-error: reasoning message parts in sdk is wip
      sanitizedContent.push({ type: 'reasoning', reasoning });
    }

    return {
      ...message,
      content: sanitizedContent,
    };
  });

  return messagesBySanitizedContent.filter(
    (message) => message.content.length > 0,
  );
}

export function sanitizeUIMessages(messages: Array<Message>): Array<Message> {
  const messagesBySanitizedToolInvocations = messages.map((message) => {
    if (message.role !== 'assistant') return message;

    if (!message.toolInvocations) return message;

    const toolResultIds: Array<string> = [];

    for (const toolInvocation of message.toolInvocations) {
      if (toolInvocation.state === 'result') {
        toolResultIds.push(toolInvocation.toolCallId);
      }
    }

    const sanitizedToolInvocations = message.toolInvocations.filter(
      (toolInvocation) =>
        toolInvocation.state === 'result' ||
        toolResultIds.includes(toolInvocation.toolCallId),
    );

    return {
      ...message,
      toolInvocations: sanitizedToolInvocations,
    };
  });

  return messagesBySanitizedToolInvocations.filter(
    (message) =>
      message.content.length > 0 ||
      (message.toolInvocations && message.toolInvocations.length > 0),
  );
}

export function getMostRecentUserMessage(messages: Array<Message>) {
  const userMessages = messages.filter((message) => message.role === 'user');
  return userMessages.at(-1);
}

export function getDocumentTimestampByIndex(
  documents: Array<Document>,
  index: number,
) {
  if (!documents) return new Date();
  if (index > documents.length) return new Date();

  return documents[index].createdAt;
}

/**
 * Determines the file type based on the URL or file name extension
 * @param url The URL or file name to analyze
 * @returns A string representing the file type ('pdf', 'document', 'spreadsheet', 'text', etc.)
 */
export function getFileTypeFromUrl(url: string): string {
  if (!url) return 'unknown';

  const extension = url.split('.').pop()?.toLowerCase() || '';

  // Document types
  if (extension === 'pdf') return 'pdf';
  if (['doc', 'docx', 'rtf', 'odt'].includes(extension)) return 'document';

  // Spreadsheet types
  if (['csv', 'xls', 'xlsx', 'ods'].includes(extension)) return 'spreadsheet';

  // Text types
  if (['txt', 'md', 'markdown'].includes(extension)) return 'text';

  // Code types
  if (['js', 'ts', 'py', 'java', 'c', 'cpp', 'cs', 'php', 'rb', 'go', 'html', 'css', 'json', 'xml'].includes(extension)) {
    return 'code';
  }

  // Image types
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(extension)) {
    return 'image';
  }

  // Default/unknown type
  return 'unknown';
}

/**
 * Format a date to a readable string
 * @param date The date to format
 * @returns A formatted date string (e.g., "Jan 1, 2023")
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}
