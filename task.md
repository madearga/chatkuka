Okay, here is the extremely detailed, step-by-step Markdown checklist designed for a competent AI Coding Agent to implement the change from streaming text responses to displaying the full text at once after generation.

**Project Goal:** Modify the chat interface to eliminate the character-by-character or word-by-word streaming effect for AI assistant text responses. Instead, display a loading indicator while the AI generates the full response, and then render the complete text content instantly upon completion. This aims to provide a user experience similar to the T3 Chat example video, prioritizing overall completion speed perception over incremental display.

---

### **Project Checklist: Implement Instant Full Text Response Display**

**Context:** The current implementation uses the `ResponseStream` component (likely leveraging `useTextStream` hook) within `PreviewMessage` to display text parts of assistant messages incrementally. This will be replaced with conditional rendering based on the message's loading state.

**Constraint:** This change should *only* affect the rendering of `type: 'text'` parts for messages where `role === 'assistant'`. User messages and other message part types (tool calls, reasoning, files) should render as they currently do. The `isLoading` prop passed down the component tree correctly identifies the message currently being generated.

---

#### **Story 1: Modify Message Component for Conditional Text Rendering**

**Goal:** Update the `PreviewMessage` component to render either a loading indicator or the full text content based on the `isLoading` prop, removing the `ResponseStream` component for text parts.

**Target File:** `components/message.tsx`

**Tasks:**

*   **1.1: Locate Target Component and Text Part Logic**
    *   [x] Open the file `components/message.tsx`.
    *   [x] Identify the `PurePreviewMessage` component (or the primary component rendering a single message).
    *   [x] Find the loop or mapping function iterating over `message.parts` (e.g., `message.parts?.map(...)`).
    *   [x] Locate the `case 'text':` block within this loop. This is where the text content is currently handled.

*   **1.2: Define or Import Loading Indicator**
    *   [x] Check if a suitable simple loading indicator component (like animated dots) already exists within the project (e.g., in `components/icons.tsx` or `components/ui/`).
    *   [x] If not, define a simple `ThinkingDots` component directly within `components/message.tsx` *outside* the `PurePreviewMessage` component definition:
        ```typescript
        const ThinkingDots = () => (
          <div className="flex space-x-1 items-center h-full py-1"> {/* Adjust styling as needed */}
            <span className="sr-only">Generating response...</span>
            <div className="h-1.5 w-1.5 bg-current rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="h-1.5 w-1.5 bg-current rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="h-1.5 w-1.5 bg-current rounded-full animate-bounce"></div>
          </div>
        );
        ```
    *   [x] Ensure necessary CSS for `animate-bounce` is available (likely provided by Tailwind).

*   **1.3: Remove `ResponseStream` Component**
    *   [x] Inside the `case 'text':` block, find the line rendering the `<ResponseStream ... />` component.
    *   [x] **Delete** this entire `<ResponseStream ... />` component invocation.

*   **1.4: Implement Conditional Rendering for Text Part**
    *   [x] Inside the `case 'text':` block (where `ResponseStream` was removed), add a conditional rendering structure based on the `isLoading` prop passed to `PurePreviewMessage`.
    *   [x] Use the existing container `div` that likely wrapped `ResponseStream` or create a similar one to maintain styling. Ensure it uses `cn()` for class merging. Copy the `className` attributes previously applied to the container or `ResponseStream` itself (especially background, padding, border, rounded corners, text color).
    *   **Added the following structure:**
        ```typescript
        // Inside case 'text':
        <div
          className={cn(
            'flex-grow break-words max-w-full overflow-hidden',
            message.role === 'user'
              ? 'bg-primary text-white dark:bg-zinc-800 dark:text-white px-2 py-1.5 sm:px-3 sm:py-2 rounded-xl group-data-[role=user]/message:ml-auto'
              : 'bg-muted/50 text-foreground border border-border/50 px-2 py-1.5 sm:px-3 sm:py-2 rounded-xl',
          )}
        >
          {message.role === 'assistant' && isLoading ? (
            <ThinkingDots />
          ) : (
            <Markdown
              className={cn(
                'prose max-w-full text-sm sm:text-base',
                message.role === 'user'
                  ? 'text-white dark:text-white'
                  : 'text-foreground',
              )}
            >
              {part.text}
            </Markdown>
          )}
        </div>
        ```
    *   [x] **Verified:** The `className` applied to the outer `div` and the `Markdown` component matches the styling previously applied to assistant message text bubbles.

*   **1.5: Clean Up Imports**
    *   [x] Locate the import statement for `ResponseStream` at the top of `components/message.tsx`.
    *   [x] **Delete** this import statement: `import { ResponseStream } from './ui/response-stream';`.

---

#### **Story 2: Verify Parent Component Prop Passing**

**Goal:** Ensure the `isLoading` prop is correctly passed from the `Messages` component to the `PreviewMessage` component.

**Target File:** `components/messages.tsx`

**Tasks:**

*   **2.1: Locate Message Rendering Loop**
    *   [x] Open the file `components/messages.tsx`.
    *   [x] Find the `.map` function iterating over the `messages` array (e.g., `messages.map((message, index) => ...)`).

*   **2.2: Confirm `isLoading` Prop**
    *   [x] Inside the loop, verify that the `<PreviewMessage ... />` component receives the `isLoading` prop calculated as: `isLoading={isLoading && index === messages.length - 1}`.
    *   [x] **No change needed here**, confirmed this logic exists and is correct. It ensures only the *last* message shows the loading state when the overall chat `isLoading` is true.

---

#### **Story 3: Testing and Verification**

**Goal:** Confirm the new behavior works as expected and doesn't introduce regressions.

**Tasks:**

*   **3.1: Run Application Locally**
    *   [x] Start the development server (e.g., `bun dev`).
    *   [x] Open the application in your browser.

*   **3.2: Test Basic Chat Flow**
    *   [ ] Start a new chat or open an existing one.
    *   [ ] Send a message that requires a response from the AI.
    *   [ ] **Observe:** When the assistant bubble appears, it should initially contain the `ThinkingDots` loading indicator.
    *   [ ] **Observe:** Once the AI response is complete, the `ThinkingDots` should disappear, and the *entire* text content of the response should appear instantly within the bubble.
    *   [ ] **Verify:** There is no character-by-character typing or word-by-word fade-in effect for the text content.

*   **3.3: Test Different Message Types**
    *   [ ] Send messages that trigger tool calls (e.g., "What's the weather in London?", "Create a document about...").
    *   [ ] **Verify:** The rendering of tool call indicators (like the Weather component placeholder or Document preview placeholder) still works correctly *while* the main text part shows the `ThinkingDots`.
    *   [ ] **Verify:** The rendering of tool *results* (like the filled Weather component or Document result) still works correctly *after* the main text part appears.
    *   [ ] **Verify:** Messages with attachments still display correctly.

*   **3.4: Test User Messages**
    *   [ ] Send multiple user messages.
    *   [ ] **Verify:** User messages appear instantly as before (they were never streamed).

*   **3.5: Check Console**
    *   [ ] Open the browser's developer console.
    *   [ ] Perform various chat interactions.
    *   [ ] **Verify:** No new errors or warnings related to message rendering or React state appear in the console.

*   **3.6: Test Edge Cases (Optional but Recommended)**
    *   [ ] Test with very short AI responses.
    *   [ ] Test with very long AI responses.
    *   [ ] Test rapidly sending multiple messages.

---

**Completion Criteria:** AI assistant text responses no longer stream character-by-character or word-by-word. Instead, a loading indicator is shown while the response is generated, and the full text appears instantly upon completion. Other message types (user messages, tool calls/results) remain unaffected.