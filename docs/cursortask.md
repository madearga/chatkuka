Okay, here is a highly detailed, step-by-step checklist for implementing the Basic Formatting Toolbar for the Text Artifact's ProseMirror editor. This is designed for an AI Coding Agent to follow.

**Project Goal:** Add a formatting toolbar (Bold, Italic, Strikethrough, Code, Lists, Blockquote, Link) to the Text Artifact editor (`components/text-editor.tsx`) using ProseMirror commands and reflecting the current selection state.

**Primary Files:**
*   `components/TextEditorToolbar.tsx` (New File)
*   `components/text-editor.tsx` (Modification)
*   `lib/editor/config.ts` (Potential Modification for Strikethrough)
*   `components/ui/button.tsx` (Usage)
*   `lucide-react` / `components/icons.tsx` (Usage for Icons)
*   `components/ui/tooltip.tsx` (Usage)
*   `components/ui/dialog.tsx` or `components/ui/popover.tsx` (Usage for Link Modal)
*   `components/ui/input.tsx` (Usage for Link Modal)
*   `components/ui/label.tsx` (Usage for Link Modal)

---

### **Story 1: Create Toolbar UI Component Structure**

*   **Goal:** Set up the basic visual structure and props for the toolbar component.
*   **Tasks:**
    *   [x] Create new file: `components/TextEditorToolbar.tsx`.
    *   [x] Add `'use client';` directive at the top of `TextEditorToolbar.tsx`.
    *   [x] Import React and necessary types (`FC`, `useState`, etc.).
    *   [x] Import `EditorView` type from `prosemirror-view`.
    *   [x] Import the `Button` component from `@/components/ui/button`.
    *   [x] Import necessary icons from `lucide-react`: `Bold`, `Italic`, `Strikethrough`, `Code`, `ListOrdered`, `List`, `Quote`, `Link2`, `Unlink`.
    *   [x] Import `Tooltip`, `TooltipContent`, `TooltipProvider`, `TooltipTrigger` from `@/components/ui/tooltip`.
    *   [x] Define the `TextEditorToolbarProps` interface:
        ```typescript
        import { EditorView } from 'prosemirror-view';

        interface TextEditorToolbarProps {
          editorView: EditorView | null;
          isDisabled: boolean;
        }
        ```
    *   [x] Define the `TextEditorToolbar: FC<TextEditorToolbarProps>` component.
    *   [x] Inside the component, render a `TooltipProvider`.
    *   [x] Inside the `TooltipProvider`, render a container `div` for the toolbar (e.g., `flex items-center gap-1 border-b border-border px-2 py-1 bg-muted rounded-t-md`).
    *   [x] Add placeholder `Button` components wrapped in `Tooltip` and `TooltipTrigger` for each action: Bold, Italic, Strikethrough, Code, Ordered List, Bullet List, Blockquote, Link.
    *   [x] Use `variant="ghost"` and a small size (e.g., `size="sm"` or custom `h-7 w-7 p-1`) for the buttons.
    *   [x] Add `aria-label` and `TooltipContent` to each button describing its action (e.g., "Bold", "Insert Ordered List").
    *   [x] Pass the `isDisabled` prop to each `Button`'s `disabled` attribute.
    *   [x] Add temporary `onClick` handlers to each button (e.g., `onClick={() => console.log('Bold clicked')}`).

---

### **Story 2: Integrate Toolbar with Text Editor Component**

*   **Goal:** Render the toolbar within the editor component and provide it with the necessary editor instance.
*   **Tasks:**
    *   [x] Open `components/text-editor.tsx`.
    *   [x] Import the newly created `TextEditorToolbar` component.
    *   [x] In the `PureEditor` component's return statement, render `<TextEditorToolbar editorView={editorRef.current} isDisabled={status === 'streaming' || !isCurrentVersion} />` *before* the `<div ref={containerRef} />`.
    *   [x] Ensure the `editorRef` (which holds the `EditorView` instance) is correctly passed as the `editorView` prop.

---

### **Story 3: Implement Mark Toggling Logic (Bold, Italic, Strikethrough, Code)**

*   **Goal:** Make the Bold, Italic, Strikethrough, and Code buttons apply/remove the corresponding ProseMirror marks.
*   **Tasks:**
    *   [x] Open `lib/editor/config.ts`.
    *   [x] Check if `strikethrough` mark exists in `documentSchema.spec.marks`. If not, add it:
        ```typescript
        // Inside marks: { ... }
        strikethrough: {
          parseDOM: [{ tag: "s" }, { tag: "del" }, { tag: "strike" }, { style: "text-decoration=line-through" }],
          toDOM: () => ["s", 0]
        }
        ```
    *   [x] Open `components/TextEditorToolbar.tsx`.
    *   [x] Import `toggleMark` command from `prosemirror-commands`.
    *   [x] Import `documentSchema` from `lib/editor/config.ts`.
    *   [x] Create a helper function `runCommand` within `TextEditorToolbar`:
        ```typescript
        const runCommand = (command: (state: EditorState, dispatch?: (tr: Transaction) => void, view?: EditorView) => boolean) => {
          if (!editorView) return;
          command(editorView.state, editorView.dispatch, editorView);
          editorView.focus(); // Keep focus in the editor
        };
        ```
    *   [x] Replace the placeholder `onClick` for the Bold button with: `onClick={() => runCommand(toggleMark(documentSchema.marks.strong))}`.
    *   [x] Replace the placeholder `onClick` for the Italic button with: `onClick={() => runCommand(toggleMark(documentSchema.marks.em))}`.
    *   [x] Replace the placeholder `onClick` for the Strikethrough button with: `onClick={() => runCommand(toggleMark(documentSchema.marks.strikethrough))}`.
    *   [x] Replace the placeholder `onClick` for the Code button with: `onClick={() => runCommand(toggleMark(documentSchema.marks.code))}`.

---

### **Story 4: Implement Block Node Wrapping/Toggling Logic (Lists, Blockquote)**

*   **Goal:** Make the List and Blockquote buttons wrap/unwrap selected text or change the current block type.
*   **Tasks:**
    *   [x] Open `components/TextEditorToolbar.tsx`.
    *   [x] Import `wrapIn`, `setBlockType`, `lift` from `prosemirror-commands`.
    *   [x] Import `wrapInList`, `liftListItem`, `sinkListItem` from `prosemirror-schema-list`.
    *   [x] Import Node types (`ordered_list`, `bullet_list`, `blockquote`, `paragraph`) from `lib/editor/config.ts`.
    *   [x] Define a command to toggle blockquotes (wrap in or lift out):
        ```typescript
        const toggleBlockquote = (state: EditorState, dispatch?: (tr: Transaction) => void, view?: EditorView) => {
          // Check if selection is inside a blockquote
          let { $from, $to } = state.selection;
          let range = $from.blockRange($to);
          if (!range) return false;
          let parent = range.parent;
          if (parent.type === documentSchema.nodes.blockquote) {
            return lift(state, dispatch); // Lift out if already inside
          } else {
            return wrapIn(documentSchema.nodes.blockquote)(state, dispatch); // Wrap if not
          }
        };
        ```
    *   [x] Define a command to toggle ordered lists:
        ```typescript
        const toggleOrderedList = (state: EditorState, dispatch?: (tr: Transaction) => void, view?: EditorView) => {
          // Check if selection is inside an ordered list
          let { $from, $to } = state.selection;
          let range = $from.blockRange($to);
          if (!range) return false;
          let parent = range.parent;
          // Check if parent or grandparent is an ordered list
          if ((parent.type === documentSchema.nodes.ordered_list) || (range.depth >= 2 && range.$from.node(range.depth - 1).type === documentSchema.nodes.ordered_list)) {
            // Try to lift item first, if fails, set back to paragraph
            return liftListItem(documentSchema.nodes.list_item)(state, dispatch) || setBlockType(documentSchema.nodes.paragraph)(state, dispatch);
          } else {
            return wrapInList(documentSchema.nodes.ordered_list)(state, dispatch);
          }
        };
        ```
    *   [x] Define a command to toggle bullet lists (similar logic to ordered list):
        ```typescript
        const toggleBulletList = (state: EditorState, dispatch?: (tr: Transaction) => void, view?: EditorView) => {
          let { $from, $to } = state.selection;
          let range = $from.blockRange($to);
          if (!range) return false;
          let parent = range.parent;
          if ((parent.type === documentSchema.nodes.bullet_list) || (range.depth >= 2 && range.$from.node(range.depth - 1).type === documentSchema.nodes.bullet_list)) {
             return liftListItem(documentSchema.nodes.list_item)(state, dispatch) || setBlockType(documentSchema.nodes.paragraph)(state, dispatch);
          } else {
            return wrapInList(documentSchema.nodes.bullet_list)(state, dispatch);
          }
        };
        ```
    *   [x] Replace the placeholder `onClick` for the Ordered List button with: `onClick={() => runCommand(toggleOrderedList)}`.
    *   [x] Replace the placeholder `onClick` for the Bullet List button with: `onClick={() => runCommand(toggleBulletList)}`.
    *   [x] Replace the placeholder `onClick` for the Blockquote button with: `onClick={() => runCommand(toggleBlockquote)}`.

---

### **Story 5: Implement Toolbar State Synchronization (Active Buttons)**

*   **Goal:** Visually indicate which formatting options are active based on the cursor position or selection.
*   **Tasks:**
    *   [ ] Open `components/TextEditorToolbar.tsx`.
    *   [ ] Import `useEffect`, `useState` from `react`.
    *   [ ] Import `MarkType`, `NodeType` from `prosemirror-model`.
    *   [ ] Define state variables for each button's active status:
        ```typescript
        const [isBoldActive, setIsBoldActive] = useState(false);
        const [isItalicActive, setIsItalicActive] = useState(false);
        const [isStrikeActive, setIsStrikeActive] = useState(false);
        const [isCodeActive, setIsCodeActive] = useState(false);
        const [isOlActive, setIsOlActive] = useState(false);
        const [isUlActive, setIsUlActive] = useState(false);
        const [isQuoteActive, setIsQuoteActive] = useState(false);
        const [isLinkActive, setIsLinkActive] = useState(false);
        // ... add more as needed
        ```
    *   [ ] Create a helper function `isMarkActiveCheck` (takes `state: EditorState`, `markType: MarkType`):
        ```typescript
        const isMarkActiveCheck = (state: EditorState, markType: MarkType): boolean => {
          const { from, $from, to, empty } = state.selection;
          if (empty) {
            return !!markType.isInSet(state.storedMarks || $from.marks());
          } else {
            return state.doc.rangeHasMark(from, to, markType);
          }
        };
        ```
    *   [ ] Create a helper function `isBlockActiveCheck` (takes `state: EditorState`, `nodeType: NodeType`, `attrs = {}`):
        ```typescript
         const isBlockActiveCheck = (state: EditorState, nodeType: NodeType, attrs = {}): boolean => {
          const { $from, to, node } = state.selection;
          if (node) {
            return node.hasMarkup(nodeType, attrs);
          }
          // Check if selection spans multiple blocks or is within the target block type
          return to <= $from.end() && $from.parent.hasMarkup(nodeType, attrs);
          // More robust check might be needed for list items specifically
         };
        ```
    *   [ ] Add a `useEffect` hook that runs when `editorView?.state` changes (this requires the state to be passed down or polled). *Alternative:* Use ProseMirror's `updateState` prop modification. Let's modify `text-editor.tsx` first.
    *   [ ] *Modify `components/text-editor.tsx`:*
        *   [ ] Add state for the toolbar's active status: `const [toolbarState, setToolbarState] = useState({...});` (object with boolean for each format).
        *   [ ] Update the `handleTransaction` function (or add an `updateState` prop to the `EditorView` constructor/`setProps`). In the part where `newState` is calculated:
            ```typescript
            // Inside handleTransaction or updateState
            const newState = editorRef.current.state.apply(transaction);
            editorRef.current.updateState(newState);

            // --> Add state update logic here <--
            const currentToolbarState = {
                isBoldActive: isMarkActiveCheck(newState, documentSchema.marks.strong),
                isItalicActive: isMarkActiveCheck(newState, documentSchema.marks.em),
                isStrikeActive: isMarkActiveCheck(newState, documentSchema.marks.strikethrough),
                isCodeActive: isMarkActiveCheck(newState, documentSchema.marks.code),
                isOlActive: isBlockActiveCheck(newState, documentSchema.nodes.ordered_list) || /* check for list_item parent */ false, // More robust check needed
                isUlActive: isBlockActiveCheck(newState, documentSchema.nodes.bullet_list) || /* check for list_item parent */ false, // More robust check needed
                isQuoteActive: isBlockActiveCheck(newState, documentSchema.nodes.blockquote),
                isLinkActive: isMarkActiveCheck(newState, documentSchema.marks.link),
            };
            setToolbarState(currentToolbarState);
            // ... rest of the function (saving content etc.)
            ```
        *   [ ] Pass `toolbarState` down to the `TextEditorToolbar` component.
    *   [ ] *Modify `components/TextEditorToolbar.tsx`:*
        *   [ ] Add `toolbarState` to `TextEditorToolbarProps`.
        *   [ ] Remove the local `useState` hooks for active statuses created earlier.
        *   [ ] Use the `toolbarState` prop to conditionally set the `variant` or `className` of each `Button`. Example for Bold:
            ```typescript
            <Button
              variant={toolbarState.isBoldActive ? "secondary" : "ghost"}
              // ... other props
            >
              <Bold />
            </Button>
            ```
        *   [ ] Ensure the active style provides clear visual feedback (e.g., `bg-accent`).

---

### **Story 6: Implement Link Functionality**

*   **Goal:** Allow users to add, edit, and remove hyperlinks on selected text.
*   **Tasks:**
    *   [ ] Open `components/TextEditorToolbar.tsx`.
    *   [ ] Import UI components for a modal/popover: `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogFooter` (or `Popover`, `PopoverContent`, etc.). Import `Input`, `Label`.
    *   [ ] Import `link` mark type from `lib/editor/config.ts`.
    *   [ ] Add state variables for the link modal:
        ```typescript
        const [showLinkDialog, setShowLinkDialog] = useState(false);
        const [linkUrl, setLinkUrl] = useState('');
        const [linkInitialText, setLinkInitialText] = useState(''); // Store selected text
        const [linkIsEditing, setLinkIsEditing] = useState(false); // Track if editing existing link
        ```
    *   [ ] Create the Link Dialog component structure within `TextEditorToolbar` using `<Dialog>` and related components. Include `Label` and `Input` for the URL.
    *   [ ] Implement the `onClick` handler for the Link button:
        ```typescript
        const handleLinkButtonClick = () => {
          if (!editorView) return;
          const { state } = editorView;
          const { from, to, empty, $from } = state.selection;
          const linkMark = documentSchema.marks.link;

          let existingMark = null;
          if (!empty) {
            existingMark = state.doc.rangeHasMark(from, to, linkMark) ? linkMark.isInSet($from.marksSet($from.parent.childAfter($from.parentOffset).offset))?.[0] : null;
             // Check if mark exists exactly at start or across range
             existingMark = existingMark || linkMark.isInSet(state.doc.resolve(from).marks())?.[0];
          } else {
             existingMark = linkMark.isInSet(state.storedMarks || $from.marks())?.[0];
          }


          if (existingMark) { // Editing existing link
            setLinkUrl(existingMark.attrs.href || '');
            setLinkInitialText(state.doc.textBetween(from, to)); // Use selection if exists
            setLinkIsEditing(true);
          } else { // Adding new link
            setLinkUrl('https://');
            setLinkInitialText(state.doc.textBetween(from, to));
            setLinkIsEditing(false);
          }
          setShowLinkDialog(true);
        };
        ```
        *   Assign this handler to the Link button's `onClick`.
    *   [ ] Implement the "Save" button logic within the Link Dialog:
        ```typescript
        const handleSaveLink = () => {
          if (!editorView) return;
          const { state, dispatch } = editorView;
          const { from, to, empty } = state.selection;
          const linkMark = documentSchema.marks.link;

          let tr = state.tr;
          // Remove existing link mark first if editing or just applying
          tr = tr.removeMark(from, to, linkMark);

          if (linkUrl.trim()) { // Only add if URL is not empty
             const mark = linkMark.create({ href: linkUrl });
             if (empty && linkInitialText && from === to) {
               // If selection was empty, insert the initial text if available (though usually not needed for links)
             }
             tr = tr.addMark(from, to, mark);
          }

          dispatch(tr);
          setShowLinkDialog(false);
          editorView.focus();
        };
        ```
    *   [ ] Add "Save" and "Cancel" buttons to the `DialogFooter`. Wire `handleSaveLink` to Save and `setShowLinkDialog(false)` to Cancel.
    *   [ ] *Optional:* Add a "Remove Link" button inside the dialog, which would call `runCommand(toggleMark(documentSchema.marks.link))` and close the dialog.
    *   [ ] Use the `toolbarState.isLinkActive` (from Story 5) to control the Link button's active appearance.

---

### **Story 7: Final Touches & Refinements**

*   **Goal:** Ensure robustness and clean up the implementation.
*   **Tasks:**
    *   [ ] Review all `onClick` handlers in `TextEditorToolbar` to ensure they check `if (!editorView) return;` at the beginning.
    *   [ ] Verify all imported icons are correctly displayed.
    *   [ ] Test edge cases: empty selection, selection spanning multiple blocks, applying/removing marks repeatedly.
    *   [ ] Ensure the editor remains focused after toolbar actions.
    *   [ ] Check for any console errors during interaction.
    *   [ ] Add keyboard accessibility to toolbar buttons (should work by default with Radix UI).
    *   [ ] Ensure tooltips display correctly for all buttons.
    *   [ ] Consider the visual styling of the active button state for clarity.
