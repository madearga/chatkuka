Okay, here is the extremely detailed, step-by-step Markdown checklist designed for a competent AI Coding Agent to implement the chat search feature from the provided diff into your `chatkuka` codebase. This checklist assumes the agent understands the context of the `chatkuka` project based on the previous analysis and adheres strictly to the constraints.

**Constraints Checklist (For the AI Agent):**

*   [x] **DO NOT** modify existing functionality unrelated to the search feature unless explicitly instructed for integration.
*   [x] **DO NOT** introduce significant stylistic changes. Apply new styles only as defined in the diff or required by new components (`cmdk`, `Dialog`). Use `cn` for class merging.
*   [x] **DO NOT** perform any `git` operations (commit, push, etc.).
*   [x] **DO** use `bun` for package management if required (`bun add cmdk`).

---

### **Project Checklist: Implement Chat Search Feature (Diff #857)**

**Goal:** Integrate the chat search functionality as described in the provided diff, allowing users to search their chat history via a command palette interface, triggered by a header button or keyboard shortcut.

---

**Story 1: Implement Backend API Endpoint for Search**

*   **Goal:** Create the `/api/search` route handler to process search requests and return formatted results.
*   **Target File:** `app/(chat)/api/search/route.ts` (New File)

*   **Tasks:**
    *   [x] Create the directory `app/(chat)/api/search/`.
    *   [x] Create the file `app/(chat)/api/search/route.ts`.
    *   [x] Add the following imports at the top of `route.ts`:
        ```typescript
        import { auth } from "@/app/(auth)/auth";
        import { searchChatsByUserId } from "@/lib/db/queries";
        import { groupChatsByDate, formatDate } from "@/lib/utils"; // Ensure formatDate is imported
        import { NextResponse } from 'next/server'; // Import NextResponse
        ```
    *   [x] Implement the `transformSearchResults` function *exactly* as defined below:
        ```typescript
        function transformSearchResults(searchResults: any[], query: string) {
          // Implementation from diff... (Copy the exact function body here)
          return searchResults.map((result) => {
            let preview = result.preview;
            let contextPreview = "";

            try {
              // NOTE: user messages stored in our DB are plain string & tool call results are stored as JSON.
              // TODO: As tool call results have different schemas in the DB, we only show no preview available for now
              if (result.role !== "user") {
                preview = "No preview available";

                // LLM responses are stored under the "text" key
                if (result.role === "assistant") {
                  // Attempt to parse JSON safely
                  try {
                    const previewData = JSON.parse(result.preview);
                    if (Array.isArray(previewData) && previewData[0] && previewData[0].text) {
                       preview = previewData[0].text;
                    } else if (typeof previewData === 'object' && previewData !== null && previewData.text) {
                       // Handle cases where it might be a single object, not an array
                       preview = previewData.text;
                    }
                  } catch (jsonError) {
                    // If parsing fails, keep "No preview available"
                    // console.warn("Could not parse preview JSON:", jsonError);
                  }
                }
              }

              // Generate a context preview with 50 characters before and after the query match
              if (preview && preview !== "No preview available") { // Added check for null/undefined preview
                const sanitizedQuery = query.toLowerCase();
                const lowerPreview = preview.toLowerCase();
                const matchIndex = lowerPreview.indexOf(sanitizedQuery);

                // Calculate start and end indices for the context window
                if (matchIndex !== -1) {
                  const startIndex = Math.max(0, matchIndex - 50);
                  const endIndex = Math.min(
                    preview.length,
                    matchIndex + sanitizedQuery.length + 50
                  );

                  contextPreview = preview.substring(startIndex, endIndex);

                  // Add ellipsis if we're not showing from the beginning or to the end
                  if (startIndex > 0) {
                    contextPreview = "..." + contextPreview;
                  }
                  if (endIndex < preview.length) {
                    contextPreview += "...";
                  }
                  preview = contextPreview;
                } else {
                  // If for some reason the query isn't found in the preview, fallback to showing the first part
                  preview =
                    preview?.length > 100 ? preview?.slice(0, 100) + "..." : preview;
                }
              }
            } catch (e: any) {
              // console.error("Error transforming search result preview:", e); // Keep console logging minimal for AI
              preview = "No preview available";
            }

            return {
              id: result.id,
              title: result.title || "Untitled",
              preview: preview || "No preview available", // Ensure preview is never null/undefined
              createdAt: new Date(result.createdAt), // Ensure it's a Date object
              role: result.role,
              userId: result.userId,
              visibility: result.visibility,
            };
          });
        }
        ```
    *   [x] Implement the `GET` export function *exactly* as defined below:
        ```typescript
        export async function GET(request: Request) {
          const session = await auth();

          if (!session || !session.user || !session.user.id) {
            // console.log("API Search: Unauthorized access attempt."); // Keep logging minimal
            return Response.json({ error: "Unauthorized!" }, { status: 401 });
          }

          const { searchParams } = new URL(request.url);
          const query = searchParams.get("q")?.trim?.();

          if (!query) {
            // console.log("API Search: Missing query parameter."); // Keep logging minimal
            return Response.json(
              { error: "Search query is required" },
              { status: 400 }
            );
          }

          // console.log(`API Search: User ${session.user.id} searching for "${query}"`); // Keep logging minimal

          try {
            const searchResults = await searchChatsByUserId({
              userId: session.user.id,
              query,
            });
            // console.log(`API Search: Found ${searchResults.length} raw results.`); // Keep logging minimal

            const transformedResults = transformSearchResults(searchResults, query);
            const groupedResults = groupChatsByDate(transformedResults);
            // console.log(`API Search: Returning grouped results.`); // Keep logging minimal

            return Response.json(groupedResults);
          } catch (error) {
              // console.error("API Search: Error during search execution:", error); // Keep logging minimal
              return Response.json({ error: "Failed to execute search" }, { status: 500 });
          }
        }
        ```

---

**Story 2: Implement Database Query for Chat Search**

*   **Goal:** Add the `searchChatsByUserId` function to `lib/db/queries.ts` to fetch relevant chats and messages based on a query.
*   **Target File:** `lib/db/queries.ts` (Modify Existing File)

*   **Tasks:**
    *   [x] Open the file `lib/db/queries.ts`.
    *   [x] Add the following imports from `drizzle-orm` if they are not already present: `ilike`, `or`, `sql`. Ensure `and`, `asc`, `desc`, `eq` are also imported.
        ```typescript
        import { /* existing imports */ ilike, or, sql } from 'drizzle-orm';
        ```
    *   [x] Add the import for the `message` table from the schema file if not present:
        ```typescript
        import { /* existing imports */ message } from './schema';
        ```
    *   [x] Add the `searchChatsByUserId` function *exactly* as defined below:
        ```typescript
        export async function searchChatsByUserId({
          userId,
          query,
        }: {
          userId: string;
          query: string;
        }) {
          try {
            // Ignore any leading or trailing whitespace
            const sanitizedQuery = `%${query.trim()}%`;

            // <critical>
            //   The following query uses `message.content::text ILIKE ...`.
            //   The database schema likely uses a JSONB column named `parts` instead of `content` now.
            //   This query *might fail* or return incorrect results on the current schema.
            //   For this automated task, implement the query *exactly* as written below.
            //   However, *manual review and adjustment* might be needed later to correctly query the text within the `parts` JSON structure (e.g., using JSON operators like `->>`).
            // </critical>
            const searchResults = await db
              .select({
                id: chat.id,
                title: chat.title,
                createdAt: chat.createdAt,
                userId: chat.userId,
                visibility: chat.visibility, // Include visibility
                // For the preview, take the newest matching message content
                preview: sql<string>`(
                      array_agg(${message.parts}::text order by ${message.createdAt} desc)
                    )[1]`, // Try targeting 'parts' first as per the latest schema
                role: sql<string>`(
                  array_agg(${message.role} order by ${message.createdAt} desc)
                )[1]`,
              })
              .from(chat)
              .leftJoin(message, eq(chat.id, message.chatId))
              .where(
                and(
                  eq(chat.userId, userId),
                  or(
                    ilike(chat.title, sanitizedQuery),
                    // Attempt to query the text part within the JSONB structure
                    // This assumes a structure like [{"type": "text", "text": "..."}]
                    // Adjust path '0.text' if your structure differs. Requires appropriate indexing on parts->'0'->>'text' for performance.
                    sql`(${message.parts}->'0'->>'text') ILIKE ${sanitizedQuery}`
                  )
                )
              )
              .groupBy(chat.id, chat.title, chat.createdAt, chat.visibility) // Add visibility to GROUP BY
              .orderBy(desc(chat.createdAt));

            // console.log(`DB Search: Found ${searchResults.length} results for query "${query}"`); // Keep logging minimal
            return searchResults;
          } catch (error) {
            // console.error(`DB Search: Error searching chats for user ${userId}, query "${query}":`, error); // Keep logging minimal
            throw error; // Re-throw the error to be handled by the API route
          }
        }
        ```

---

**Story 3: Implement/Centralize Utility Functions**

*   **Goal:** Ensure `groupChatsByDate` and `formatDate` functions are available in `lib/utils.ts`.
*   **Target File:** `lib/utils.ts` (Modify Existing File)
*   **Target File:** `components/sidebar-history.tsx` (Verify Removal)

*   **Tasks:**
    *   [x] Open `lib/utils.ts`.
    *   [x] Add the following imports from `date-fns` if not present:
        ```typescript
        import {
          isToday,
          isYesterday,
          subWeeks,
          subMonths,
          differenceInCalendarDays,
          format,
        } from 'date-fns';
        ```
    *   [x] Add the `Chat` type import from `@/lib/db/schema` if not present:
        ```typescript
        import type { Chat } from '@/lib/db/schema';
        ```
    *   [x] Define the `GroupedChats` type alias if it doesn't exist:
        ```typescript
        export type GroupedChats = {
          today: Chat[];
          yesterday: Chat[];
          lastWeek: Chat[];
          lastMonth: Chat[];
          older: Chat[];
        };
        ```
    *   [x] Add or verify the existence of the `groupChatsByDate` function *exactly* as defined below:
        ```typescript
        /**
         * Group chats by date
         *
         * @param chats - The chats to group
         * @returns The grouped chats
         */
        export function groupChatsByDate(chats: Chat[]): GroupedChats {
          // Implementation from diff... (Copy the exact function body here)
          const now = new Date();
          const oneWeekAgo = subWeeks(now, 1);
          const oneMonthAgo = subMonths(now, 1);

          return chats.reduce(
            (groups, chat) => {
              // Ensure createdAt is treated as a Date object
              const chatDate = new Date(chat.createdAt);

              if (isToday(chatDate)) {
                groups.today.push(chat);
              } else if (isYesterday(chatDate)) {
                groups.yesterday.push(chat);
              } else if (chatDate > oneWeekAgo) {
                groups.lastWeek.push(chat);
              } else if (chatDate > oneMonthAgo) {
                groups.lastMonth.push(chat);
              } else {
                groups.older.push(chat);
              }

              return groups;
            },
            {
              today: [],
              yesterday: [],
              lastWeek: [],
              lastMonth: [],
              older: [],
            } as GroupedChats
          );
        }
        ```
    *   [x] Add or verify the existence of the `formatDate` function *exactly* as defined below:
        ```typescript
        /**
         * Format a date string to a human-readable format
         *
         * @param createdAtInput - The date string or Date object to format
         * @returns The formatted date string
         */
        export function formatDate(createdAtInput: string | Date): string {
          const created = typeof createdAtInput === 'string' ? new Date(createdAtInput) : createdAtInput;
          // Validate the date object before formatting
          if (isNaN(created.getTime())) {
            // console.warn("Invalid date passed to formatDate:", createdAtInput); // Keep logging minimal
            return "Invalid Date";
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
              return "Date Error";
          }
        }
        ```
    *   [x] **Verify and Remove:** Open `components/sidebar-history.tsx`. Carefully check if there's a local implementation of `groupChatsByDate`. If found, **delete** that local implementation entirely. Ensure the component now *imports* and *uses* the `groupChatsByDate` function from `lib/utils.ts`.
    *   [x] **Verify and Remove:** Search the entire codebase for any remaining usages of `addToolMessageToChat` and `sanitizeResponseMessages`. If found, refactor the code to no longer use them (as they are deprecated by the newer AI SDK patterns). Once confirmed they are unused, **delete** these two functions from `lib/utils.ts`.

---

**Story 4: Integrate Search Trigger into Chat Header**

*   **Goal:** Add the search button and its functionality to the chat header UI.
*   **Target File:** `components/chat-header.tsx` (Modify Existing File)

*   **Tasks:**
    *   [x] Open `components/chat-header.tsx`.
    *   [x] Add `Search` to the imports from `lucide-react`.
    *   [x] Add the `setIsSearchOpen` prop to the component's props interface:
        ```typescript
        // Near the top of the file
        import { Search } from 'lucide-react';
        import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip'; // Add Tooltip imports

        // ... other imports ...

        function PureChatHeader({
          // ... existing props ...
          setIsSearchOpen, // Add this line
        }: {
          // ... existing prop types ...
          setIsSearchOpen: (open: boolean) => void; // Add this line
        }) {
          // ... component logic ...
        }
        ```
    *   [x] Locate the `div` containing the right-side action buttons (like "New Chat").
    *   [x] Add the following Tooltip and Button structure *before* or *after* the "New Chat" button, adjusting layout classes if needed (the diff places it before `ModelSelector`, which might need adjustment depending on your current layout):
        ```typescript
            {/* Search Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  className="md:px-2 px-2 h-8 sm:h-9 flex-shrink-0 hover:bg-accent" // Adjusted classes based on New Chat button
                  onClick={() => setIsSearchOpen(true)}
                  aria-label="Search"
                >
                  <Search size={16} /> {/* Ensure consistent icon size */}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Search ({navigator?.userAgent?.toLowerCase().includes("mac") ? "⌘" : "Ctrl"} + K)
              </TooltipContent>
            </Tooltip>

            {/* Existing New Chat Button */}
            {/* ... */}

            {/* Existing Visibility Selector */}
            {/* ... */}
        ```
    *   [x] Ensure the parent `div` uses `flex` and appropriate `gap` for spacing.

---

**Story 5: Integrate Search Dialog into Chat Page**

*   **Goal:** Add the state and logic to show/hide the search dialog on the main chat page and handle keyboard shortcuts.
*   **Target File:** `components/chat.tsx` (Modify Existing File)

*   **Tasks:**
    *   [ ] Open `components/chat.tsx`.
    *   [ ] Add imports:
        ```typescript
        import { useEffect, useState } from 'react'; // Ensure useEffect, useState are imported
        import { ChatSearch } from '@/components/chat-search'; // Import the new component
        ```
    *   [ ] Inside the `Chat` component function, add the state for the dialog:
        ```typescript
        const [isSearchOpen, setIsSearchOpen] = useState(false);
        ```
    *   [ ] Add the `useEffect` hook for the keyboard shortcut *exactly* as defined below:
        ```typescript
        // Open search modal on CMD + k or CTRL + k
        useEffect(() => {
          const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              setIsSearchOpen((prevState) => !prevState);
            }
          };

          document.addEventListener('keydown', handleKeyDown);
          return () => document.removeEventListener('keydown', handleKeyDown);
        }, []); // Empty dependency array ensures this runs once on mount
        ```
    *   [ ] In the `ChatHeader` component usage, pass the `setIsSearchOpen` function:
        ```typescript
        <ChatHeader
          // ... other props ...
          setIsSearchOpen={setIsSearchOpen} // Add this prop
        />
        ```
    *   [ ] At the end of the main `return` statement for the `Chat` component (e.g., after the `<Artifact />` component), add the conditional rendering for `ChatSearch`:
        ```typescript
          {/* ... existing closing tags ... */}
          <Artifact /* ... existing props ... */ />

          {/* Add the Search Dialog */}
          {isSearchOpen ? (
            <ChatSearch open={isSearchOpen} onOpenChange={setIsSearchOpen} />
          ) : null}
        </>
      );
    }
        ```

---

**Story 6: Implement the Search Dialog UI Component**

*   **Goal:** Create the reusable `ChatSearch` component that displays the command palette interface.
*   **Target File:** `components/chat-search.tsx` (New File)

*   **Tasks:**
    *   [ ] Create the file `components/chat-search.tsx`.
    *   [ ] Add all necessary imports (React hooks, Command/Dialog components, icons, SWR, usehooks-ts, router, utils, Skeleton, types, useArtifact). *Copy the full import block from the diff.*
    *   [ ] Define the `SKELETON_LENGTHS` constant array.
    *   [ ] Implement the `SearchSkeleton` component *exactly* as in the diff.
    *   [ ] Define the `ORDERED_GROUP_KEYS` constant array.
    *   [ ] Implement the `getGroupLabel` function.
    *   [ ] Define the `ChatGroupsProps` type.
    *   [ ] Implement the `PureChatGroups` component *exactly* as in the diff (using `memo`).
    *   [ ] Implement `const ChatGroups = memo(PureChatGroups);`.
    *   [ ] Define `COMMON_SWR_CONFIG`.
    *   [ ] Define the `ViewState` enum.
    *   [ ] Define the `ChatSearchProps` type.
    *   [ ] Implement the main `ChatSearch` component function *exactly* as in the diff, including:
        *   Router and artifact hooks.
        *   `searchQuery` state and `debouncedSearchQuery`.
        *   SWR hooks for `searchResults` and `chatHistory` with correct conditional logic and config.
        *   `groupedHistory` memoized calculation.
        *   `viewState` memoized calculation.
        *   `handleItemSelect` callback implementation (including closing artifact pane).
        *   `handleSearchInputChange` callback implementation.
        *   JSX structure using `CommandDialog`, `CommandInput`, `CommandList`, etc.
        *   Conditional rendering logic based on `viewState` to show Skeleton, Empty state, Search Results, or History.
        *   Correctly passing props to `ChatGroups`.
        *   Rendering the footer with keyboard shortcut hints.

---

**Story 7: Add `cmdk` Dependency**

*   **Goal:** Install the `cmdk` library required for the search command palette.
*   **Target File:** `package.json`, `bun.lockb`

*   **Tasks:**
    *   [ ] Open a terminal in the root directory of the `chatkuka` project.
    *   [ ] Run the command: `bun add cmdk`.
    *   [ ] **Verify:** Check that `cmdk` is added under `dependencies` in `package.json`.
    *   [ ] **Verify:** Check that `bun.lockb` has been updated to include `cmdk` and its dependencies.

---

**Story 8: Add Required UI Components (Command & Dialog)**

*   **Goal:** Ensure the `Command` and `Dialog` components from `shadcn/ui` are present in the project.
*   **Target Files:** `components/ui/command.tsx`, `components/ui/dialog.tsx` (Potentially New Files)

*   **Tasks:**
    *   [ ] Check if `components/ui/command.tsx` exists.
        *   [ ] If NO: Run `bunx shadcn-ui@latest add command`.
        *   [ ] If YES: Compare the existing file content with the `command.tsx` content provided in the diff. Manually merge any differences if necessary, prioritizing the structure required by `cmdk`.
    *   [ ] Check if `components/ui/dialog.tsx` exists.
        *   [ ] If NO: Run `bunx shadcn-ui@latest add dialog`.
        *   [ ] If YES: Compare the existing file content with the `dialog.tsx` content provided in the diff. Manually merge any differences if necessary.

---

**Story 9: Final Verification and Cleanup**

*   **Goal:** Ensure code consistency and remove any potential conflicts or redundancies introduced during the process.
*   **Target Files:** Various (as needed)

*   **Tasks:**
    *   [ ] **Run Linting/Formatting:** Execute `bun run lint:fix` and `bun run format` to apply project styling rules. Resolve any reported issues.
    *   [ ] **Review Modified Files:** Manually review `components/chat.tsx`, `components/chat-header.tsx`, `lib/db/queries.ts`, `lib/utils.ts`, and `components/sidebar-history.tsx` one last time to ensure the new search logic is integrated correctly without breaking existing code or styles.
    *   [ ] **Check Console:** Run the application (`bun run dev`) and check the browser's developer console for any new errors or warnings introduced by the changes.

---

**<critical>**
**Manual Testing is CRUCIAL after completing these steps.** As an AI, you cannot perform actual UI testing. Inform the user that they **MUST** manually test the following thoroughly:
1.  Open/close search via button and keyboard shortcut (Cmd/Ctrl+K).
2.  Typing in search – verify debounce and loading state.
3.  Clearing search – verify history view appears correctly (including "New Chat").
4.  Verify "No results found" message appears when appropriate.
5.  Clicking a search result item navigates correctly.
6.  Clicking a history item navigates correctly.
7.  Clicking "New Chat" navigates correctly.
8.  Verify search works in both light and dark modes.
9.  Verify the core chat functionality (sending/receiving messages) is unaffected.
10. Verify artifact creation and interaction are unaffected.
11. Verify login/logout functionality is unaffected.
12. Verify file uploads (if implemented) are unaffected.
13. Verify subscription/payment flows (if applicable) are unaffected.
**</critical>**

**<critical>**
**Database Query Alert:** Remind the user about the potential schema mismatch identified in Story 2 regarding `message.content` vs `message.parts`. The implemented query targets `message.parts` based on the *latest* schema snapshot, but if the *actual live database* still uses `message.content`, the search on message content **will not work** correctly and will need manual adjustment of the SQL query in `lib/db/queries.ts`.
**</critical>**