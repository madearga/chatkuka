Okay, here is the extremely detailed, step-by-step Markdown checklist for implementing the UI/UX Polish & Convenience enhancements, designed for execution by an AI Coding Agent.

---

### **Project Checklist: UI/UX Polish & Convenience Enhancements**

**Story 1: Display Message Timestamps on Hover**

*   **Goal:** Show the creation time of each message when the user hovers over it.
*   **File Target:** `components/message.tsx`

    *   **Task 1.1: Verify `createdAt` Prop in `PurePreviewMessage`**
        *   [x] Locate the `PurePreviewMessage` component definition in `components/message.tsx`.
        *   [x] Examine the props interface (or TypeScript definition) for `PurePreviewMessage`.
        *   [x] Confirm that the `message` prop object includes a `createdAt` field (likely of type `Date` or string).
        *   [x] *If `createdAt` is missing:*
            *   [x] Navigate to `lib/utils.ts`.
            *   [x] Locate the `convertToUIMessages` function.
            *   [x] Ensure the `createdAt` field from the `DBMessage` is being mapped to the `Message` object being returned (e.g., `createdAt: message.createdAt`).
            *   [x] Update the `ExtendedMessage` type definition in `components/message.tsx` if necessary to include `createdAt?: Date | string;`.
            *   [x] Go back to `components/message.tsx` and update the props definition for `PurePreviewMessage` to expect `createdAt` within the `message` object.

    *   **Task 1.2: Import Necessary Components and Functions**
        *   [x] At the top of `components/message.tsx`, add the following imports:
            ```typescript
            import { formatDistanceToNow } from 'date-fns';
            import {
              Tooltip,
              TooltipContent,
              TooltipProvider,
              TooltipTrigger,
            } from '@/components/ui/tooltip';
            ```

    *   **Task 1.3: Wrap Message Content in Tooltip**
        *   [x] Locate the `motion.div` element that wraps the entire message bubble (it has `data-role={message.role}`).
        *   [x] Wrap this entire `motion.div` with the `<TooltipProvider delayDuration={300}>` component.
        *   [x] Inside `<TooltipProvider>`, wrap the `motion.div` with the `<Tooltip>` component.
        *   [x] Inside `<Tooltip>`, wrap the `motion.div` with the `<TooltipTrigger asChild>` component. Ensure the `motion.div` is the direct child.

    *   **Task 1.4: Add Tooltip Content with Formatted Timestamp**
        *   [x] Immediately after the closing `</TooltipTrigger>` tag (but still inside the `<Tooltip>`), add the `<TooltipContent>` component.
        *   [x] Inside `<TooltipContent>`, call the `formatDistanceToNow` function with the `message.createdAt` property, adding the option `{ addSuffix: true }`. Ensure proper handling if `message.createdAt` might be undefined or needs parsing (e.g., `message.createdAt ? formatDistanceToNow(new Date(message.createdAt), { addSuffix: true }) : ''`).
            ```typescript
            <TooltipContent side="bottom">
              {message.createdAt ? formatDistanceToNow(new Date(message.createdAt), { addSuffix: true }) : 'Timestamp unavailable'}
            </TooltipContent>
            ```

    *   **Task 1.5: Verify Styling and Positioning**
        *   [x] *Manual Check/AI Review:* Ensure the tooltip appears correctly on hover without disrupting the layout. The default `side="bottom"` should be reasonable.

**Story 2: Implement "Regenerate Response" Button**

*   **Goal:** Add a button to allow regeneration of the last AI assistant response.
*   **File Target:** `components/message-actions.tsx` (Modifying `PureMessageActions`)

    *   **Task 2.1: Import Regeneration Icon**
        *   [ ] At the top of `components/message-actions.tsx`, import an appropriate icon, for example, `RotateCw` from `lucide-react`:
            ```typescript
            import { CopyIcon, ThumbDownIcon, ThumbUpIcon, RotateCw } from './icons'; // Or from 'lucide-react'
            ```

    *   **Task 2.2: Add "Regenerate" Button within `PureMessageActions`**
        *   [ ] Locate the main `div` element with `className="flex flex-row gap-2"` inside the `PureMessageActions` component.
        *   [ ] Add a new `<Tooltip>` component block within this `div`, similar to the existing Copy/Vote buttons.
        *   [ ] Inside the new `<Tooltip>`, add a `<TooltipTrigger asChild>`.
        *   [ ] Inside the `<TooltipTrigger>`, add a `<Button>` component.
            *   Set `variant="outline"`.
            *   Set `className="py-1 px-2 h-fit text-muted-foreground"`.
            *   Set the `onClick` handler to call the `reload` function (passed as a prop).
            *   Include the `<RotateCw />` icon as the button's child.
        *   [ ] After the `<TooltipTrigger>`, add `<TooltipContent>Regenerate Response</TooltipContent>`.

    *   **Task 2.3: Add Conditional Rendering Logic**
        *   [ ] Modify the component's early return logic. Instead of returning `null` immediately if `isLoading`, keep the component rendering but disable buttons.
        *   [ ] Wrap the *entire content* of the `PureMessageActions` return statement (the `<TooltipProvider>`) in a conditional check: `if (message.role !== 'assistant') return null;`. This ensures actions only show for assistant messages.
        *   [ ] Add a `disabled={isLoading}` prop to the newly added "Regenerate" button.
        *   [ ] Add `disabled={isLoading}` prop to the existing "Copy", "Upvote", and "Downvote" buttons as well for consistency during loading. (Note: Upvote/Downvote already had some disabled logic, integrate `isLoading` with it: `disabled={isLoading || vote?.isUpvoted}` etc.).

    *   **Task 2.4: Pass `reload` Prop Down**
        *   [ ] Go to `components/message.tsx` (`PurePreviewMessage`).
        *   [ ] Verify that the `reload` prop is already being received.
        *   [ ] Ensure the `reload` prop is passed correctly to the `<MessageActions />` component invocation.
        *   [ ] Go to `components/messages.tsx` (`PureMessages`).
        *   [ ] Verify that the `reload` prop is already being received.
        *   [ ] Ensure the `reload` prop is passed correctly to the `<PreviewMessage />` component invocation.
        *   [ ] Go to `components/chat.tsx`.
        *   [ ] Verify that the `reload` function from `useChat` is passed down to the `<Messages />` component.

**Story 3: Implement "Copy User Prompt" Button**

*   **Goal:** Allow users to easily copy their own message content.
*   **File Target:** `components/message-actions.tsx` (`PureMessageActions`)

    *   **Task 3.1: Modify Conditional Rendering for User Role**
        *   [ ] Locate the conditional check added in Task 2.3: `if (message.role !== 'assistant') return null;`.
        *   [ ] *Remove* this specific check, as we now want actions for *both* user and assistant roles (but different actions).

    *   **Task 3.2: Add Conditional "Copy" Button for User Messages**
        *   [ ] Inside the main `div` (with `className="flex flex-row gap-2"`) where other action buttons reside:
        *   [ ] Add a conditional rendering block: `{message.role === 'user' && ( ... )}`.
        *   [ ] Inside this block, add a `<Tooltip>` component.
        *   [ ] Inside the `<Tooltip>`, add `<TooltipTrigger asChild>`.
        *   [ ] Inside the `<TooltipTrigger>`, add a `<Button>`.
            *   Set `variant="outline"`.
            *   Set `className="py-1 px-2 h-fit text-muted-foreground"`.
            *   Set the `onClick` handler to call `handleCopy` (this function already exists and copies `message.content`).
            *   Set `disabled={isLoading}`.
            *   Include the `<CopyIcon />` (already imported).
        *   [ ] After the `<TooltipTrigger>`, add `<TooltipContent>Copy Prompt</TooltipContent>`.

    *   **Task 3.3: Adjust Existing Actions for Assistant Role**
        *   [ ] Wrap the existing "Copy", "Upvote", and "Downvote" `<Tooltip>` blocks (excluding the user-specific copy button added above) in a conditional block: `{message.role === 'assistant' && ( ... )}`.
        *   [ ] Ensure the early returns for `isLoading` or non-string content *within* the assistant-specific block remain, or that the buttons themselves are appropriately disabled.

**Story 4: Add Subtle Distinction for User/AI Bubbles**

*   **Goal:** Improve visual separation between user and assistant messages.
*   **File Target:** `components/message.tsx` (`PurePreviewMessage`)

    *   **Task 4.1: Locate Message Content Container**
        *   [ ] Inside `PurePreviewMessage`, find the `div` that directly wraps the `<Markdown>` component when `mode === 'view'`. It likely has conditional classes already like `bg-primary`, `text-primary-foreground`, `px-3`, `py-2`, `rounded-xl` for the `user` role.

    *   **Task 4.2: Apply Styling for Assistant Messages**
        *   [ ] Modify the `className` of this container `div`. Use `cn()` for clarity.
        *   [ ] Ensure the existing user styles (`bg-primary`, `text-primary-foreground`) are applied *only* when `message.role === 'user'`.
        *   [ ] Add styles to be applied *only* when `message.role === 'assistant'`:
            *   `bg-muted/50` (or adjust existing default background if applicable)
            *   `border`
            *   `border-border/50` (for a subtle border)
            *   `px-3 py-2` (to match user padding)
            *   `rounded-xl` (to match user rounding)
            *   Example using `cn`:
                ```typescript
                className={cn(
                  'flex flex-col gap-4 break-words max-w-full overflow-hidden', // Base styles
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground px-3 py-2 rounded-xl'
                    : 'bg-muted/50 border border-border/50 px-3 py-2 rounded-xl' // Styles for assistant
                )}
                ```
        *   [ ] Remove any default padding/margin from the parent that might interfere if the background/border now handles spacing.

    *   **Task 4.3: Verify Readability**
        *   [ ] *Manual Check/AI Review:* Check both light and dark modes to ensure the distinction is clear but not visually jarring. Adjust `/50` opacity or background color (`bg-muted` vs `bg-background`) if needed for better contrast.

**Story 5: Persist Selected Persona/System Prompt**

*   **Goal:** Remember the user's last chosen system prompt across sessions.
*   **File Target:** `components/chat.tsx`

    *   **Task 5.1: Import `useLocalStorage` Hook**
        *   [ ] At the top of `components/chat.tsx`, add the import for `useLocalStorage` from `usehooks-ts`:
            ```typescript
            import { useLocalStorage } from 'usehooks-ts';
            ```

    *   **Task 5.2: Import Default System Prompt Constant**
        *   [ ] Ensure the default system prompt value is available. Import it if it's defined elsewhere (e.g., `lib/ai/config.ts`):
            ```typescript
            import { SYSTEM_PROMPT_DEFAULT } from '@/lib/ai/config'; // Adjust path if necessary
            ```
        *   [ ] *If `SYSTEM_PROMPT_DEFAULT` is not exported:* Go to `lib/ai/config.ts`, find the default prompt string, export it as a constant `SYSTEM_PROMPT_DEFAULT`, and then import it in `chat.tsx`.

    *   **Task 5.3: Replace `useState` with `useLocalStorage`**
        *   [ ] Find the state declaration for the system prompt:
            ```typescript
            const [selectedSystemPrompt, setSelectedSystemPrompt] = useState<string | undefined>(SYSTEM_PROMPT_DEFAULT);
            ```
        *   [ ] Replace it with the `useLocalStorage` hook, providing a key (e.g., `'selectedSystemPrompt'`) and the default value:
            ```typescript
            const [selectedSystemPrompt, setSelectedSystemPrompt] = useLocalStorage<string>(
              'selectedSystemPrompt', // Key for localStorage
              SYSTEM_PROMPT_DEFAULT   // Default value
            );
            ```
        *   [ ] Note: The type might change slightly; `useLocalStorage` might not return `undefined` if a default is provided. Adjust type annotations if TypeScript complains, likely changing `string | undefined` to just `string`.

    *   **Task 5.4: Verify Hook Usage**
        *   [ ] Confirm that `setSelectedSystemPrompt` is still called correctly in the `handleSystemPromptSelect` function and anywhere else it might be used. The usage should be identical to `useState`'s setter.
        *   [ ] Confirm that `selectedSystemPrompt` is still correctly passed in the `body` of the `useChat` hook options and any `append`/`handleSubmit` calls.

---

This checklist provides the necessary steps for the AI agent to implement each enhancement with minimal changes while ensuring functionality and addressing potential dependencies.
