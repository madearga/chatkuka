import type {
  CoreAssistantMessage,
  CoreToolMessage,
  Message,
  TextStreamPart,
  ToolInvocation,
  ToolSet,
} from 'ai';
import { type ClassValue, clsx } from 'clsx';
import {
  isToday,
  isYesterday,
  subWeeks,
  subMonths,
  differenceInCalendarDays,
  format,
} from 'date-fns';
import { twMerge } from 'tailwind-merge';

import type { Message as DBMessage, Document, Chat } from '@/lib/db/schema';
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
      content:
        (dbMessage.parts as ExpectedPart[] | undefined)?.find(
          (p: ExpectedPart) => p.type === 'text',
        )?.text ?? '',
      experimental_attachments: dbMessage.attachments as any, // Map attachments
    };

    if (dbMessage.createdAt) {
      (uiMessage as any).createdAt = new Date(dbMessage.createdAt);
    }

    return uiMessage;
  });
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
  if (
    [
      'js',
      'ts',
      'py',
      'java',
      'c',
      'cpp',
      'cs',
      'php',
      'rb',
      'go',
      'html',
      'css',
      'json',
      'xml',
    ].includes(extension)
  ) {
    return 'code';
  }

  // Image types
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(extension)) {
    return 'image';
  }

  // Default/unknown type
  return 'unknown';
}

export type GroupedChats = {
  today: Chat[];
  yesterday: Chat[];
  lastWeek: Chat[];
  lastMonth: Chat[];
  older: Chat[];
};

/**
 * Group chats by date
 *
 * @param chats - The chats to group
 * @returns The grouped chats
 */
export function groupChatsByDate(chats: Chat[]): GroupedChats {
  // Initialize empty groups
  const groups: GroupedChats = {
    today: [],
    yesterday: [],
    lastWeek: [],
    lastMonth: [],
    older: [],
  };

  // If chats is undefined or not an array, return empty groups
  if (!chats || !Array.isArray(chats)) {
    console.warn('groupChatsByDate received invalid chats:', chats);
    return groups;
  }

  const now = new Date();
  const oneWeekAgo = subWeeks(now, 1);
  const oneMonthAgo = subMonths(now, 1);

  return chats.reduce(
    (acc, chat) => {
      try {
        // Ensure createdAt exists and is valid
        if (!chat.createdAt) {
          console.warn('Chat missing createdAt:', chat);
          return acc;
        }

        // Ensure createdAt is treated as a Date object
        const chatDate = new Date(chat.createdAt);

        // Check if date is valid
        if (isNaN(chatDate.getTime())) {
          console.warn('Invalid chat date:', chat.createdAt);
          return acc;
        }

        if (isToday(chatDate)) {
          acc.today.push(chat);
        } else if (isYesterday(chatDate)) {
          acc.yesterday.push(chat);
        } else if (chatDate > oneWeekAgo) {
          acc.lastWeek.push(chat);
        } else if (chatDate > oneMonthAgo) {
          acc.lastMonth.push(chat);
        } else {
          acc.older.push(chat);
        }
      } catch (error) {
        console.error('Error processing chat in groupChatsByDate:', error, chat);
      }

      return acc;
    },
    groups
  );
}

/**
 * Format a date string to a human-readable format
 *
 * @param createdAtInput - The date string or Date object to format
 * @returns The formatted date string
 */
export function formatDate(createdAtInput: string | Date): string {
  const created =
    typeof createdAtInput === 'string'
      ? new Date(createdAtInput)
      : createdAtInput;
  // Validate the date object before formatting
  if (isNaN(created.getTime())) {
    // console.warn("Invalid date passed to formatDate:", createdAtInput); // Keep logging minimal
    return 'Invalid Date';
  }
  try {
    if (isToday(created)) {
      return format(created, 'p'); // e.g., 4:30 PM
    } else if (differenceInCalendarDays(new Date(), created) === 1) {
      return 'Yesterday';
    } else {
      return format(created, 'P'); // e.g., 10/07/2024
    }
  } catch (error) {
    // console.error("Error formatting date:", error, "Input:", createdAtInput); // Keep logging minimal
    return 'Date Error';
  }
}
