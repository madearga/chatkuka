Okay, here is a highly detailed Markdown checklist designed for an AI Coding Agent to implement the mobile responsiveness fix for the chat input bar, ensuring no existing functionality is harmed.

**Project Plan: Fix Mobile Chat Input Positioning & Layout**

**Goal:** Ensure the chat input bar remains fixed at the bottom of the mobile viewport during scrolling, preventing the "jeda putih" visual bug, without affecting desktop layout or existing component logic.

```markdown
# Checklist: Mobile Chat Input Responsiveness Fix

<critical>
  - **Primary Constraint:** DO NOT modify the internal logic, state management, event handlers, or prop handling within the `MultimodalInput` or `Messages` components. Changes MUST be limited to CSS classes (Tailwind) for layout and positioning adjustments, primarily targeting mobile viewports.
  - **Target:** Address the visual "jeda putih" on mobile scrolling by fixing the input bar to the viewport bottom.
</critical>

## Story 1: Apply Fixed Positioning to Chat Input on Mobile

**Goal:** Modify `MultimodalInput` so its main container is fixed to the bottom of the screen *only* on mobile viewports.

*   **Task 1.1: Locate Target Component**
    *   `✓` Open the file `components/multimodal-input.tsx`.
*   **Task 1.2: Identify Outermost Wrapper**
    *   `✓` Find the top-level `div` element returned by the `PureMultimodalInput` component. This is the element that currently has `className="flex gap-2 flex-col w-full overflow-y-auto..."`.
*   **Task 1.3: Add Conditional Fixed Positioning Classes**
    *   `✓` To the `className` prop of the outermost `div` identified in Task 1.2, add the following Tailwind classes specifically prefixed for mobile (`max-md:`):
        *   `✓` `max-md:fixed` (Applies `position: fixed`)
        *   `✓` `max-md:bottom-0` (Aligns to the bottom)
        *   `✓` `max-md:left-0` (Stretches to the left edge)
        *   `✓` `max-md:right-0` (Stretches to the right edge)
        *   `✓` `max-md:z-20` (Ensures it's layered above most content)
*   **Task 1.4: Apply Mobile Background and Padding**
    *   `✓` To the same outermost `div` (from Task 1.2), add classes for mobile background and padding:
        *   `✓` `max-md:bg-background` (Ensures it has a solid background matching the theme when fixed)
        *   `✓` `max-md:p-2` (Adds some internal spacing on mobile)
*   **Task 1.5: Add Mobile Top Border**
    *   `✓` To the same outermost `div` (from Task 1.2), add classes for a top border *only* on mobile:
        *   `✓` `max-md:border-t` (Applies `border-top-width: 1px`)
        *   `✓` `max-md:dark:border-zinc-700` (Sets the border color in dark mode, adjust if needed)
        *   `✓` Ensure the light mode border uses the default `border-border` implicitly or add `max-md:border-border`.
*   **Task 1.6: Remove `overflow-y-auto` from Outermost Wrapper**
    *   `✓` From the outermost `div` (from Task 1.2), **remove** the class `overflow-y-auto`. Fixed elements should not typically be scroll containers themselves in this context.
*   **Task 1.7: Adjust Inner Container Border (Optional Refinement)**
    *   `✓` Locate the *inner* `div` that contains the `Textarea` and the action buttons row (currently has `dark:border-zinc-700`).
    *   `✓` *Optionally*, slightly adjust its dark mode border opacity for visual harmony: change `dark:border-zinc-700` to `dark:border-zinc-700/50`. This is minor.
*   **Task 1.8: Ensure Bottom Rounding on Inner Action Row Container**
    *   `✓` Locate the `div` that directly wraps the `ModelSelector` and the action buttons (`Paperclip`, `Globe`, `Send/Stop`). This `div` should have `rounded-b-xl` to maintain the visual appearance, especially since the *outermost* fixed container might not visually convey rounding perfectly. If it doesn't have `rounded-b-xl`, add it.
*   **Task 1.9: Verify No Logic Changes**
    *   `✓` Double-check that *only* CSS classes (primarily `className` props using `cn` or direct strings) were added or modified in `components/multimodal-input.tsx`.
    *   `✓` Confirm that no React state hooks (`useState`, `useRef`, etc.), event handlers (`onClick`, `onChange`, `onKeyDown`), or component logic were altered.

## Story 2: Adjust Message List Layout for Fixed Input

**Goal:** Add padding to the bottom of the `Messages` component container so the last message isn't obscured by the newly fixed input bar on mobile.

*   **Task 2.1: Locate Target Component**
    *   `✓` Open the file `components/messages.tsx`.
*   **Task 2.2: Identify Scrollable Message Container**
    *   `✓` Find the main `div` element returned by the `PureMessages` component. This is the element that has `ref={messagesContainerRef}` and classes like `flex-1 overflow-y-auto`.
*   **Task 2.3: Add Conditional Bottom Padding**
    *   `✓` To the `className` prop of the `div` identified in Task 2.2, add a Tailwind class for bottom padding *only* on mobile (`max-md:`).
        *   `✓` Add `max-md:pb-24`. (The value `pb-24` corresponds to `6rem` or `96px`. This is an estimate and might need slight visual adjustment later, but start with this).
*   **Task 2.4: Verify No Logic Changes**
    *   `✓` Double-check that *only* a CSS class for padding (`max-md:pb-24`) was added to the container element in `components/messages.tsx`.
    *   `✓` Confirm that message rendering logic, `useScrollToBottom` hook usage, and prop handling remain unchanged.

## Story 3: Verification and Testing

**Goal:** Ensure the fix works correctly on mobile without negatively impacting the desktop layout or any existing functionality.

*   **Task 3.1: Test Mobile Viewport (<= `md` breakpoint)**
    *   ` ` Using browser developer tools, simulate a mobile device viewport (e.g., width < 768px).
    *   ` ` Load a chat with several messages.
    *   ` ` Scroll the message list up and down vigorously. **Verify:** The input bar remains fixed at the very bottom of the viewport without any flickering or "jeda putih".
    *   ` ` Scroll to the very last message. **Verify:** The entire last message is visible and not obscured by the fixed input bar (due to the padding added in Story 2).
    *   ` ` Tap into the `Textarea`. **Verify:** The virtual keyboard appears correctly (if simulator allows) and the input bar adjusts its position smoothly if necessary (browser default behavior).
    *   ` ` Type a message and send it. **Verify:** Sending messages still works as expected.
    *   ` ` Test file attachment button (`PaperclipIcon`). **Verify:** Clicking it opens the file dialog.
    *   ` ` Test web search toggle button (`GlobeIcon`). **Verify:** Toggling the search state works visually and functionally (if applicable backend logic exists).
    *   ` ` Test model selector dropdown. **Verify:** Dropdown opens and selection works.
*   **Task 3.2: Test Desktop Viewport (> `md` breakpoint)**
    *   ` ` Resize the browser window or disable mobile simulation to view the desktop layout.
    *   ` ` Load a chat.
    *   ` ` Scroll the message list. **Verify:** The input bar scrolls with the page content and is *not* fixed to the bottom.
    *   ` ` **Verify:** There is no excessive padding at the bottom of the message list.
    *   ` ` **Verify:** All input bar functionalities (typing, sending, attaching, model select, search toggle) work as expected on desktop.
*   **Task 3.3: Functional Regression Test (Brief)**
    *   ` ` Send a message without search. **Verify:** Response is generated correctly.
    *   ` ` Send a message *with* search enabled. **Verify:** Search results are displayed correctly (if applicable) and response is generated.
    *   ` ` Attach and send a file (if implemented). **Verify:** File upload and message sending works.
    *   ` ` Check chat history navigation. **Verify:** Switching between chats works.
    *   ` ` Open and close the sidebar. **Verify:** Layout adjusts correctly.

```

This checklist provides granular, testable steps focused solely on the CSS/layout changes needed for mobile responsiveness, explicitly warning against altering component logic to minimize the risk of breaking existing functions.