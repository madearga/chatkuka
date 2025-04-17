'use server';

import { generateText, Message } from 'ai';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import {
  deleteMessagesByChatIdAfterTimestamp,
  getMessageById,
  updateChatVisiblityById,
  updateChatPinnedStatus,
  getChatById,
} from '@/lib/db/queries';
import { VisibilityType } from '@/components/visibility-selector';
import { myProvider } from '@/lib/ai/models';
import { auth } from '@/app/(auth)/auth';

export async function saveChatModelAsCookie(model: string) {
  const cookieStore = await cookies();
  cookieStore.set('chat-model', model);
}

export async function generateTitleFromUserMessage({
  message,
}: {
  message: Message;
}) {
  const { text: title } = await generateText({
    model: myProvider.languageModel('title-model'),
    system: `\n
    - you will generate a short title based on the first message a user begins a conversation with
    - ensure it is not more than 80 characters long
    - the title should be a summary of the user's message
    - do not use quotes or colons`,
    prompt: JSON.stringify(message),
  });

  return title;
}

export async function deleteTrailingMessages({ id }: { id: string }) {
  const message = await getMessageById({ id });

  if (!message) {
    console.error(
      `Message with id ${id} not found for deleting trailing messages.`,
    );
    return;
  }

  await deleteMessagesByChatIdAfterTimestamp({
    chatId: message.chatId,
    timestamp: message.createdAt,
  });
}

export async function updateChatVisibility({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: VisibilityType;
}) {
  await updateChatVisiblityById({ chatId, visibility });
}

const togglePinSchema = z.object({
  chatId: z.string().uuid('Invalid Chat ID format'),
  isPinned: z.boolean(),
});

export async function togglePinChat({
  chatId,
  isPinned,
}: {
  chatId: string;
  isPinned: boolean;
}) {
  // Authentication check
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: User not logged in.');
  }

  // Input validation
  const validation = togglePinSchema.safeParse({ chatId, isPinned });
  if (!validation.success) {
    console.error('Invalid input for togglePinChat:', validation.error.flatten());
    throw new Error('Invalid input data provided.');
  }

  // Ownership check
  const chatData = await getChatById({ id: validation.data.chatId });
  if (!chatData) {
    throw new Error('Chat not found.');
  }
  if (chatData.userId !== session.user.id) {
    throw new Error('Permission denied: You do not own this chat.');
  }

  try {
    // Update pin status
    await updateChatPinnedStatus({
      chatId: validation.data.chatId,
      isPinned: validation.data.isPinned,
    });

    // Revalidate paths
    revalidatePath('/api/history');
    revalidatePath('/');
    revalidatePath('/chat/[id]', 'layout');

    return { success: true };
  } catch (error) {
    console.error('Failed to toggle pin status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to toggle pin status',
    };
  }
}
