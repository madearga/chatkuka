'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDebounceValue } from '@/lib/hooks/use-debounce-value';
import useSWR from 'swr';
import { Command as CommandPrimitive } from 'cmdk';
import {
  CircleIcon,
  FileIcon,
  LaptopIcon,
  MoonIcon,
  SunIcon,
  PlusIcon,
  SearchIcon,
  XIcon,
} from 'lucide-react';

import { cn, fetcher, formatDate, type GroupedChats, groupChatsByDate } from '@/lib/utils';
import { useArtifact } from '@/hooks/use-artifact';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import type { Chat } from '@/lib/db/schema';

// Skeleton lengths for loading state
const SKELETON_LENGTHS = [60, 45, 80, 30, 55, 40, 70, 50];

// Search skeleton component
function SearchSkeleton() {
  return (
    <div className="space-y-3 mt-2">
      {SKELETON_LENGTHS.map((width, i) => (
        <div key={i} className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 rounded" style={{ width: `${width}%` }} />
        </div>
      ))}
    </div>
  );
}

// Order of groups for display
const ORDERED_GROUP_KEYS = [
  'today',
  'yesterday',
  'lastWeek',
  'lastMonth',
  'older',
] as const;

// Get human-readable label for each group
function getGroupLabel(key: keyof GroupedChats): string {
  const labels: Record<keyof GroupedChats, string> = {
    today: 'Today',
    yesterday: 'Yesterday',
    lastWeek: 'Last 7 days',
    lastMonth: 'Last 30 days',
    older: 'Older',
  };
  return labels[key];
}

// Props for the ChatGroups component
type ChatGroupsProps = {
  groupedChats: GroupedChats;
  onSelect: (chat: Chat) => void;
  searchQuery?: string;
  showNewChat?: boolean;
};

// Pure component for rendering chat groups
const PureChatGroups = ({
  groupedChats,
  onSelect,
  searchQuery,
  showNewChat = false,
}: ChatGroupsProps) => {
  return (
    <>
      {showNewChat && (
        <CommandGroup heading="New">
          <CommandItem
            key="new-chat"
            onSelect={() => onSelect({ id: 'new' } as Chat)}
            className="flex items-center gap-2"
          >
            <PlusIcon className="h-4 w-4" />
            <span>New Chat</span>
          </CommandItem>
        </CommandGroup>
      )}

      {ORDERED_GROUP_KEYS.map((key) => {
        const chats = groupedChats[key];
        if (chats.length === 0) return null;

        return (
          <CommandGroup key={key} heading={getGroupLabel(key)}>
            {chats.map((chat) => (
              <CommandItem
                key={chat.id}
                onSelect={() => onSelect(chat)}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-2 truncate">
                  <FileIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{chat.title || 'Untitled'}</span>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  {formatDate(chat.createdAt)}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        );
      })}
    </>
  );
};

// Memoized version of ChatGroups
const ChatGroups = React.memo(PureChatGroups);

// Common SWR config
const COMMON_SWR_CONFIG = {
  revalidateOnFocus: false,
  dedupingInterval: 10000, // 10 seconds
};

// View states for the search dialog
enum ViewState {
  LOADING,
  EMPTY,
  SEARCH_RESULTS,
  HISTORY,
}

// Props for the ChatSearch component
type ChatSearchProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ChatSearch({ open, onOpenChange }: ChatSearchProps) {
  const router = useRouter();
  const { setArtifact } = useArtifact();
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounceValue(searchQuery, 300);

  // Debug log
  useEffect(() => {
    console.log('Search query:', searchQuery);
    console.log('Debounced search query:', debouncedSearchQuery);
  }, [searchQuery, debouncedSearchQuery]);

  // Fetch search results when query is present
  const { data: searchResults, isLoading: isSearchLoading } =
    useSWR<GroupedChats>(
      debouncedSearchQuery
        ? `/api/search?q=${encodeURIComponent(debouncedSearchQuery)}`
        : null,
      fetcher,
      COMMON_SWR_CONFIG,
    );

  // Fetch chat history when no search query
  const { data: chatHistory, isLoading: isHistoryLoading } = useSWR<Chat[]>(
    !debouncedSearchQuery && open ? '/api/history' : null,
    fetcher,
    COMMON_SWR_CONFIG,
  );

  // Group chat history by date
  const groupedHistory = useMemo(() => {
    if (!chatHistory)
      return {
        today: [],
        yesterday: [],
        lastWeek: [],
        lastMonth: [],
        older: [],
      };

    // Use the groupChatsByDate function from utils
    return groupChatsByDate(chatHistory);
  }, [chatHistory]);

  // Determine current view state
  const viewState = useMemo((): ViewState => {
    if (debouncedSearchQuery) {
      if (isSearchLoading) return ViewState.LOADING;
      if (
        !searchResults ||
        Object.values(searchResults).every((group) => group.length === 0)
      ) {
        return ViewState.EMPTY;
      }
      return ViewState.SEARCH_RESULTS;
    } else {
      if (isHistoryLoading) return ViewState.LOADING;
      return ViewState.HISTORY;
    }
  }, [debouncedSearchQuery, isSearchLoading, isHistoryLoading, searchResults]);

  // Handle item selection
  const handleItemSelect = useCallback(
    (chat: Chat) => {
      onOpenChange(false);

      // Close artifact pane when navigating
      setArtifact((currentArtifact) => ({
        ...currentArtifact,
        isVisible: false
      }));

      if (chat.id === 'new') {
        router.push('/');
      } else {
        router.push(`/chat/${chat.id}`);
      }
    },
    [onOpenChange, router, setArtifact],
  );

  // Handle search input change
  const handleSearchInputChange = useCallback((value: string) => {
    console.log('handleSearchInputChange called with:', value);
    setSearchQuery(value);
  }, []);

  // Reset search when dialog closes
  useEffect(() => {
    if (!open) {
      setSearchQuery('');
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 gap-0 max-w-screen-sm overflow-hidden">
        <Command className="rounded-lg border shadow-md">
          <div className="flex items-center border-b px-3">
            <SearchIcon className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <CommandInput
              placeholder="Search chats..."
              className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              value={searchQuery}
              onValueChange={handleSearchInputChange}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="h-6 w-6 rounded-full flex items-center justify-center text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              >
                <XIcon className="h-4 w-4" />
              </button>
            )}
          </div>
          <CommandList className="max-h-[400px] overflow-y-auto overflow-x-hidden">
            {viewState === ViewState.LOADING && <SearchSkeleton />}

            {viewState === ViewState.EMPTY && (
              <CommandEmpty className="py-6 text-center text-sm">
                No chats found for &quot;{debouncedSearchQuery}&quot;
              </CommandEmpty>
            )}

            {viewState === ViewState.SEARCH_RESULTS && searchResults && (
              <ChatGroups
                groupedChats={searchResults}
                onSelect={handleItemSelect}
                searchQuery={debouncedSearchQuery}
              />
            )}

            {viewState === ViewState.HISTORY && (
              <ChatGroups
                groupedChats={groupedHistory}
                onSelect={handleItemSelect}
                showNewChat
              />
            )}
          </CommandList>

          <div className="flex items-center justify-between p-2 border-t">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                  <span className="text-xs">
                    {navigator?.userAgent?.toLowerCase().includes('mac')
                      ? '⌘'
                      : 'Ctrl'}
                  </span>
                  K
                </kbd>
              </span>
              <span>to search</span>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                  <span className="text-xs">↑↓</span>
                </kbd>
              </span>
              <span>to navigate</span>

              <span>
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                  <span className="text-xs">Enter</span>
                </kbd>
              </span>
              <span>to select</span>

              <span>
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                  <span className="text-xs">Esc</span>
                </kbd>
              </span>
              <span>to close</span>
            </div>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
