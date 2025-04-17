Okay, let's create an extremely detailed, step-by-step Markdown checklist to enhance the Text Artifact UI, mimicking the layout seen in the Grok inspiration image. This checklist is designed for a competent AI Coding Agent, ensuring minimal disruption to existing functionality.

**Project Goal:** Refactor the Text Artifact UI to position the formatting toolbar as a sticky header directly above the content editing area, remove excessive padding, and ensure a more integrated look, mirroring the provided inspiration image, without breaking any existing Text Artifact features (editing, saving, suggestions, versioning, diff view) or affecting other artifact types.

**Core Constraints:**

1.  **Zero Functional Regression:** All existing Text Artifact functionalities (typing, applying formats, saving content via `onSaveContent`, suggestion display/interaction, version navigation, diff view) MUST remain fully operational.
2.  **No Impact on Other Artifacts:** Changes must be scoped *only* to the `text` artifact type. Code, Image, and Sheet artifacts must render and function exactly as before.
3.  **Responsiveness:** The new layout must work correctly on both desktop and mobile views.
4.  **Minimal Code Intrusion:** Achieve the goal with the fewest necessary changes, primarily focusing on component structure and styling within the text artifact context.
5.  **Styling Consistency:** The toolbar and editor should feel integrated with the artifact panel's theme (light/dark).

---

### **Project Checklist: Enhance Text Artifact UI Layout**

---

#### **Story 1: Relocate Text Editor Toolbar**

**Goal:** Move the `TextEditorToolbar` component from within the `Editor` component to the parent component responsible for rendering the text artifact content (`artifacts/text/client.tsx`) so it can be positioned correctly above the editor area.

**Target Files:**

*   `components/text-editor.tsx` (Remove toolbar invocation)
*   `artifacts/text/client.tsx` (Add toolbar invocation and manage state/refs)

**Tasks:**

*   [x] **1.1: Open `components/text-editor.tsx`:** Locate the `PureEditor` component.
*   [x] **1.2: Identify Toolbar Invocation:** Find the line where `<TextEditorToolbar ... />` is rendered.
*   [x] **1.3: Remove Toolbar Invocation:** Delete the `<TextEditorToolbar ... />` invocation line from `PureEditor`'s return statement.
*   [x] **1.4: Expose EditorView State:**
    *   The parent (`artifacts/text/client.tsx`) now needs access to the `editorView` instance to pass to the toolbar.
    *   Modify `PureEditor` props interface (`EditorProps`) to accept an optional callback prop, e.g., `onEditorViewChange?: (view: EditorView | null) => void;`.
    *   Inside `PureEditor`, within the first `useEffect` where `editorRef.current` is initialized, call this new prop: `onEditorViewChange?.(editorRef.current);`.
    *   In the `useEffect` cleanup function, call it with null: `onEditorViewChange?.(null);`.
*   [x] **1.5: Save `components/text-editor.tsx`:** Save the changes.
*   [x] **1.6: Open `artifacts/text/client.tsx`:** Locate the `textArtifact` definition.
*   [x] **1.7: Import Toolbar:** Add the import for `TextEditorToolbar`: `import { TextEditorToolbar } from '@/components/TextEditorToolbar';`.
*   [x] **1.8: Import State Hook:** Add `useState` import from React: `import { useState } from 'react';`.
*   [x] **1.9: Add EditorView State:** Inside the `content` function component definition within `textArtifact`, add a state variable to hold the `EditorView` instance:
    ```typescript
    const [editorViewInstance, setEditorViewInstance] = useState<EditorView | null>(null);
    ```
*   [x] **1.10: Pass Callback to Editor:** Locate the `<Editor ... />` invocation within the `content` function. Pass the new `onEditorViewChange` prop:
    ```diff
      <Editor
        // ... existing props
        content={content}
        suggestions={metadata ? metadata.suggestions : []}
        isCurrentVersion={isCurrentVersion}
        currentVersionIndex={currentVersionIndex}
        status={status}
        onSaveContent={onSaveContent}
+       onEditorViewChange={setEditorViewInstance} // Pass the state setter
      />
    ```
*   [x] **1.11: Render Toolbar Conditionally:** Inside the `content` function, *before* the container `div` that wraps the `Editor` or `DiffView`, add the `TextEditorToolbar`. Render it only in 'edit' mode. Pass the necessary props.
    ```typescript
    // Inside the content function of artifacts/text/client.tsx

    const [editorViewInstance, setEditorViewInstance] = useState<EditorView | null>(null);

    // ... (existing loading/diff logic) ...

    // In the return statement for 'edit' mode:
    return (
      <>
        {/* Render toolbar ONLY in edit mode and when editorView is available */}
        {mode === 'edit' && editorViewInstance && (
          <TextEditorToolbar
            editorView={editorViewInstance}
            isDisabled={status === 'streaming' || !isCurrentVersion}
          />
        )}
        {/* Keep the existing container for the Editor/DiffView */}
        <div className="flex flex-row py-8 md:p-20 px-4"> {/* Padding will be adjusted later */}
           <Editor
             // ... existing props ...
             onEditorViewChange={setEditorViewInstance}
           />
           {/* ... potentially suggestions sidebar ... */}
         </div>
      </>
    );
    ```
*   [x] **1.12: Save `artifacts/text/client.tsx`:** Save the changes.
*   [x] **1.13: Verification (Conceptual):** The toolbar should now be rendered by the artifact client component, positioned structurally *before* the editor's main container. It receives the `editorView` instance via state updated by the `Editor` component.

---

#### **Story 2: Adjust Toolbar Styling and Positioning**

**Goal:** Make the relocated toolbar sticky at the top of the artifact content area and visually integrate it.

**Target Files:**

*   `components/TextEditorToolbar.tsx` (Modify styling)
*   `artifacts/text/client.tsx` (Ensure proper placement context)

**Tasks:**

*   [x] **2.1: Open `components/TextEditorToolbar.tsx`:** Locate the main `div` element.
*   [x] **2.2: Verify Sticky Positioning:** Ensure the classes `sticky top-0 z-10` (or similar high z-index) are present. *Keep these*.
*   [x] **2.3: Remove Background/Blur/Shadow:** Remove classes like `bg-muted/80`, `backdrop-blur`, `shadow-md`.
*   [x] **2.4: Adjust Border:** Keep `border-b border-border/50` for separation, or remove it if the design requires complete seamlessness (the inspiration seems to have a subtle separator). Let's keep `border-b` for now.
*   [x] **2.5: Adjust Padding:** Ensure padding is appropriate (e.g., `px-2 py-1` or `px-4 py-2`) for spacing within the toolbar itself. Keep existing reasonable padding.
*   [x] **2.6: Modify Background (Optional):** Add `bg-background` (or `dark:bg-muted` if matching the `document-preview.tsx` header) to ensure it blends with the artifact panel background *if necessary* after removing the blur/original background. Let's add `bg-background` for now to ensure it covers scrolled content.
    ```diff
      <div className={cn(
        "sticky top-0 z-10 flex items-center gap-1 border-b border-border/50",
-       "bg-muted/80 backdrop-blur", // REMOVE
+       "bg-background", // ADD
        "px-2 py-1", // KEEP or ADJUST
-       "rounded-md shadow-md", // REMOVE
        "mb-2" // KEEP or REMOVE depending on desired spacing below toolbar
      )}>
        {/* ... buttons ... */}
      </div>
    ```
*   [x] **2.7: Save `components/TextEditorToolbar.tsx`:** Save the changes.
*   [x] **2.8: Verify Placement Context (`artifacts/text/client.tsx`):** Double-check that the `<TextEditorToolbar />` in `artifacts/text/client.tsx` is placed *directly* inside the main scrollable container for the artifact content, *before* the `div` that holds the `<Editor />`, so that `sticky top-0` works relative to the artifact panel's content area. The structure should resemble:
    ```jsx
    // Inside content function return (simplified):
    <>
        {/* Toolbar is now here */}
        {mode === 'edit' && editorViewInstance && (
          <TextEditorToolbar editorView={editorViewInstance} isDisabled={...} />
        )}
        {/* Container for the actual editor */}
        <div className="editor-content-container flex flex-row /* Adjusted padding here */">
            <Editor {...props} onEditorViewChange={setEditorViewInstance} />
            {/* Suggestions sidebar if applicable */}
        </div>
    </>
    ```
*   [x] **2.9: Verification (Visual):** Run the app. Open a text artifact. The toolbar should appear at the top of the content area, have a plain background matching the panel, and remain fixed at the top when scrolling the editor content below it.

---

#### **Story 3: Adjust Editor Container Layout**

**Goal:** Remove the excessive padding around the text editor area to match the inspiration's layout, allowing content to fill the space below the sticky toolbar.

**Target File:** `artifacts/text/client.tsx`

**Tasks:**

*   [x] **3.1: Open `artifacts/text/client.tsx`:** Locate the `content` function within the `textArtifact` definition.
*   [x] **3.2: Find Editor Container:** Identify the `div` element that directly wraps the `<Editor />` component (likely the one modified in Step 1.11 or its child). It currently has classes like `flex flex-row py-8 md:p-20 px-4`.
*   [x] **3.3: Remove Excessive Padding:** Delete the classes `py-8 md:p-20 px-4`.
*   [x] **3.4: Add Minimal Padding:** Add appropriate minimal padding classes for spacing around the editor content, e.g., `p-4` or `p-6`. This padding should apply *around* the editor itself.
    ```diff
      // Inside the content function, find the div wrapping <Editor>
      <div className={cn(
        "flex flex-row",
-       "py-8 md:p-20 px-4", // REMOVE
+       "p-4", // ADD (or p-6, adjust as needed)
        "flex-grow" // Ensure it takes available space if needed
        )}>
          <Editor
            // ... props ...
          />
          {/* ... suggestions sidebar might be here ... */}
      </div>
    ```
*   [x] **3.5: Ensure Editor Styling (`components/text-editor.tsx`):**
    *   Open `components/text-editor.tsx`.
    *   Locate the `div` with `ref={containerRef}` (the ProseMirror mount point).
    *   Ensure it *still* has the `prose dark:prose-invert` classes (or equivalent base styling) so the text itself is styled correctly.
    *   Remove any `mt-2` or similar top margin if it exists on this element, as spacing is now controlled by the parent padding and the sticky toolbar.
    ```diff
    // Inside components/text-editor.tsx PureEditor return:
     <div className="relative flex flex-col">
       {/* Toolbar was removed from here */}
-      <div className="prose dark:prose-invert mt-2" ref={containerRef} />
+      <div className="prose dark:prose-invert w-full" ref={containerRef} /> {/* Remove mt-2, ensure width */}
     </div>
    ```
*   [x] **3.6: Save Files:** Save changes to both `artifacts/text/client.tsx` and `components/text-editor.tsx`.
*   [x] **3.7: Verification (Visual):** Run the app. Open a text artifact. The editor content area should now have significantly less padding around it. Text should start closer to the sticky toolbar and extend closer to the panel edges (respecting the new minimal padding). The text *inside* the editor should still have appropriate `prose` styling (margins between paragraphs, list styling etc.).

---

#### **Story 4: Comprehensive Testing and Regression Checks**

**Goal:** Verify the new layout works correctly under all conditions and that no existing text artifact functionality or other application parts have been broken.

**Target Files:** Running Application (`bun run dev`)

**Tasks:**

*   [x] **4.1: Toolbar Functionality:**
    *   [x] Click each button on the sticky toolbar (Bold, Italic, Lists, Quote, etc.). **Verify:** Formatting is applied correctly to the selected text in the editor below.
    *   [x] **Verify:** Buttons are appropriately disabled when `status === 'streaming'` or `!isCurrentVersion`.
*   [x] **4.2: Toolbar Stickiness:**
    *   [x] Create or open a text artifact with enough content to require scrolling.
    *   [x] Scroll the editor content up and down. **Verify:** The toolbar remains fixed at the very top of the artifact content area.
*   [x] **4.3: Editor Functionality:**
    *   [x] Type new text into the editor. **Verify:** Text appears correctly styled.
    *   [x] Edit existing text. **Verify:** Changes are reflected.
    *   [x] **Verify:** Content saving mechanism (`onSaveContent` with debounce) still triggers correctly after edits. Check network tab or logs if necessary.
    *   [x] Trigger suggestions (if applicable, e.g., via toolbar action). **Verify:** Suggestions appear correctly relative to the text and are interactive. Applying a suggestion works.
*   [x] **4.4: Versioning and Diff View:**
    *   [x] Make edits to create a new version.
    *   [x] Use the Undo/Redo (Previous/Next Version) buttons in the *main artifact header* (not the text editor toolbar). **Verify:** Navigation between versions works.
    *   [x] Enter Diff view mode ('View Changes' button). **Verify:** The diff view renders correctly *without* the text editor toolbar being visible. **Verify:** The diff content respects the new minimal padding.
    *   [x] Exit Diff view ('Back to Latest' or similar). **Verify:** Returns to edit mode with the toolbar visible.
*   [x] **4.5: Layout & Styling:**
    *   [x] Check the layout in both **Light Mode** and **Dark Mode**. **Verify:** Toolbar background, editor background, and text colors are correct and legible in both themes.
    *   [x] Check padding around the editor content area. **Verify:** It matches the minimal padding set (e.g., `p-4`).
*   [x] **4.6: Responsiveness:**
    *   [x] Resize the browser window or use browser developer tools to simulate different screen sizes (desktop, tablet, mobile).
    *   [x] **Verify:** The sticky toolbar behaves correctly on smaller screens.
    *   [x] **Verify:** The editor content area adapts and remains usable.
    *   [x] **Verify:** Toolbar buttons don't overflow or wrap awkwardly.
*   [x] **4.7: No Regression on Other Artifacts:**
    *   [x] Create/Open a **Code Artifact**. **Verify:** Its layout, toolbar (if any specific to it), and functionality are unchanged.
    *   [x] Create/Open an **Image Artifact**. **Verify:** Its layout and functionality are unchanged.
    *   [x] Create/Open a **Sheet Artifact**. **Verify:** Its layout and functionality are unchanged.
*   [x] **4.8: No Regression on Core Chat:**
    *   [x] Interact with the main chat interface. **Verify:** Sending messages, receiving responses, history, search, model selection, etc., all work as before.
*   [x] **4.9: Console Check:** Monitor the browser's developer console and `bun run dev` output for any new errors or warnings during testing.

---

**Completion Criteria:** The Text Artifact UI now features a sticky toolbar at the top of its content area, minimal padding around the editor, and an integrated visual appearance. All text artifact functionalities (editing, saving, suggestions, versioning, diff view) are confirmed working. No other artifact types or core application features show any regressions. The layout is responsive and works in both light and dark modes.