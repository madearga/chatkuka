Okay, I have reviewed the project request, rules, technical specification (which seems missing, so I'll make reasonable assumptions based on the request and codebase), and the current codebase structure.

Here is the plan to add file upload functionality (PDF, CSV, TXT, Excel, DOCS, etc.) using Vercel Blob and integrating it with the Vercel AI SDK, without harming existing functions.

<brainstorming>
1.  **Goal**: Allow users to upload files (PDF, CSV, TXT, Excel, DOCS, etc.) within the chat interface, store them using Vercel Blob, and associate them with chat messages, potentially making them available to the AI.
2.  **Key Technologies**: Next.js App Router, Vercel Blob, Vercel AI SDK, React, shadcn/ui, Drizzle ORM, NextAuth.js.
3.  **Assumptions**:
    *   Uploaded files should be stored in Vercel Blob.
    *   A reference (Blob URL) to the uploaded file needs to be associated with the chat message sent by the user.
    *   The UI for uploading should be integrated into the existing chat input area (`components/multimodal-input.tsx`).
    *   Basic security checks (file type, size limits) are required.
    *   Initially, the AI integration might just involve passing the file URL or metadata. Full content parsing/injection can be a later enhancement.
    *   The existing `/api/files/upload` route will be modified or serve as a base.
4.  **Constraint Checklist & Rule Adherence**:
    *   *Existing Functionality*: Steps should modify specific parts without breaking chat, auth, etc. Testing is crucial.
    *   *Code Org*: Follow naming conventions, keep components concise, manage imports.
    *   *Performance*: Vercel Blob handles storage. API route should be efficient. Limit client-side processing before upload.
    *   *UX*: Add clear upload button/indicator. Show selected files. Handle errors gracefully. Display attachments in messages.
    *   *Security*: Validate file type and size on the server (`/api/files/upload`). Use authenticated routes.
    *   *Testing*: Include steps for adding relevant tests.
    *   *Documentation*: Add JSDoc where necessary.
    *   *Atomicity*: Each step targets a small, verifiable change, modifying a limited number of files.
5.  **Plan Refinement**:
    *   **Step 1: Backend API**: Solidify the upload endpoint first. Define accepted types and size limits. Ensure it returns the Blob URL.
    *   **Step 2: DB Schema**: Decide if file URLs need to be persisted with messages. Given the chat history feature, this seems necessary. Add `attachmentUrl` (or similar) to the `messages` table.
    *   **Step 3: Frontend UI (Input)**: Add the upload button and file selection handling in `MultimodalInput`. Show a basic preview (e.g., filename, size).
    *   **Step 4: Frontend Logic (Upload)**: Connect the UI to the backend API. Handle loading/error states during upload. Store the returned Blob URL temporarily on the client.
    *   **Step 5: Message Integration**: Modify the message sending process. When a message is submitted *after* a file upload, include the Blob URL in the message payload. Update the server action/API route (`/api/chat`) to accept and potentially store this URL (linking back to Step 2).
    *   **Step 6: Frontend UI (Display)**: Update the `Message` component to display the attachment, likely as a link initially, perhaps with an icon indicating the file type.
    *   **Step 7: Enhancements (Optional but good UX)**: Improve file previews in the input area. Add upload progress.
    *   **Step 8: Testing**: Add unit/integration/E2E tests.

This breakdown seems logical and adheres to the constraints and rules. Each step is relatively small and builds upon the previous one.
</brainstorming>

# Implementation Plan

## Backend Setup & API Route

-   [x] Step 1: Enhance File Upload API Route
    -   **Task**: Modify the existing API route `app/(chat)/api/files/upload/route.ts` to securely handle uploads of specified file types (PDF, CSV, TXT, XLSX, DOCX) to Vercel Blob. Implement server-side validation for file types and size limits (e.g., max 10MB). Ensure the route requires authentication (using NextAuth session). Return the Vercel Blob result (URL, pathname, etc.) upon successful upload. Add basic error handling for validation failures or upload issues. Define constants for allowed types and max size.
    -   **Files**:
        -   `app/(chat)/api/files/upload/route.ts`: Implement robust file handling, validation (type, size), authentication check, and upload logic using `@vercel/blob`.
        -   `lib/constants.ts` (or create a new config file): Define `ALLOWED_FILE_TYPES` (MIME types) and `MAX_FILE_SIZE_MB`.
    -   **Step Dependencies**: None.
    -   **User Instructions**: Ensure Vercel Blob is correctly configured in your Vercel project environment variables (`BLOB_READ_WRITE_TOKEN`).

-   [x] Step 2: Update Database Schema for Attachments
    -   **Task**: Add an optional `attachmentUrl` text field to the `messages` table in the Drizzle schema to store the URL of the uploaded file from Vercel Blob. Generate a new database migration using Drizzle Kit.
    -   **Files**:
        -   `lib/db/schema.ts`: Add `attachmentUrl: text('attachment_url')` to the `messages` table definition.
    -   **Step Dependencies**: Step 1.
    -   **User Instructions**:
        1.  Run `pnpm db:generate` to create the migration file in `lib/db/migrations/`.
        2.  Review the generated SQL migration file.
        3.  Run `pnpm db:migrate` to apply the migration to your Vercel Postgres database.

-   [x] Step 3: Update Chat Action/API to Handle Attachments
    -   **Task**: Modify the backend logic that processes new messages (likely within `app/(chat)/api/chat/route.ts` or potentially a server action in `app/(chat)/actions.ts` if message creation happens there) to accept the `attachmentUrl` along with the message content. Ensure this URL is saved to the database when creating the user's message record.
    -   **Files**:
        -   `app/(chat)/api/chat/route.ts` or `app/(chat)/actions.ts`: Update the function handling message creation to accept `attachmentUrl` in its input/payload and pass it to the database insertion logic (e.g., `db.insert(messages).values(...)`).
        -   `lib/db/queries.ts` (if message insertion logic is abstracted here): Update relevant query functions if needed.
        -   `types/` (if specific types are used for API payloads): Update relevant types to include `attachmentUrl`.
    -   **Step Dependencies**: Step 2.

## Frontend Implementation

-   [x] Step 4: Add File Upload UI to Chat Input
    -   **Task**: Add a file upload button (e.g., using a Paperclip icon) to the `MultimodalInput` component. Clicking this button should trigger a hidden file input element. Store the selected file(s) in the component's state. Display a basic preview for the selected file(s) below the textarea (e.g., filename, size, and a remove button). Limit selection based on configured allowed types.
    -   **Files**:
        -   `components/multimodal-input.tsx`: Add a new button with an icon (e.g., `Paperclip` from `lucide-react`). Add a hidden `<input type="file">` element. Add state management (e.g., `useState`) to hold selected `File` objects. Render the selected file information and a button to remove/clear the selection. Add `accept` attribute to file input based on `ALLOWED_FILE_TYPES`.
        -   `components/icons.tsx` (if Paperclip icon isn't already there): Add the Paperclip icon.
    -   **Step Dependencies**: Step 1 (for knowing allowed types).

-   [x] Step 5: Implement Client-Side Upload Logic
    -   **Task**: In `MultimodalInput`, when a file is selected, trigger an asynchronous upload to the `/api/files/upload` endpoint created in Step 1. Handle loading state (disable input/show indicator), success (store the returned Blob URL in state), and error states (show error message using `sonner`). Clear the stored Blob URL if the user removes the selected file preview.
    -   **Files**:
        -   `components/multimodal-input.tsx`: Add an effect or handler function that triggers when a file is selected. Use `fetch` to POST the file data to `/api/files/upload`. Update component state based on upload progress, success (storing the URL), or failure. Use `sonner` to display feedback.
    -   **Step Dependencies**: Step 1, Step 4.

-   [x] Step 6: Integrate Uploaded File URL into Message Submission
    -   **Task**: Modify the message submission logic within `MultimodalInput` (or its parent component/hook managing the chat state, likely interacting with `useChat` from `ai/react`). When the user sends a message, if a file has been successfully uploaded (i.e., a Blob URL is stored in the component's state), include this `attachmentUrl` in the message object sent to the backend action/API route (modified in Step 3). Clear the file selection and stored Blob URL after successful submission.
    -   **Files**:
        -   `components/multimodal-input.tsx`: Modify the `onSubmit` handler (or equivalent). Check if `attachmentUrl` exists in state. If yes, add it to the message payload being sent (e.g., to the `append` function from `useChat` or the server action). Clear the file state and `attachmentUrl` state after submission.
        -   `app/(chat)/page.tsx` or relevant hook using `useChat`: Ensure the message structure passed to `append` or similar function can accommodate the `attachmentUrl`. This might involve updating the initial message structure or options passed to `useChat`.
    -   **Step Dependencies**: Step 3, Step 5.

-   [x] Step 7: Display File Attachment in Chat Message
    -   **Task**: Modify the `Message` component to conditionally render the file attachment if `attachmentUrl` exists on the message data. Initially, display it as a simple link to the Blob URL, perhaps prefixed with an icon or "Attachment: ". Ensure the link opens in a new tab.
    -   **Files**:
        -   `components/message.tsx`: Access the `attachmentUrl` from the message props. Add a conditional rendering block below the message content (`<ReactMarkdown>`) to display a link (`<a>` tag with `target="_blank"`) if `attachmentUrl` is present.
        -   `lib/types.ts` or relevant type definitions: Ensure the `Message` type includes the optional `attachmentUrl` field fetched from the DB/API.
    -   **Step Dependencies**: Step 3, Step 6.

## Testing & Refinement

-   [x] Step 8: Add Basic File Type Icons to Attachment Display
    -   **Task**: Enhance the attachment display in `Message` component. Based on the `attachmentUrl`'s likely file extension (or potentially MIME type if stored), display a corresponding file type icon (e.g., PDF icon, TXT icon) next to the link. Create simple utility function to determine file type from URL.
    -   **Files**:
        -   `components/message.tsx`: Import and use the utility function to get the file type. Conditionally render different icons from `lucide-react` or `components/icons.tsx` based on the type next to the attachment link.
        -   `lib/utils.ts`: Add a utility function `getFileTypeFromUrl(url: string): string` that extracts the extension and returns a simple type string (e.g., 'pdf', 'csv', 'text', 'excel', 'word', 'unknown').
        -   `components/icons.tsx`: Add icons for common file types (e.g., `FileText`, `FileSpreadsheet`, `FileCode`, `File`) if not already present.
    -   **Step Dependencies**: Step 7.

-   [ ] Step 9: Implement Basic Testing
    -   **Task**: Add basic tests for the new functionality. Write a unit test for the `getFileTypeFromUrl` utility function. Write an integration test for the `/api/files/upload` API route to verify authentication, file type/size validation, and successful upload response.
    -   **Files**:
        -   `lib/utils.test.ts` (or create): Add unit tests for `getFileTypeFromUrl`.
        -   `app/(chat)/api/files/upload/route.test.ts` (or create): Add integration tests for the API route using a testing library suitable for Next.js API routes (e.g., potentially mocking `next-auth`, `@vercel/blob`, and using `fetch`).
    -   **Step Dependencies**: Step 1, Step 8.
    -   **User Instructions**: Ensure testing libraries are set up (e.g., Jest, Vitest, Playwright). Run tests using `pnpm test` (or the configured test script).

# Summary

This plan focuses on incrementally adding the file upload feature. It starts with the backend API route for secure uploads, updates the database schema, and then integrates the functionality into the frontend chat input and message display. Each step is designed to be manageable for AI code generation, adhering to project rules and minimizing disruption to existing code. Testing steps are included to ensure functionality and prevent regressions. Further AI integration (parsing file content) is left as a potential future enhancement, keeping the initial scope focused on upload, storage, and display. Remember to review and test each step thoroughly after implementation.

## Implementation Progress

We have successfully implemented the file upload functionality in the chat application with the following features:

1. **Backend Infrastructure**:
   - Enhanced the file upload API route to support various document types (PDF, CSV, TXT, Excel, DOCS)
   - Added proper validation for file types and size limits
   - Updated the database schema to store attachment URLs with messages
   - Modified the message saving logic to handle file attachments

2. **Frontend Components**:
   - Added a file upload button to the chat input
   - Implemented seamless file upload experience with status indicators
   - Enhanced the message component to display file attachments with appropriate icons
   - Added the ability to click and open attachments in a new tab

3. **Utility Functions**:
   - Created a robust getFileTypeFromUrl utility to determine file types
   - Added basic test structure for the utility function

The feature now allows users to:
1. Upload various file types directly in the chat interface
2. See the upload progress and status
3. Associate uploaded files with their messages
4. View and access the attachments in the message history

All steps have been completed as per the implementation plan, with only the integration tests for the API route remaining.