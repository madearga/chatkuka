import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';

import { auth } from '@/app/(auth)/auth';
import { Chat } from '@/components/chat';
import { getChatById, getMessagesByChatId } from '@/lib/db/queries';
import { convertToUIMessages } from '@/lib/utils';
import { DataStreamHandler } from '@/components/data-stream-handler';
import { DEFAULT_CHAT_MODEL } from '@/lib/ai/models';

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { id } = params;
  const chat = await getChatById({ id });

  if (!chat) {
    notFound();
  }

  const session = await auth();

  let canView = false;
  let isOwner = false;

  if (chat.visibility === 'public') {
    canView = true; // Chat publik bisa dilihat siapa saja
    if (session?.user?.id === chat.userId) {
      isOwner = true; // Jika ada sesi dan dia pemiliknya
    }
  } else {
    // chat.visibility === 'private'
    if (session?.user?.id === chat.userId) {
      canView = true; // Hanya pemilik yang bisa lihat chat private
      isOwner = true;
    }
  }

  if (!canView) {
    // Jika tidak bisa lihat (private & bukan pemilik/tidak login),
    // tampilkan notFound
    return notFound();
  }

  // Jika bisa lihat, lanjutkan ke rendering
  // Variabel 'isOwner' menentukan apakah chat read-only atau tidak
  const isReadonly = !isOwner;

  const messagesFromDb = await getMessagesByChatId({
    id,
  });

  const cookieStore = await cookies();
  const chatModelFromCookie = cookieStore.get('chat-model');

  if (!chatModelFromCookie) {
    return (
      <>
        <Chat
          id={chat.id}
          initialMessages={convertToUIMessages(messagesFromDb)}
          selectedChatModel={DEFAULT_CHAT_MODEL}
          selectedVisibilityType={chat.visibility}
          isReadonly={isReadonly}
        />
        <DataStreamHandler id={id} />
      </>
    );
  }

  return (
    <>
      <Chat
        id={chat.id}
        initialMessages={convertToUIMessages(messagesFromDb)}
        selectedChatModel={chatModelFromCookie.value}
        selectedVisibilityType={chat.visibility}
        isReadonly={isReadonly}
      />
      <DataStreamHandler id={id} />
    </>
  );
}
