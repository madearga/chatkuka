Okay, here is the extremely detailed Markdown checklist for migrating your `madearga-chatkuka.git` codebase to AI SDK v4.2+, focusing on the `message.parts` structure and stable APIs, designed for an AI Coding Agent using `bun`.

**CRITICAL PRE-REQUISITE:** Before starting *any* steps, ensure you have:
1.  **Created a full backup** of your current codebase.
2.  **Created a full backup** of your PostgreSQL database.
3.  **Created and checked out a new Git branch** specifically for this migration (e.g., `feat/ai-sdk-v4.2-migration`).

---

### **Project Checklist: AI SDK v4.2+ Migration (Message Parts & Stable APIs)**

**Goal:** Update the project to utilize the stable APIs and the `message.parts` data structure from AI SDK v4.2+, ensuring all existing chat, artifact, and related functionalities remain operational. Use `bun` for package management and script execution.

---

**Epic 1: Environment Setup & Dependency Updates**

*   **Goal:** Prepare the development environment and update necessary packages to versions compatible with AI SDK v4.2+.

    *   #### Story 1.1: Verify Environment
        *   [x] Confirm `bun` is installed and available in the command line environment (`bun --version`).
        *   [x] Ensure Node.js version is compatible with the target AI SDK version (typically >= 18).

    *   #### Story 1.2: Update Core AI SDK Dependencies
        *   [x] Open the `package.json` file.
        *   [x] Locate the `dependencies` section.
        *   [x] Update the version for the `ai` package to the latest stable version (>= 4.2, check Vercel AI SDK documentation for the specific latest stable version, e.g., `^4.3.4` or higher).
        *   [x] Update the version for `@ai-sdk/react` to the corresponding latest stable version (e.g., `^1.2.8` or higher).
        *   [x] Update the versions for specific AI provider packages used in `lib/ai/providers.ts` (e.g., `@ai-sdk/google`, `@ai-sdk/groq`, `@ai-sdk/fal`) to their latest compatible stable versions.
        *   [x] Verify the `zod` dependency version is `^3.23.8` or higher. Your current `^3.24.2` is sufficient.

    *   #### Story 1.3: Install Updated Dependencies
        *   [x] Open your terminal in the project root directory.
        *   [x] Run the command: `bun install`.
        *   [x] Observe the output for any installation errors or peer dependency warnings. Resolve critical errors if they occur.

    *   #### Story 1.4: Initial Build Check
        *   [x] Run the development server using the command specified in your `package.json` (likely `bun run dev`).
        *   [x] Verify that the application builds and starts without immediate crashing errors related to the dependency updates. (Note: Runtime errors related to API changes are expected at this stage).

---

**Epic 2: Adopt Stable AI SDK APIs**

*   **Goal:** Refactor the codebase to use the stable APIs by removing the `experimental_` prefix from relevant functions and options.

    *   #### Story 2.1: Update `streamText` API Usage
        *   [x] Open `app/(chat)/api/chat/route.ts`.
        *   [x] Locate the `streamText` function call within the `POST` request handler.
        *   [x] Find the `experimental_transform` option. Remove the `experimental_` prefix, leaving `transform: smoothStream(...)`.
        *   [x] Find the `experimental_activeTools` option. Remove the `experimental_` prefix, leaving `activeTools: [...]`.
        *   [x] Find the `experimental_generateMessageId` option. Remove the `experimental_` prefix, leaving `generateMessageId: generateUUID`.
        *   [x] Find the `experimental_telemetry` option. Remove the `experimental_` prefix, leaving `telemetry: {...}`.
        *   [x] Search for any potential use of `experimental_toolCallStreaming` and remove the prefix if found.

    *   #### Story 2.2: Update Artifact Server API Usage
        *   [x] Open `artifacts/text/server.ts`.
        *   [x] Locate the `streamText` call within `onUpdateDocument`.
        *   [x] Find the `experimental_transform` option. Remove the `experimental_` prefix.
        *   [x] Find the `experimental_providerMetadata` option. Rename it to `providerOptions`.
        *   [x] Open `artifacts/code/server.ts`.
        *   [x] Locate the `streamObject` call within `onCreateDocument`. Check if any experimental options are used and update if necessary (unlikely for `streamObject` based on docs).
        *   [x] Locate the `streamObject` call within `onUpdateDocument`. Check if any experimental options are used and update if necessary.
        *   [x] Open `artifacts/sheet/server.ts`.
        *   [x] Locate the `streamObject` call within `onCreateDocument`. Check if any experimental options are used and update if necessary.
        *   [x] Locate the `streamObject` call within `onUpdateDocument`. Check if any experimental options are used and update if necessary.
        *   [x] Open `artifacts/image/server.ts`.
        *   [x] Locate the `experimental_generateImage` calls. *Keep* this prefix as `generateImage` is likely still experimental or has a different stable name if available (verify with latest SDK docs if needed, but assume `experimental_generateImage` remains for now unless docs state otherwise).

    *   #### Story 2.3: Update Custom Provider Usage (Verification)
        *   [x] Open `lib/ai/providers.ts`.
        *   [x] Verify that `customProvider` is used *without* the `experimental_` prefix. (Your `madearga-chatkuka.git` code already does this).

    *   #### Story 2.4: Build Check After API Updates
        *   [x] Run `bun run dev`.
        *   [x] Verify the application still builds and starts without errors related to these API name changes.

---

**Epic 3: Refactor UI Components for `message.parts`**

*   **Goal:** Modify React components responsible for rendering chat messages to correctly display content based on the new `message.parts` array structure.

    *   #### Story 3.1: Update `PreviewMessage` Component
        *   [x] Open `components/message.tsx`.
        *   [x] Import necessary types from `ai`: `import type { UIMessage, UIMessagePart } from 'ai';`.
        *   [x] Locate the `PurePreviewMessage` component.
        *   [x] Find the existing logic that renders content based on `message.content`, `message.toolInvocations`, `message.reasoning`, and potentially `message.experimental_attachments`.
        *   [x] **Remove** or comment out the old rendering logic for these separate fields.
        *   [x] Add a loop that iterates over `message.parts`: `message.parts?.map((part, index) => { ... })`. Use optional chaining (`?.`) in case `parts` is somehow undefined initially.
        *   [x] Inside the loop, implement a `switch (part.type)` statement.
        *   [x] **Case `'text'`:**
            *   [x] Render the text content using `part.text`.
            *   [x] Reuse the existing conditional rendering logic for the edit button (`message.role === 'user' && !isReadonly && mode === 'view'`).
            *   [x] Render the `Markdown` or `ResponseStream` component with `part.text` as its child/prop.
            *   [x] Ensure styling (e.g., background for user messages) is applied correctly around the text part.
        *   [x] **Case `'tool-invocation'`:**
            *   [x] Destructure `const { toolInvocation } = part;`.
            *   [x] Further destructure `const { toolName, toolCallId, state, args, result } = toolInvocation;`.
            *   [x] Adapt the *existing* conditional rendering logic based on `state`:
                *   If `state === 'call'`, render the appropriate component (`Weather` skeleton, `DocumentPreview` with args, `DocumentToolCall`, `SearchProgress`). Pass `args` as needed.
                *   If `state === 'result'`, render the appropriate component (`Weather` with data, `DocumentPreview` with result, `DocumentToolResult`, `SearchResults`). Pass `result` as needed. Make sure to handle the `search` tool result structure correctly for the `SearchResults` component.
            *   [x] Use `toolCallId` as the `key` for the rendered tool component.
        *   [x] **Case `'reasoning'`:**
            *   [x] Render the `MessageReasoning` component, passing `part.reasoning` as the `reasoning` prop and `isLoading` prop as before.
        *   [x] **Case `'file'` (If you plan to support inline file parts):**
            *   [x] Render an appropriate component (e.g., `PreviewAttachment`) using `part.data`, `part.mimeType`, `part.name`.
        *   [x] **Case `'source'` (If you plan to support source parts):**
            *   [x] Render a source citation component using `part.source.url`, `part.source.title`, etc.
        *   [x] **Default Case:** Add `console.warn(\`Unhandled message part type: \${(part as any).type}\`); return null;`.
    *   #### Story 3.2: Update `MessageActions` Component
        *   [x] Open `components/message-actions.tsx`.
        *   [x] Locate the `handleCopy` function.
        *   [x] Modify `handleCopy` to iterate through `message.parts`, filter for `part.type === 'text'`, extract the `part.text`, join them (e.g., with `\n\n`), and then copy the combined text.
            ```typescript
            const handleCopy = async () => {
              const textToCopy = message.parts
                ?.filter((part): part is { type: 'text'; text: string } => part.type === 'text')
                .map((part) => part.text)
                .join('\n\n') // Join text parts with double newline
                .trim();

              if (!textToCopy) {
                toast.error("There's no text content to copy!");
                return;
              }

              await copyToClipboard(textToCopy);
              toast.success('Copied to clipboard!');
            };
            ```
    *   #### Story 3.3: Update `MessageEditor` Component
        *   [x] Open `components/message-editor.tsx`.
        *   [x] Locate the `onClick` handler for the "Send" button.
        *   [x] Inside the `setMessages` call, modify how the `updatedMessage` is constructed:
            *   Find the index of the message being edited.
            *   Get the existing `parts` array from `messages[index]`.
            *   Find the index of the *first* part with `type: 'text'`.
            *   If found, update `parts[textPartIndex] = { type: 'text', text: draftContent }`.
            *   If *not* found (edge case), create a new text part: `parts = [{ type: 'text', text: draftContent }]`.
            *   Set the `parts` property of the `updatedMessage` to this modified array.
            *   Keep the `content: draftContent` assignment for now for potential backward compatibility needs elsewhere, although it's deprecated in the UI message structure.
            ```typescript
            // Example snippet within the Send button's onClick handler
            setMessages((messages) => {
              const index = messages.findIndex((m) => m.id === message.id);
              if (index !== -1) {
                // Make a mutable copy of parts or default to empty array
                const newParts = [...(messages[index].parts || [])];
                const textPartIndex = newParts.findIndex(p => p.type === 'text');

                if (textPartIndex !== -1) {
                  // Update the existing text part
                  newParts[textPartIndex] = { type: 'text', text: draftContent };
                } else {
                  // If no text part exists (unlikely for user messages), add one
                  // You might want to decide if this should prepend or append
                  newParts.unshift({ type: 'text', text: draftContent });
                }

                const updatedMessage = {
                  ...messages[index],
                  content: draftContent, // Keep for now if needed elsewhere
                  parts: newParts, // Assign the updated parts array
                };
                // Return the updated messages array
                return [...messages.slice(0, index), updatedMessage];
              }
              // If message not found, return original messages
              return messages;
            });
            ```

---

**Epic 4: Refactor Backend for `message.parts` & Database Interaction**

*   **Goal:** Update the backend API endpoint and database queries to handle the new `message.parts` structure and interact with the `Message_v2` and `Vote_v2` tables.

    *   #### Story 4.1: Update Chat API (`onFinish` Handler)
        *   [x] Open `app/(chat)/api/chat/route.ts`.
        *   [x] Locate the `onFinish` callback within the `streamText` call.
        *   [x] Inside the `try` block, modify the logic to get the last assistant message(s) from `response.messages`.
        *   [x] For each relevant assistant message to be saved:
            *   [x] Construct the `messageToSave` object to match the `DBMessage` type from `lib/db/schema.ts`.
            *   [x] Assign `lastAssistantMessage.parts` directly to the `parts` property.
            *   [x] Assign `lastAssistantMessage.experimental_attachments ?? []` to the `attachments` property.
            *   [x] Ensure `createdAt` is set (`new Date()`).
        *   [x] Call `saveMessages` with the correctly formatted `messageToSave` object(s).
        *   [x] **Remove** any calls to the old `sanitizeResponseMessages` function, as the order is now preserved by the `parts` array itself.

    *   #### Story 4.2: Update Database Queries (`lib/db/queries.ts`)
        *   [x] Open `lib/db/queries.ts`.
        *   [x] **`saveMessages` function:**
            *   [x] Change the target table from `messageDeprecated` to `message` (or `Message_v2` if you haven't renamed).
            *   [x] Ensure the `values` passed include `parts` (as JSON) and `attachments` (as JSON, defaulting to `[]`). Adapt the input type if needed (`DBMessage[]`).
        *   [x] **`getMessagesByChatId` function:**
            *   [x] Change the target table from `messageDeprecated` to `message` (`Message_v2`).
        *   [x] **`voteMessage` function:**
            *   [x] Change target table from `voteDeprecated` to `vote` (`Vote_v2`).
            *   [x] Ensure foreign key references point to the new `message` (`Message_v2`) table.
        *   [x] **`getVotesByChatId` function:**
            *   [x] Change target table from `voteDeprecated` to `vote` (`Vote_v2`).
        *   [x] **`getMessageById` function:**
            *   [x] Change target table from `messageDeprecated` to `message` (`Message_v2`).
        *   [x] **`deleteMessagesByChatIdAfterTimestamp` function:**
            *   [x] Change target tables for deletion from `voteDeprecated` and `messageDeprecated` to `vote` (`Vote_v2`) and `message` (`Message_v2`).

    *   #### Story 4.3: Update Data Conversion Utility (`lib/utils.ts`)
        *   [x] Open `lib/utils.ts`.
        *   [x] Locate the `convertToUIMessages` function.
        *   [x] Change the input type from `MessageDeprecated[]` (or `Message[]` if using old name) to `DBMessage[]` (referencing the new schema type).
        *   [x] Modify the function body to directly map `dbMessage.parts` to `uiMessage.parts` and `dbMessage.attachments` to `uiMessage.experimental_attachments`.
        *   [x] Add the deprecated `content` field by extracting text from the first text part, for temporary compatibility: `content: (dbMessage.parts.find(p => p.type === 'text') as { text: string } | undefined)?.text ?? ''`.
        *   [x] Remove the old `addToolMessageToChat` function if it exists.

---

**Epic 5: Database Schema Migration & Data Transfer**

*   **Goal:** Apply the necessary database schema changes and migrate existing message/vote data to the new table structure.

    *   #### Story 5.1: Apply Schema Migration (0005)
        *   [x] **CRITICAL: Ensure Database Backup exists!**
        *   [x] Verify that the migration file `lib/db/migrations/0005_wooden_whistler.sql` exists and contains the `CREATE TABLE "Message_v2"` and `CREATE TABLE "Vote_v2"` statements with the correct columns (`parts`, `attachments`). (Skipped: Schema already updated)
        *   [x] Run the Drizzle migration command: `bun run db:migrate`. (Skipped: Schema already updated, migration script removed from build)
        *   [x] Verify the new tables `Message_v2` and `Vote_v2` were created in your database. (Verified: Columns exist in `Message` table)

    *   #### Story 5.2: Run Data Migration Script
        *   [x] **CRITICAL: Ensure Database Backup exists!**
        *   [x] Carefully review the script `lib/db/helpers/01-core-to-parts.ts`. (Skipped: User opted out)
        *   [x] Execute the migration script: `bun run ./lib/db/helpers/01-core-to-parts.ts`. (Skipped: User opted out)
        *   [x] After completion, query the `Message_v2` and `Vote_v2` tables to verify data integrity and correct transformation (check `parts` column content). (Skipped: User opted out)

    *   #### Story 5.3: Update Schema File (`lib/db/schema.ts`)
        *   [x] Open `lib/db/schema.ts`.
        *   [x] **Remove** the definitions for the old `messageDeprecated` and `voteDeprecated` tables (or rename `Message_v2` to `message` and `Vote_v2` to `vote`, then remove the old ones). Ensure all foreign keys now point to the new tables. (Completed: Schema updated directly)
        *   [x] Update any type exports (`DBMessage`, `Vote`) to refer to the new table schemas. (Completed: Renamed to `DBSchemaMessage`)

    *   #### Story 5.4: Generate Cleanup Migration (Optional but Recommended)
        *   [x] **CRITICAL: Ensure Database Backup exists and Data Migration was successful!**
        *   [x] Generate a new Drizzle migration: `bun run db:generate`. (Skipped: No old tables to drop)
        *   [x] Inspect the generated SQL file. It should contain `DROP TABLE "Message";` and `DROP TABLE "Vote";` (or the original names if you didn't rename the v2 tables). (Skipped: No old tables to drop)
        *   [x] Apply the cleanup migration: `bun run db:migrate`. (Skipped: No old tables to drop)

---

**Epic 6: Final Testing and Verification**

*   **Goal:** Ensure the application functions correctly after all migration steps.

    *   #### Story 6.1: Comprehensive Manual Testing
        *   [ ] Start the development server: `bun run dev`.
        *   [ ] **New Chat:** Start a new chat. Send simple messages. Verify rendering.
        *   [ ] **Tool Calls:** Send messages that trigger tools (weather, document creation/update, suggestions). Verify tool calls and results render correctly within the message parts structure.
        *   [ ] **Reasoning:** Use the reasoning model. Verify reasoning steps appear correctly. Toggle reasoning visibility.
        *   [ ] **Attachments:** Upload files during input. Send the message. Verify the attachment is associated with the user message and displays correctly.
        *   [ ] **Artifacts:** Create and interact with all artifact types (text, code, image, sheet). Ensure streaming updates and final content are handled correctly. Test toolbar actions.
        *   [ ] **History:** Navigate to older chats (created *before* the migration). Verify messages load and display correctly in the new `parts` format.
        *   [ ] **Voting:** Test upvoting and downvoting on *new* messages and *old* (migrated) messages.
        *   [ ] **Editing:** Edit user messages (both new and old). Verify the correct text part is updated and the chat reloads correctly.
        *   [ ] **Error Handling:** Test scenarios that might cause errors (e.g., failed tool call) and verify UI feedback.
        *   [ ] **Responsiveness:** Check UI rendering and interactions on different screen sizes (desktop/mobile).

    *   #### Story 6.2: Automated Testing (If Applicable)
        *   [ ] Run the Playwright test suite: `bun run test`.
        *   [ ] Investigate and fix any failing tests. Failures are likely due to changes in the DOM structure (rendering `parts` instead of direct `content`/`toolInvocations`). Update selectors and assertions in `tests/pages/chat.ts` and `tests/pages/artifact.ts` as needed. Pay close attention to tests involving message content verification, tool results, and reasoning display.

---

**Migration Complete:** Once all tests pass and manual verification confirms expected behavior, merge the migration branch. Remember to apply the database migrations (including the cleanup migration if generated) to your staging and production environments during deployment.
