Okay, here is the extremely detailed, step-by-step Markdown checklist designed for an AI Coding Agent to implement the UI/UX transformation.

**Constraint:** **DO NOT MODIFY ANY BACKEND LOGIC, AI INTERACTION LOGIC, DATA FETCHING/SAVING LOGIC, AUTHENTICATION LOGIC, or CORE FUNCTIONALITY.** Only focus on applying Tailwind classes, CSS modifications, minor JSX structural changes for styling purposes, and updating static configuration related to UI presentation (like suggestion lists).

---

### **Project Checklist: T3 Chat UI Transformation**

**Overall Goal:** Transform the visual appearance of the existing `madearga-chatkuka.git` codebase to match the UI/UX demonstrated in the provided T3 Chat video, preserving all existing backend and frontend logic.

---

**Epic 1: Global Styling & Theme Foundation**

*   **Goal:** Establish the core color palette, typography, and base layout settings to match the T3 Chat demo.

    ---

    **Story 1.1: Update Color Palette**
    *   **Goal:** Define and apply the primary color scheme (light and dark modes) from the target UI.
    *   **Target File:** `app/globals.css`

        *   [x] **Task 1.1.1:** Open `app/globals.css`.
        *   [x] **Task 1.1.2:** Analyze the target video's UI to determine the hexadecimal or HSL values for the following colors in *light mode*: main background, primary text, card/container backgrounds, input backgrounds, borders, primary accent (buttons/highlights), secondary accent (subtle highlights), muted text.
        *   [x] **Task 1.1.3:** Locate the `:root` block in `app/globals.css`.
        *   [x] **Task 1.1.4:** Update the HSL values for `--background`, `--foreground`, `--card`, `--card-foreground`, `--popover`, `--popover-foreground`, `--primary`, `--primary-foreground`, `--secondary`, `--secondary-foreground`, `--muted`, `--muted-foreground`, `--accent`, `--accent-foreground`, `--border`, `--input`, `--ring` to match the identified *light mode* target colors.
        *   [x] **Task 1.1.5:** Update the HSL values for `--sidebar-background`, `--sidebar-foreground`, `--sidebar-border`, etc., to match the target *light mode* sidebar colors.
        *   [x] **Task 1.1.6:** Analyze the target video's UI to determine the corresponding colors for *dark mode*.
        *   [x] **Task 1.1.7:** Locate the `.dark` block in `app/globals.css`.
        *   [x] **Task 1.1.8:** Update the HSL values for all corresponding variables within the `.dark` block to match the identified *dark mode* target colors.
        *   [x] **Task 1.1.9:** **Verify:** Run the app. Check the overall color scheme in both light and dark modes. Ensure backgrounds, text, and primary elements roughly match the target video's theme.

    ---

    **Story 1.2: Update Typography**
    *   **Goal:** Set the primary font used in the target UI.
    *   **Target Files:** `tailwind.config.ts`, `public/fonts/`, `app/layout.tsx` (potentially)

        *   [x] **Task 1.2.1:** Identify the primary sans-serif font used in the target UI video (e.g., Inter, system font).
        *   [x] **Task 1.2.2:** If the target font is different from the current 'geist', obtain the font files (e.g., WOFF2 format).
        *   [x] **Task 1.2.3:** If new font files were obtained, place them in the `public/fonts/` directory.
        *   [x] **Task 1.2.4:** If the font changed, open `tailwind.config.ts`. Update the `theme.fontFamily.sans` value to reflect the new font name (e.g., `sans: ['Inter', 'sans-serif']`).
        *   [x] **Task 1.2.5:** If the font changed, open `app/globals.css` and update or add the `@font-face` rule for the new sans-serif font, pointing to the correct file path in `public/fonts/`. Ensure the `font-family` name matches the one used in `tailwind.config.ts`.
        *   [x] **Task 1.2.6:** (If using a standard web font like 'Inter' not needing local files) Ensure the font is loaded correctly, potentially via `app/layout.tsx` if needed (though Tailwind often handles this).
        *   [x] **Task 1.2.7:** **Verify:** Run the app. Check if the primary text font matches the target UI video.

    ---

    **Story 1.3: Base Layout Adjustments**
    *   **Goal:** Ensure the fundamental page structure supports the target layout.
    *   **Target Files:** `app/layout.tsx`, `app/(chat)/layout.tsx`

        *   [x] **Task 1.3.1:** Open `app/(chat)/layout.tsx`. Confirm the structure uses `SidebarProvider`, `AppSidebar`, and `SidebarInset` containing `{children}`. (Existing structure seems correct, likely no changes needed).
        *   [x] **Task 1.3.2:** Open `app/layout.tsx`. Confirm the `ThemeProvider` wraps the `{children}`. (Existing structure seems correct).
        *   [x] **Task 1.3.3:** **Verify:** Run the app. The basic two-column structure (Sidebar + Main Content Area) should be present and functional.

---

**Epic 2: Sidebar Styling**

*   **Goal:** Restyle the sidebar, including history items, user navigation, and other elements to match the T3 Chat demo.

    ---

    **Story 2.1: Style Sidebar Container & Header**
    *   **Goal:** Apply background, border, and header styling.
    *   **Target File:** `components/app-sidebar.tsx`

        *   [x] **Task 2.1.1:** Open `components/app-sidebar.tsx`.
        *   [x] **Task 2.1.2:** Locate the main `<Sidebar>` component. Ensure its `className` prop uses `cn`.
        *   [x] **Task 2.1.3:** Apply Tailwind classes via `cn` to the `<Sidebar>` for background color (`bg-sidebar`), right border (`group-data-[side=left]:border-r`, `border-sidebar-border`), and any necessary padding or width adjustments if different from the base UI library defaults. Ensure `group-data-[side=left]:border-r-0` is present as per existing code.
        *   [x] **Task 2.1.4:** Locate the `SidebarHeader` section.
        *   [x] **Task 2.1.5:** Style the wrapping `div` inside `SidebarMenu` if needed (e.g., padding `px-2`).
        *   [x] **Task 2.1.6:** Style the "Chatbot" text (`span`) if its appearance differs (font size, weight).
        *   [x] **Task 2.1.7:** Style the "New Chat" `Button` using `cn` and the appropriate `variant` (likely 'ghost') and `size` (`p-2`, `h-fit`) to match the target's simple icon button style.
        *   [x] **Task 2.1.8:** **Verify:** Run the app. Check the sidebar's background color, border, and the appearance of the header section including the "New Chat" button.

    ---

    **Story 2.2: Style Chat History Items**
    *   **Goal:** Style the individual chat items in the history list.
    *   **Target File:** `components/sidebar-history.tsx`

        *   [x] **Task 2.2.1:** Open `components/sidebar-history.tsx`.
        *   [x] **Task 2.2.2:** Locate the `ChatItem` component.
        *   [x] **Task 2.2.3:** Examine the `SidebarMenuItem` and `SidebarMenuButton` within it.
        *   [x] **Task 2.2.4:** Ensure the `SidebarMenuButton` uses `cn`. Adjust padding (`px-2`, `py-1.5` or similar), height (`h-8` or appropriate), text size (`text-sm`), and hover states (`hover:bg-sidebar-accent`) to match the target. Ensure `flex-grow` is present.
        *   [x] **Task 2.2.5:** Style the `GlobeIcon` or `LockIcon` (size, color `text-muted-foreground`).
        *   [x] **Task 2.2.6:** Style the chat title `span` (ensure `truncate` is present).
        *   [x] **Task 2.2.7:** Style the `DropdownMenuTrigger` (`SidebarMenuAction`) containing `MoreHorizontalIcon` (size, padding, hover state). Ensure it uses `showOnHover={!isActive}` if that matches the target behavior.
        *   [x] **Task 2.2.8:** Style the `DropdownMenuContent` and `DropdownMenuItem`s (padding, text size, icon spacing) if they differ from defaults.
        *   [x] **Task 2.2.9:** **Verify:** Run the app. Check the appearance of individual chat history items, including padding, text size, icons, hover effects, and the dropdown menu styling.

    ---

    **Story 2.3: Enhance Active Chat Item Highlight**
    *   **Goal:** Make the active chat item visually distinct, matching the target highlight.
    *   **Target Files:** `app/globals.css`, `components/sidebar-history.tsx`

        *   [x] **Task 2.3.1:** Open `app/globals.css`.
        *   [x] **Task 2.3.2:** Locate the `.active-gold` class definition within `@layer components`.
        *   [x] **Task 2.3.3:** **Modify** the `@apply` rule to match the target's active state. Based on common patterns and the previous plan, this might involve a slightly darker background, a thicker left border, and bold font weight. Example: `@apply bg-amber-100 dark:bg-amber-800/30 border-l-4 border-amber-500 dark:border-amber-500 font-semibold;` (Adjust colors/thickness as needed).
        *   [x] **Task 2.3.4:** Open `components/sidebar-history.tsx`.
        *   [x] **Task 2.3.5:** Confirm the `SidebarMenuButton` within `ChatItem` applies the `active-gold` class conditionally using `isActive`. It should look similar to `className={cn('flex-grow', isActive ? 'active-gold' : '')}`. Ensure `cn` is imported and used.
        *   [x] **Task 2.3.6:** **Verify:** Run the app. Click different chat items. Confirm the active item has the new, more prominent highlight (background, border, font weight) matching the target UI video.

    ---

    **Story 2.4: Style User Navigation**
    *   **Goal:** Style the user email/avatar button and its dropdown menu.
    *   **Target File:** `components/sidebar-user-nav.tsx`

        *   [x] **Task 2.4.1:** Open `components/sidebar-user-nav.tsx`.
        *   [x] **Task 2.4.2:** Locate the `DropdownMenuTrigger` wrapping the `SidebarMenuButton`.
        *   [x] **Task 2.4.3:** Apply styling via `cn` to the `SidebarMenuButton` to match the target: background color (`bg-background` or specific), height (`h-10`), padding, border (potentially `gold-accent` if matching theme). Ensure it contains the `Image`, user email `span`, and `ChevronUp`.
        *   [x] **Task 2.4.4:** Style the `DropdownMenuContent` (width `w-[--radix-popper-anchor-width]`, padding, background, border).
        *   [x] **Task 2.4.5:** Style the `DropdownMenuItem`s (padding, text size, hover states). Ensure the "Sign out" button has appropriate destructive styling if needed (e.g., `text-destructive`). Remove `text-gold-accent` if not part of the target theme.
        *   [x] **Task 2.4.6:** **Verify:** Run the app. Check the appearance of the user info button at the bottom of the sidebar and its dropdown menu styling.

    ---

    **Story 2.5: Style Subscription Button**
    *   **Goal:** Style the "Subscription" button in the sidebar footer.
    *   **Target File:** `components/sidebar-subscription.tsx`

        *   [x] **Task 2.5.1:** Open `components/sidebar-subscription.tsx`.
        *   [x] **Task 2.5.2:** Locate the `DialogTrigger` wrapping the `SidebarMenuButton`.
        *   [x] **Task 2.5.3:** Apply styling via `cn` to the `SidebarMenuButton` to match the target's prominent "Upgrade" or "Subscription" button style. This likely involves setting a specific background (`bg-primary`), text color (`text-primary-foreground`), hover state (`hover:bg-primary/90`), padding, and ensuring the `CreditCard` icon and text are present.
        *   [x] **Task 2.5.4:** **Verify:** Run the app. Check the appearance of the Subscription button in the sidebar footer.

---

**Epic 3: Chat Header Styling**

*   **Goal:** Restyle the header above the main chat content area.

    ---

    **Story 3.1: Style Header Container**
    *   **Goal:** Apply background, border, and spacing to the header element.
    *   **Target File:** `components/chat-header.tsx`

        *   [x] **Task 3.1.1:** Open `components/chat-header.tsx`.
        *   [x] **Task 3.1.2:** Locate the main `<header>` element. Ensure its `className` prop uses `cn`.
        *   [x] **Task 3.1.3:** Apply Tailwind classes via `cn`: `sticky top-0 z-10` (already present), `bg-background`, `py-1.5`, `px-2 md:px-4`, `items-center`, `mobile-safe-area`. Add a bottom border matching the target theme (e.g., `border-b border-border` or a specific accent like `header-gold` if defined in `globals.css`). Remove `overflow-x-auto` if not needed.
        *   [x] **Task 3.1.4:** **Verify:** Run the app. Check the header's background, padding, bottom border, and stickiness.

    ---

    **Story 3.2: Style Header Controls**
    *   **Goal:** Style the buttons and selectors within the header.
    *   **Target File:** `components/chat-header.tsx`

        *   [x] **Task 3.2.1:** Ensure `cn` is imported.
        *   [x] **Task 3.2.2:** Locate the `SidebarToggle` component. Ensure its wrapping `Button` uses `variant="outline"` and appropriate padding/size (`md:px-2`, `h-8 sm:h-9` or similar).
        *   [x] **Task 3.2.3:** Locate the `ModelSelector` component. Ensure its trigger `Button` uses `variant="outline"` and appropriate padding/size/text size (`md:px-2`, `h-8 md:h-[34px]`, `text-xs sm:text-sm`). Ensure `truncate` and `ChevronDownIcon` are present.
        *   [x] **Task 3.2.4:** Locate the `VisibilitySelector`. Ensure its trigger `Button` uses `variant="outline"` and appropriate padding/size (`md:px-2`, `md:h-[34px]`). Ensure icons and text are correctly styled.
        *   [x] **Task 3.2.5:** Locate the "New Chat" `Button`. Ensure it uses `variant="outline"`, appropriate padding/size (`md:px-2`, `h-8 sm:h-9`), and potentially an accent class like `btn-gold` if defined. Ensure it contains the `PlusIcon`.
        *   [x] **Task 3.2.6:** **Verify:** Run the app. Check the appearance and alignment of all buttons and selectors in the header, ensuring they match the target UI's style (likely subtle outline buttons).

---

**Epic 4: Message Area Styling**

*   **Goal:** Restyle the chat message list and individual message bubbles.

    ---

    **Story 4.1: Style Message List Container**
    *   **Goal:** Adjust overall spacing and scrolling behavior.
    *   **Target File:** `components/messages.tsx`

        *   [x] **Task 4.1.1:** Open `components/messages.tsx`.
        *   [x] **Task 4.1.2:** Locate the main container `div` (`PureMessages`). Ensure its `className` uses `cn`.
        *   [x] **Task 4.1.3:** Add `mobile-scroll` utility class for smoother mobile scrolling.
        *   [x] **Task 4.1.4:** Adjust `gap-6`, `px-2 sm:px-4`, `pt-4` if the target UI has different spacing. Ensure `flex-1`, `overflow-y-auto` are present.
        *   [x] **Task 4.1.5:** **Verify:** Run the app. Check the spacing between messages and the overall padding of the message list area. Test scrolling on mobile/emulation.

    ---

    **Story 4.2: Style Message Bubbles**
    *   **Goal:** Apply distinct styling for user and assistant messages.
    *   **Target File:** `components/message.tsx`

        *   [x] **Task 4.2.1:** Open `components/message.tsx`.
        *   [x] **Task 4.2.2:** Locate the `PurePreviewMessage` component.
        *   [x] **Task 4.2.3:** Find the `div` that wraps the actual message content (likely inside the `map` loop for `message.parts` where `part.type === 'text'`). Ensure its `className` uses `cn`.
        *   [x] **Task 4.2.4:** Apply conditional styling based on `message.role`:
            *   **User:** Apply target user bubble styles: background color (e.g., `bg-primary text-primary-foreground` or a specific color like `bg-zinc-700 dark:text-zinc-100`), text color, padding (`px-3 py-2`), border-radius (`rounded-xl` or similar). Ensure it's right-aligned (`group-data-[role=user]/message:ml-auto`).
            *   **Assistant:** Apply target assistant bubble styles: background color (e.g., `bg-muted/50`), text color (`text-foreground`), padding (`px-3 py-2`), border (`border border-border/50`), border-radius (`rounded-xl`). Ensure it's left-aligned.
        *   [x] **Task 4.2.5:** Style the assistant icon container (`div` with `SparklesIcon`) if needed (size, background, border `ring-1 ring-border`).
        *   [x] **Task 4.2.6:** **Verify:** Run the app. Send messages. Confirm user and assistant bubbles have distinct, correct background colors, text colors, padding, and rounding matching the target video.

    ---

    **Story 4.3: Implement Message Entry Animation**
    *   **Goal:** Add a subtle fade/slide animation for new messages.
    *   **Target Files:** `components/messages.tsx`, `components/message.tsx`

        *   [x] **Task 4.3.1:** Open `components/messages.tsx`.
        *   [x] **Task 4.3.2:** Import `AnimatePresence` from `framer-motion`.
        *   [x] **Task 4.3.3:** Wrap the `messages.map(...)` block with `<AnimatePresence>`.
        *   [x] **Task 4.3.4:** Open `components/message.tsx`.
        *   [x] **Task 4.3.5:** Locate the outermost `motion.div` in `PurePreviewMessage`.
        *   [x] **Task 4.3.6:** Ensure the `initial` and `animate` props create the desired entry effect (e.g., `initial={{ y: 5, opacity: 0 }}`, `animate={{ y: 0, opacity: 1 }}`).
        *   [x] **Task 4.3.7:** Add an `exit` prop for removal animation (e.g., `exit={{ opacity: 0, y: -5, transition: { duration: 0.1 } }}`).
        *   [x] **Task 4.3.8:** Add or adjust the `transition` prop (e.g., `transition={{ duration: 0.2, ease: "easeOut" }}`).
        *   [x] **Task 4.3.9:** Add the `layout` prop to the `motion.div`.
        *   [x] **Task 4.3.10:** **Verify:** Run the app. Send new messages. Confirm they appear with a smooth fade/slide animation.

    ---

    **Story 4.4: Style Inline Content (Code, Lists)**
    *   **Goal:** Ensure markdown elements like code blocks and lists match the target style.
    *   **Target Files:** `components/markdown.tsx`, `components/code-block.tsx`, `app/globals.css`

        *   [x] **Task 4.4.1:** Open `components/code-block.tsx`. Review the styling applied to `pre` and `code` elements. Adjust background (`dark:bg-zinc-900`), padding (`p-4`), border (`border dark:border-zinc-700`), text color, and border-radius (`rounded-xl`) using `cn` if they differ from the target.
        *   [x] **Task 4.4.2:** Open `components/markdown.tsx`. Review the custom `components` mapping. Ensure list (`ol`, `ul`, `li`) styles (margin, padding, list style type) match the target. Adjust classes within the component definitions if needed.
        *   [x] **Task 4.4.3:** If broader changes are needed, open `app/globals.css` and adjust styles within the `.prose` class (likely under `@layer base`) for elements like `code::before`, `code::after`, `pre`, `ol`, `ul`, `li`.
        *   [x] **Task 4.4.4:** **Verify:** Send messages containing code blocks and lists. Check their appearance (background, spacing, padding, font, list markers) against the target UI.

---

**Epic 5: Input Area Styling**

*   **Goal:** Restyle the main chat input area, including the textarea and action buttons.

    ---

    **Story 5.1: Style Input Area Container**
    *   **Goal:** Apply the distinctive background, border, and shape to the input area wrapper.
    *   **Target File:** `components/multimodal-input.tsx` (or `components/ui/ai-input-with-search.tsx`)

        *   [x] **Task 5.1.1:** Open the relevant input component file.
        *   [x] **Task 5.1.2:** Locate the main `div` that wraps the `Textarea` and buttons (likely has `relative` class). Ensure it uses `cn`.
        *   [x] **Task 5.1.3:** Apply Tailwind classes via `cn` to match the target: background color (`bg-background` or `bg-black/5 dark:bg-white/5` based on target), border (`border dark:border-zinc-700`), border-radius (`rounded-lg` or `rounded-xl`), padding (`p-0` potentially, if padding is handled by inner elements), and potentially a subtle shadow.
        *   [x] **Task 5.1.4:** **Verify:** Run the app. Check the overall shape, background, and border of the input area container.

    ---

    **Story 5.2: Style Textarea**
    *   **Goal:** Style the text input field itself.
    *   **Target File:** `components/multimodal-input.tsx` (or `components/ui/ai-input-with-search.tsx`)

        *   [x] **Task 5.2.1:** Locate the `<Textarea>` component. Ensure its `className` prop uses `cn`.
        *   [x] **Task 5.2.2:** Apply Tailwind classes via `cn`: background (`bg-transparent` or match container), text color (`text-foreground`), placeholder color (`placeholder:text-muted-foreground` or specific like `placeholder:text-black/70 dark:placeholder:text-white/70`), padding (`px-4 py-3` or similar), remove default border (`border-0`), ensure `resize-none`, set appropriate `min-h-*`, `max-h-*`, `leading-*`.
        *   [x] **Task 5.2.3:** Add focus state classes (from Enhancement 1): `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ring`.
        *   [x] **Task 5.2.4:** **Verify:** Run the app. Check the textarea's appearance, placeholder text color, padding, and focus state.

    ---

    **Story 5.3: Style Action Buttons**
    *   **Goal:** Style the Upload, Search Toggle, and Send/Stop buttons.
    *   **Target File:** `components/multimodal-input.tsx` (or `components/ui/ai-input-with-search.tsx`)

        *   [x] **Task 5.3.1:** Locate the `div` containing the action buttons (likely `absolute right-1 bottom-1`).
        *   [x] **Task 5.3.2:** For the Search Toggle (`GlobeIcon`): Apply classes for padding (`p-1.5`), shape (`rounded-full`), background/text based on `showSearch` state (e.g., `bg-sky-500/15 text-sky-500` when active, `bg-black/5 dark:bg-white/5 text-black/40 dark:text-white/40` when inactive), hover states. Ensure icon size is correct (`size-4` or `size-18`).
        *   [x] **Task 5.3.3:** For the Upload (`PaperclipIcon`): Apply classes for padding (`p-1.5`), shape (`rounded-full`), background/text (`bg-black/5 dark:bg-white/5 text-black/40 dark:text-white/40`), hover state (`hover:text-black dark:hover:text-white`). Ensure icon size.
        *   [x] **Task 5.3.4:** For the Send/Stop (`ArrowUp`/`X`): Apply classes for padding (`p-1.5`), shape (`rounded-full`). Conditionally apply styles:
            *   **Send (enabled):** `bg-primary text-primary-foreground hover:bg-primary/90` (or target colors like sky blue)
            *   **Send (disabled):** `bg-black/5 dark:bg-white/5 text-black/40 dark:text-white/40`
            *   **Stop:** Background/text for stop state (e.g., `bg-primary/10 text-primary hover:bg-primary/20`). Ensure icon size.
        *   [x] **Task 5.3.5:** **Verify:** Run the app. Check the appearance, size, shape, colors, and hover states of all action buttons in the input area, comparing active/inactive/loading states.

    ---

    **Story 5.4: Implement "Clear Input" Button**
    *   **Goal:** Add the inline 'X' button to clear the textarea.
    *   **Target File:** `components/multimodal-input.tsx` (or `components/ui/ai-input-with-search.tsx`)

        *   [x] **Task 5.4.1:** Import `X` icon from `lucide-react` or `CrossSmallIcon` from `@/components/icons`.
        *   [x] **Task 5.4.2:** Import `Button` from `@/components/ui/button`.
        *   [x] **Task 5.4.3:** Inside the `div` wrapping the `Textarea` (likely the one with `relative`), *before* the div containing the main action buttons, add the conditional button code (from Enhancement 5).
            ```typescript
            {input.trim().length > 0 && !isLoading && ( /* Or !isSubmitting */
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-[<offset>] bottom-[<offset>] h-6 w-6 p-1 text-muted-foreground hover:text-foreground z-10"
                onClick={(e) => { /* ... clear logic ... */ }}
                aria-label="Clear input"
              >
                <X size={16} />
              </Button>
            )}
            ```
        *   [x] **Task 5.4.4:** Carefully adjust the `right-[<offset>]` and `bottom-[<offset>]` values (e.g., `right-[50px] sm:right-[60px] bottom-[10px]`) so the button is positioned correctly to the left of the main action buttons.
        *   [x] **Task 5.4.5:** Ensure the `onClick` handler correctly calls `setInput('')`, `adjustHeight(true)`, and potentially `textareaRef.current?.focus()`.
        *   [x] **Task 5.4.6:** **Verify:** Run the app. Type text. Check the clear button appears correctly positioned. Click it and verify the input clears and the button disappears. Check it's hidden when loading.

---

**Epic 6: Initial Screen Transformation**

*   **Goal:** Recreate the initial screen layout with category buttons and suggestions seen in the T3 demo.

    ---

    **Story 6.1: Replace Overview with New Layout**
    *   **Goal:** Change the initial state display from the current `Overview` component to the "How can I help you?" layout.
    *   **Target Files:** `components/chat.tsx`, `components/overview.tsx` (potentially for removal/modification)

        *   [x] **Task 6.1.1:** Open `components/chat.tsx`.
        *   [x] **Task 6.1.2:** Locate the conditional rendering logic that shows `<Overview />` when `messages.length === 0`. Modify this condition. Instead of rendering `Overview`, render the new structure.
        *   [x] **Task 6.1.3:** Add a centered container `div` (e.g., `flex flex-col items-center justify-center h-full p-4`).
        *   [x] **Task 6.1.4:** Inside the container, add a `div` for the main content (e.g., `w-full max-w-2xl mx-auto`).
        *   [x] **Task 6.1.5:** Add the `h2` heading "How can I help you?" and style it (e.g., `text-xl md:text-2xl font-semibold mb-4 text-center`).
        *   [x] **Task 6.1.6:** Remove or comment out the import and usage of the original `<Overview />` component if it's no longer needed.
        *   [x] **Task 6.1.7:** **Verify:** Run the app with no chat history selected. Confirm the "How can I help you?" heading appears centered.

    ---

    **Story 6.2: Implement Category Buttons**
    *   **Goal:** Add the `Create`, `Explore`, `Code`, `Learn` buttons.
    *   **Target Files:** `components/chat.tsx`, `lib/ai/config.ts` (for icons)

        *   [x] **Task 6.2.1:** In `components/chat.tsx`, within the main content `div` added in Story 6.1, add a `div` to hold the category buttons (e.g., `flex flex-wrap justify-center gap-2 mb-6`).
        *   [x] **Task 6.2.2:** Import necessary icons (e.g., `Sparkles`, `BookOpenText`, `Code`, `Lightbulb` from `lucide-react` or map existing icons in `lib/ai/config.ts`).
        *   [x] **Task 6.2.3:** Import `Button` from `@/components/ui/button`.
        *   [x] **Task 6.2.4:** Create four `Button` components, one for each category (`Create`, `Explore`, `Code`, `Learn`).
        *   [x] **Task 6.2.5:** Style the buttons using `cn` to match the target (likely `variant="outline"`, `size="sm"`, `rounded-full`, specific padding `py-1.5 px-3`, text size, icon spacing `gap-1.5`).
        *   [x] **Task 6.2.6:** Add the corresponding icon and text label to each button.
        *   [x] **Task 6.2.7:** Add an `onClick` handler to each button that will likely update a state variable controlling which set of suggestions to display (this state might need to be added). For now, a `console.log` placeholder is acceptable.
        *   [x] **Task 6.2.8:** **Verify:** Run the app. Check that the four category buttons appear below the heading, styled correctly with icons.

    ---

    **Story 6.3: Update Suggestion Configuration**
    *   **Goal:** Align the predefined suggestions with those shown in the target UI video.
    *   **Target File:** `lib/ai/config.ts`

        *   [x] **Task 6.3.1:** Open `lib/ai/config.ts`.
        *   [x] **Task 6.3.2:** Locate the `SUGGESTIONS` array.
        *   [x] **Task 6.3.3:** Modify the objects within the array. Ensure the `label` properties match the target categories (`Create`, `Explore`, `Code`, `Learn`). Update the associated `icon`.
        *   [x] **Task 6.3.4:** Update the `items` array for *each* category object to contain the exact example prompts shown in the video for that category.
        *   [x] **Task 6.3.5:** Remove the `highlight` and `prompt` keys from the category objects if they are not used by the target UI's suggestion display logic (the target seems to just list prompts).
        *   [x] **Task 6.3.6:** **Verify:** Review the `SUGGESTIONS` array in the code to confirm it matches the prompts shown under each category in the video.

    ---

    **Story 6.4: Adapt Suggestion Display Component**
    *   **Goal:** Ensure the `Suggestions` component displays the category buttons and then the relevant prompts upon selection.
    *   **Target Files:** `components/chat-input/suggestions.tsx`, `components/chat-input/prompt-system.tsx`

        *   [x] **Task 6.4.1:** Open `components/chat-input/prompt-system.tsx`. Remove the `Personas` component and the toggle button logic, as the target UI seems to focus only on suggestions based on categories. The component should now primarily render the `Suggestions` component.
        *   [x] **Task 6.4.2:** Open `components/chat-input/suggestions.tsx`.
        *   [x] **Task 6.4.3:** Modify the component's logic. Instead of toggling between categories and items based on `activeCategory`, it should potentially always show the category *buttons* from Story 6.2 and the corresponding list of suggestion prompts below them (or switch view based on a button click). *Correction:* The video shows buttons *then* suggestions.
        *   [x] **Task 6.4.4:** Refactor `Suggestions` (or the logic in `Chat`/`PromptSystem`):
            *   Add state to track the *selected* category (e.g., `selectedCategory`, initially `null` or the first category).
            *   Render the category buttons (from Story 6.2). Update their `onClick` handlers to set the `selectedCategory` state.
            *   Conditionally render the list of suggestion prompts (`activeCategoryData.items`) based on the `selectedCategory` state.
            *   Use `AnimatePresence` and `motion.div` for the transition between the category list and the prompt list if desired.
            *   Style the suggestion prompt items (likely simple text elements or subtle buttons) to match the target.
        *   [x] **Task 6.4.5:** Ensure the `onSuggestion` prop is called correctly when a specific prompt item is clicked.
        *   [x] **Task 6.4.6:** **Verify:** Run the app. Check that the category buttons are shown initially. Clicking a category button should display the corresponding list of example prompts from the config file, styled appropriately. Clicking a prompt should trigger the `onSuggestion` function.

---

**Epic 7: Final Polish & Verification**

*   **Goal:** Ensure UI consistency, address minor details, and perform final checks.

    ---

    **Story 7.1: Ensure Tooltip Consistency**
    *   **Goal:** Verify all icon-only buttons have descriptive tooltips.
    *   **Target Files:** `components/sidebar-toggle.tsx`, `components/message-actions.tsx`, `components/artifact-actions.tsx`, `components/toolbar.tsx`, `components/ui/tooltip.tsx`

        *   [x] **Task 7.1.1:** Systematically review each component file listed above.
        *   [x] **Task 7.1.2:** For every `<Button variant="ghost" size="icon">` or similar icon-only button, ensure it is wrapped with `<Tooltip>`, `<TooltipTrigger asChild>`, and `<TooltipContent>`.
        *   [x] **Task 7.1.3:** Ensure a `<TooltipProvider>` wraps the relevant sections or the entire application layout (`app/layout.tsx` or `app/(chat)/layout.tsx`).
        *   [x] **Task 7.1.4:** **Verify:** Run the app and hover over *all* icon-only buttons across the sidebar, chat header, message actions, artifact actions, and artifact toolbar. Confirm descriptive tooltips appear correctly.

    ---

    **Story 7.2: Final Visual Review & Minor Adjustments**
    *   **Goal:** Catch any remaining visual discrepancies compared to the target video.
    *   **Target Files:** Various CSS and component files.

        *   [x] **Task 7.2.1:** Open the application and the target video side-by-side.
        *   [x] **Task 7.2.2:** Compare each major section (Sidebar, Header, Chat Area, Input) in both light and dark modes.
        *   [x] **Task 7.2.3:** Identify any minor differences in padding, margin, border-radius, font sizes, font weights, or specific element alignments.
        *   [x] **Task 7.2.4:** Locate the relevant component or CSS rule (`globals.css`) and apply the necessary small adjustments using `cn` or direct CSS modifications.
        *   [x] **Task 7.2.5:** Pay attention to hover states and focus states for interactive elements.
        *   [x] **Task 7.2.6:** **Verify:** The overall look and feel closely matches the target video across different sections and modes.

    ---

    **Story 7.3: Logic Preservation Check**
    *   **Goal:** Perform a quick functional check to ensure core logic wasn't inadvertently broken.
    *   **Target Files:** N/A (Interaction testing)

        *   [x] **Task 7.3.1:** Run the application locally.
        *   [x] **Task 7.3.2:** Send a basic message. **Verify:** Receives a response.
        *   [x] **Task 7.3.3:** If search was functional before, try toggling search and sending a query. **Verify:** Search indicators/results appear (or the expected behavior if search wasn't fully implemented).
        *   [x] **Task 7.3.4:** If file uploads were functional, try uploading a file. **Verify:** Upload UI works as expected.
        *   [x] **Task 7.3.5:** If artifacts were functional, try creating a simple artifact (e.g., "create a text document titled hello"). **Verify:** Artifact panel opens and displays content.
        *   [x] **Task 7.3.6:** Test light/dark mode toggle. **Verify:** Theme switches correctly.
        *   [x] **Task 7.3.7:** Test sidebar toggle. **Verify:** Sidebar collapses/expands.
        *   [x] **Task 7.3.8:** Test creating a new chat. **Verify:** A new chat session starts.
        *   [x] **Task 7.3.9:** (If applicable) Test login/logout flow briefly. **Verify:** Authentication state is maintained.

---