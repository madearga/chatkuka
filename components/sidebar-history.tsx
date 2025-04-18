'use client';

import { isToday, isYesterday } from 'date-fns';
import Link from 'next/link';
import { useParams, usePathname, useRouter } from 'next/navigation';
import type { User } from 'next-auth';
import { memo, useEffect, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import useSWR, { useSWRConfig } from 'swr';
import { Pin, PinOff, Loader2 as LoaderIcon } from 'lucide-react';
import { togglePinChat } from '@/app/(chat)/actions';

import {
  CheckCircleFillIcon,
  GlobeIcon,
  LockIcon,
  MoreHorizontalIcon,
  ShareIcon,
  TrashIcon,
  LinkIcon,
} from '@/components/icons';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { Chat } from '@/lib/db/schema';
import { fetcher, groupChatsByDate, type GroupedChats } from '@/lib/utils';
import { useChatVisibility } from '@/hooks/use-chat-visibility';

const PureChatItem = ({
  chat,
  isActive,
  onDelete,
  setOpenMobile,
}: {
  chat: Chat;
  isActive: boolean;
  onDelete: (chatId: string) => void;
  setOpenMobile: (open: boolean) => void;
}) => {
  const { visibilityType, setVisibilityType } = useChatVisibility({
    chatId: chat.id,
    initialVisibility: chat.visibility,
  });
  const [isPinning, setIsPinning] = useState(false);
  const { mutate } = useSWRConfig();

  const handleTogglePin = useCallback(async () => {
    setIsPinning(true);
    const newPinStatus = !chat.isPinned;

    // Optimistic update
    mutate('/api/history', (currentHistory: Chat[] | undefined) => {
      if (!currentHistory) return [];
      const updatedHistory = [...currentHistory];
      const chatIndex = updatedHistory.findIndex(c => c.id === chat.id);
      if (chatIndex !== -1) {
        updatedHistory[chatIndex] = { ...updatedHistory[chatIndex], isPinned: newPinStatus };
        // Re-sort array based on new rules
        updatedHistory.sort((a, b) =>
          (b.isPinned === a.isPinned ? 0 : b.isPinned ? 1 : -1) ||
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }
      return updatedHistory;
    }, false);

    try {
      const result = await togglePinChat({ chatId: chat.id, isPinned: newPinStatus });
      if (!result.success) {
        throw new Error(result.error || 'Server action failed');
      }
      toast.success(newPinStatus ? 'Chat pinned' : 'Chat unpinned');
    } catch (error) {
      console.error('Pin toggle failed:', error);
      toast.error('Failed to update pin status');
      // Rollback by revalidating from server
      mutate('/api/history');
    } finally {
      setIsPinning(false);
    }
  }, [chat, mutate]);

  return (
    <SidebarMenuItem className="group flex items-center">
      <SidebarMenuButton
        asChild
        isActive={isActive}
        className={cn(
          'flex-grow px-2 py-1.5 h-8 text-sm hover:bg-sidebar-accent',
          isActive ? 'active-gold' : '',
        )}
      >
        <Link
          href={`/chat/${chat.id}`}
          onClick={() => setOpenMobile(false)}
          className="flex items-center gap-2"
        >
          {visibilityType === 'public' && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  onClick={(e) => e.stopPropagation()}
                  aria-label="Public chat"
                >
                  <GlobeIcon
                    size={12}
                    className="text-muted-foreground shrink-0"
                  />
                </span>
              </TooltipTrigger>
              <TooltipContent side="right" align="center">
                Public Chat
              </TooltipContent>
            </Tooltip>
          )}
          <span className="truncate text-sm">{chat.title}</span>
        </Link>
      </SidebarMenuButton>

      <Tooltip>
        <TooltipTrigger asChild>
          <SidebarMenuAction
            className="opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity h-6 w-6 p-1 relative !right-auto !top-auto mr-1 hover:bg-sidebar-accent"
            onClick={handleTogglePin}
            disabled={isPinning}
            aria-label={chat.isPinned ? "Unpin chat" : "Pin chat"}
          >
            {isPinning ? (
              <LoaderIcon size={14} className="animate-spin" />
            ) : chat.isPinned ? (
              <PinOff size={14} className="text-primary" />
            ) : (
              <Pin size={14} />
            )}
          </SidebarMenuAction>
        </TooltipTrigger>
        <TooltipContent side="right" align="center">
          {chat.isPinned ? "Unpin chat" : "Pin chat"}
        </TooltipContent>
      </Tooltip>

      <DropdownMenu modal={true}>
        <DropdownMenuTrigger asChild>
          <SidebarMenuAction
            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground mr-0.5 relative !right-auto !top-auto size-6"
            showOnHover={!isActive}
          >
            <MoreHorizontalIcon size={14} />
            <span className="sr-only">More</span>
          </SidebarMenuAction>
        </DropdownMenuTrigger>

        <DropdownMenuContent side="bottom" align="end" className="w-48 p-1">
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="cursor-pointer">
              <ShareIcon />
              <span>Share</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuItem
                  className="cursor-pointer flex-row justify-between text-sm py-1.5"
                  onClick={() => {
                    setVisibilityType('private');
                  }}
                >
                  <div className="flex flex-row gap-2 items-center">
                    <LockIcon size={12} />
                    <span>Private</span>
                  </div>
                  {visibilityType === 'private' ? (
                    <CheckCircleFillIcon />
                  ) : null}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer flex-row justify-between text-sm py-1.5"
                  onClick={() => {
                    setVisibilityType('public');
                  }}
                >
                  <div className="flex flex-row gap-2 items-center">
                    <GlobeIcon />
                    <span>Public</span>
                  </div>
                  {visibilityType === 'public' ? <CheckCircleFillIcon /> : null}
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>

          <DropdownMenuItem
            className="cursor-pointer text-sm py-1.5"
            disabled={visibilityType !== 'public'}
            onSelect={() => {
              if (visibilityType === 'public') {
                const url = `${window.location.origin}/chat/${chat.id}`;
                navigator.clipboard
                  .writeText(url)
                  .then(() => {
                    toast.success('Public link copied!');
                  })
                  .catch((err) => {
                    toast.error('Failed to copy link.');
                    console.error('Failed to copy link: ', err);
                  });
              } else {
                toast.info('Set chat to public to copy link.');
              }
            }}
          >
            <LinkIcon size={16} />
            <span>Copy Link</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            className="cursor-pointer text-destructive focus:bg-destructive/15 focus:text-destructive dark:text-red-500 text-sm py-1.5"
            onSelect={() => onDelete(chat.id)}
          >
            <TrashIcon />
            <span>Delete</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  );
};

export const ChatItem = memo(PureChatItem, (prevProps, nextProps) => {
  if (prevProps.isActive !== nextProps.isActive) return false;
  if (prevProps.chat.isPinned !== nextProps.chat.isPinned) return false;
  return true;
});

export function SidebarHistory({ user }: { user: User | undefined }) {
  const { setOpenMobile } = useSidebar();
  const { id } = useParams();
  const pathname = usePathname();
  const {
    data: history,
    isLoading,
    mutate,
  } = useSWR<Array<Chat>>(user ? '/api/history' : null, fetcher, {
    fallbackData: [],
  });

  useEffect(() => {
    mutate();
  }, [pathname, mutate]);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const router = useRouter();
  const handleDelete = async () => {
    const deletePromise = fetch(`/api/chat?id=${deleteId}`, {
      method: 'DELETE',
    });

    toast.promise(deletePromise, {
      loading: 'Deleting chat...',
      success: () => {
        mutate((history) => {
          if (history) {
            return history.filter((h) => h.id !== id);
          }
        });
        return 'Chat deleted successfully';
      },
      error: 'Failed to delete chat',
    });

    setShowDeleteDialog(false);

    if (deleteId === id) {
      router.push('/');
    }
  };

  if (!user) {
    return (
      <SidebarGroup>
        <SidebarGroupContent>
          <div className="px-2 text-zinc-500 w-full flex flex-row justify-center items-center text-sm gap-2">
            Login to save and revisit previous chats!
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  if (isLoading) {
    return (
      <SidebarGroup>
        <div className="px-2 py-1 text-xs text-sidebar-foreground/50">
          Today
        </div>
        <SidebarGroupContent>
          <div className="flex flex-col">
            {[44, 32, 28, 64, 52].map((item) => (
              <div
                key={item}
                className="rounded-md h-8 flex gap-2 px-2 items-center"
              >
                <div
                  className="h-4 rounded-md flex-1 max-w-[--skeleton-width] bg-sidebar-accent-foreground/10"
                  style={
                    {
                      '--skeleton-width': `${item}%`,
                    } as React.CSSProperties
                  }
                />
              </div>
            ))}
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  if (history?.length === 0) {
    return (
      <SidebarGroup>
        <SidebarGroupContent>
          <div className="px-2 text-zinc-500 w-full flex flex-row justify-center items-center text-sm gap-2">
            Your conversations will appear here once you start chatting!
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  return (
    <>
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            {history &&
              (() => {
                // Filter pinned and unpinned chats
                const pinnedChats = history?.filter(chat => chat.isPinned) || [];
                const unpinnedChats = history?.filter(chat => !chat.isPinned) || [];

                // Group unpinned chats by date
                const groupedChats = groupChatsByDate(unpinnedChats);

                return (
                  <>
                    {/* Pinned section */}
                    {pinnedChats.length > 0 && (
                      <>
                        <SidebarGroupLabel className="px-2 py-1 text-xs text-sidebar-foreground/50 flex items-center gap-1.5 mt-2">
                          <Pin size={12} />
                          Pinned
                        </SidebarGroupLabel>
                        {pinnedChats.map((chat) => (
                          <ChatItem
                            key={chat.id}
                            chat={chat}
                            isActive={chat.id === id}
                            onDelete={(chatId) => {
                              setDeleteId(chatId);
                              setShowDeleteDialog(true);
                            }}
                            setOpenMobile={setOpenMobile}
                          />
                        ))}
                      </>
                    )}

                    {/* Today section */}
                    {groupedChats.today.length > 0 && (
                      <>
                        <div className={cn("px-2 py-1 text-xs text-sidebar-foreground/50", pinnedChats.length > 0 && "mt-6")}>
                          Today
                        </div>
                        {groupedChats.today.map((chat) => (
                          <ChatItem
                            key={chat.id}
                            chat={chat}
                            isActive={chat.id === id}
                            onDelete={(chatId) => {
                              setDeleteId(chatId);
                              setShowDeleteDialog(true);
                            }}
                            setOpenMobile={setOpenMobile}
                          />
                        ))}
                      </>
                    )}

                    {/* Yesterday section */}
                    {groupedChats.yesterday.length > 0 && (
                      <>
                        <div className={cn("px-2 py-1 text-xs text-sidebar-foreground/50 mt-6",
                          pinnedChats.length > 0 && groupedChats.today.length === 0 && "mt-6")}>
                          Yesterday
                        </div>
                        {groupedChats.yesterday.map((chat) => (
                          <ChatItem
                            key={chat.id}
                            chat={chat}
                            isActive={chat.id === id}
                            onDelete={(chatId) => {
                              setDeleteId(chatId);
                              setShowDeleteDialog(true);
                            }}
                            setOpenMobile={setOpenMobile}
                          />
                        ))}
                      </>
                    )}

                    {/* Last 7 days section */}
                    {groupedChats.lastWeek.length > 0 && (
                      <>
                        <div className="px-2 py-1 text-xs text-sidebar-foreground/50 mt-6">
                          Last 7 days
                        </div>
                        {groupedChats.lastWeek.map((chat) => (
                          <ChatItem
                            key={chat.id}
                            chat={chat}
                            isActive={chat.id === id}
                            onDelete={(chatId) => {
                              setDeleteId(chatId);
                              setShowDeleteDialog(true);
                            }}
                            setOpenMobile={setOpenMobile}
                          />
                        ))}
                      </>
                    )}

                    {/* Last 30 days section */}
                    {groupedChats.lastMonth.length > 0 && (
                      <>
                        <div className="px-2 py-1 text-xs text-sidebar-foreground/50 mt-6">
                          Last 30 days
                        </div>
                        {groupedChats.lastMonth.map((chat) => (
                          <ChatItem
                            key={chat.id}
                            chat={chat}
                            isActive={chat.id === id}
                            onDelete={(chatId) => {
                              setDeleteId(chatId);
                              setShowDeleteDialog(true);
                            }}
                            setOpenMobile={setOpenMobile}
                          />
                        ))}
                      </>
                    )}

                    {/* Older section */}
                    {groupedChats.older.length > 0 && (
                      <>
                        <div className="px-2 py-1 text-xs text-sidebar-foreground/50 mt-6">
                          Older
                        </div>
                        {groupedChats.older.map((chat) => (
                          <ChatItem
                            key={chat.id}
                            chat={chat}
                            isActive={chat.id === id}
                            onDelete={(chatId) => {
                              setDeleteId(chatId);
                              setShowDeleteDialog(true);
                            }}
                            setOpenMobile={setOpenMobile}
                          />
                        ))}
                      </>
                    )}
                  </>
                );
              })()}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your
              chat and remove it from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
