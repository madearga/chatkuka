'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { SearchIcon, XIcon } from 'lucide-react';
import { useDebounceValue } from '@/lib/hooks/use-debounce-value';
import useSWR from 'swr';
import { fetcher, type GroupedChats } from '@/lib/utils';
import type { Chat } from '@/lib/db/schema';

// Extended Chat type with preview property
type ChatWithPreview = Chat & {
  preview?: string;
  role?: string;
};

// Extended GroupedChats type with ChatWithPreview
type GroupedChatsWithPreview = {
  today: ChatWithPreview[];
  yesterday: ChatWithPreview[];
  lastWeek: ChatWithPreview[];
  lastMonth: ChatWithPreview[];
  older: ChatWithPreview[];
};

export function SimpleSearch({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounceValue(searchQuery, 300);

  // Fetch search results when query is present
  const { data: searchResults, isLoading } = useSWR<GroupedChatsWithPreview>(
    debouncedSearchQuery ? `/api/search?q=${encodeURIComponent(debouncedSearchQuery)}` : null,
    fetcher
  );

  // Reset search when dialog closes
  useEffect(() => {
    if (!open) {
      setSearchQuery('');
    }
  }, [open]);

  // Debug logs
  useEffect(() => {
    console.log('Search query:', searchQuery);
    console.log('Debounced search query:', debouncedSearchQuery);
    if (searchResults) {
      console.log('Search results:', searchResults);
    }
  }, [searchQuery, debouncedSearchQuery, searchResults]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-4 gap-4 max-w-screen-sm overflow-hidden">
        <div className="flex items-center border-b pb-2">
          <SearchIcon className="mr-2 size-4 shrink-0 opacity-50" />
          <Input
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => {
              console.log('Input changed:', e.target.value);
              setSearchQuery(e.target.value);
            }}
            className="border-none shadow-none focus-visible:ring-0"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="size-6 rounded-full flex items-center justify-center text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            >
              <XIcon className="size-4" />
            </button>
          )}
        </div>

        <div className="max-h-[400px] overflow-y-auto">
          {isLoading && <div className="py-6 text-center">Loading...</div>}

          {!isLoading && debouncedSearchQuery && (!searchResults || Object.values(searchResults).every((group: any) => group.length === 0)) && (
            <div className="py-6 text-center">
              No chats found for &quot;{debouncedSearchQuery}&quot;
            </div>
          )}

          {!isLoading && searchResults && (
            <div>
              {Object.entries(searchResults).map(([date, chats]) => (
                chats.length > 0 && (
                  <div key={date} className="mb-4">
                    <h3 className="text-sm font-medium mb-2">{date}</h3>
                    <div className="space-y-2">
                      {chats.map((chat) => (
                        <div
                          key={chat.id}
                          className="p-2 rounded-md hover:bg-accent cursor-pointer"
                          onClick={() => {
                            onOpenChange(false);
                            window.location.href = `/chat/${chat.id}`;
                          }}
                        >
                          <div className="font-medium">{chat.title}</div>
                          {chat.preview && <div className="text-sm text-muted-foreground">{chat.preview}</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
