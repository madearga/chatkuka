Okay, here is the extremely detailed Markdown checklist for implementing enhancements to improve the AI's recognition and triggering of the `updateDocument` tool, designed for execution by an AI Coding Agent.

**CRITICAL PRE-REQUISITES:**
1.  **Backup:** Ensure a backup of the current codebase, especially the targeted files, exists.
2.  **Branch:** Create a new Git branch specifically for these changes (e.g., `feat/improve-update-tool-recognition`).
3.  **Understanding:** The primary goal is to make the AI more reliably choose the `updateDocument` tool when users ask for modifications to existing artifacts, rather than just generating text in the chat.

---

### **Project Checklist: Improve `updateDocument` Tool Recognition for User Friendliness**

**Goal:** Modify the AI tool definitions, system prompts, and potentially add minor UI cues to significantly increase the likelihood that the AI uses the `updateDocument` tool when users (especially non-technical ones) request changes to existing artifacts.

---

**Epic 1: Enrich `updateDocument` Tool Definition**

*   **Goal:** Make the tool's description and parameter hints clearer and more comprehensive for the AI model to understand its purpose and usage context.
*   **Target File:** `lib/ai/tools/update-document.ts`

    *   #### Story 1.1: Enhance Tool Description Field
        *   **Goal:** Expand the main description to include more keywords, synonyms, and contextual clues that users might employ when asking for modifications.
        *   [ ] Locate the `updateDocument` constant which uses the `tool()` function.
        *   [ ] Identify the `description` property within the `tool()` configuration object.
        *   [ ] **Replace** the current `description` string with a more detailed version. Incorporate synonyms like "modify", "edit", "change", "add to", "fix", "rewrite", "correct", "improve". Explicitly mention artifact types ("text", "code", "sheet", "image"). Emphasize that it applies to *existing* artifacts currently visible or recently discussed.
        *   **Example Enhanced Description (incorporate and adapt):**
            ```typescript
            description: 'Modify, edit, change, add to, fix, or rewrite the content of an *existing* document or artifact (like text, code, sheet, or image) currently shown in the workspace, based on user instructions. Use this tool when the user asks to make changes, corrections, additions, or improvements to the artifact they are currently viewing or have just interacted with. Do NOT use this for creating new documents.',
            ```
        *   [ ] Verify the new description is syntactically correct within the JavaScript object.

    *   #### Story 1.2: Refine Parameter Descriptions
        *   **Goal:** Make the purpose of the `id` and `description` parameters unambiguous to the AI.
        *   [ ] Within the same `tool()` configuration object, locate the `parameters` property, which uses `z.object({...})`.
        *   [ ] Find the `id` parameter definition (`z.string().describe(...)`).
        *   [ ] **Modify** the `.describe()` content for `id` to emphasize it refers to an *existing* artifact that needs *modification*.
        *   **Example `id` Description:** `'The unique identifier (ID) of the *existing* document artifact that the user wants to modify or update.'`
        *   [ ] Find the `description` parameter definition (`z.string().describe(...)`).
        *   [ ] **Modify** the `.describe()` content for `description` to clarify it holds the *user's specific instructions* about *what changes* to make.
        *   **Example `description` Description:** `'A detailed description, based on the user\'s request, specifying exactly *what changes*, modifications, additions, or corrections should be made to the content of the existing document.'`
        *   [ ] Verify the updated descriptions are syntactically correct within the Zod schema.

---

**Epic 2: Strengthen System Prompt Instructions**

*   **Goal:** Provide the AI with explicit heuristics and guidelines on when to prioritize using the `updateDocument` tool over generating plain text.
*   **Target File:** `lib/ai/prompts.ts`

    *   #### Story 2.1: Add Update Prioritization Rules to Artifacts Prompt
        *   **Goal:** Embed clear rules within the existing artifact instructions to guide the AI's decision-making process.
        *   [ ] Locate the `artifactsPrompt` template literal variable (or the logic within `systemPrompt` function that incorporates artifact instructions).
        *   [ ] **Append** a new section clearly titled (e.g., `**Prioritizing Artifact Updates:**` or similar) to the existing `artifactsPrompt` content.
        *   [ ] **Add Rule 1 (Contextual Reference):** Instruct the AI that when the user uses pronouns ("it", "this") or references ("the code", "the document") shortly after an artifact was created or discussed, it should *strongly assume* the user wants to update *that specific artifact*.
        *   **Add Rule 2 (Keywords):** Instruct the AI that if the user's request contains keywords like "change", "edit", "modify", "add", "fix", "correct", "improve", "rewrite" *in relation to the content of the visible/active artifact*, it should **strongly prefer** using the `updateDocument` tool.
        *   **Add Rule 3 (Clarification):** Instruct the AI that if it's uncertain whether the user wants an update or a new response, it should *ask the user for clarification* (e.g., "Should I apply that change to the document in the workspace?").
        *   **Add Rule 4 (Distinction):** Reiterate that `updateDocument` is for *existing* artifacts, contrasting it with `createDocument` for *new* ones.
        *   **Example Text to Add (adapt and integrate):**
            ```text

            **Prioritizing Artifact Updates:**
            - When the user refers to "this document", "the code", "it", "the text", etc., immediately after an artifact has been created or interacted with, assume they intend to **update that artifact**.
            - If the user asks for "changes", "edits", "modifications", "additions", "corrections", "improvements", or similar actions related to the content currently displayed in the artifact workspace, **you MUST strongly prefer using the `updateDocument` tool**. Do *not* just generate the modified text in the chat response unless explicitly asked to.
            - If you are unsure whether to update the artifact or generate a new response, **ask the user for clarification** (e.g., "Should I update the document in the workspace with that change?").
            - Remember: `updateDocument` modifies *existing* artifacts; `createDocument` makes *new* ones.
            ```
        *   [ ] Ensure the added text is correctly formatted within the template literal (respecting newlines and markdown).
        *   [ ] Review the `systemPrompt` function to ensure the `artifactsPrompt` (with the new rules) is correctly included for the relevant models (likely all except maybe the reasoning-specific one).

---

**Epic 3: Implement Frontend Assistance (Optional but Recommended)**

*   **Goal:** Provide users with explicit UI controls to trigger artifact updates, reducing reliance on natural language interpretation.
*   **Target Files:** `components/artifact.tsx`, `components/code-editor.tsx`, `components/text-editor.tsx`, `components/image-editor.tsx` (potentially), `components/chat.tsx` (for `append` or similar function).

    *   #### Story 3.1: Add "Edit This Artifact" Button/Interaction
        *   **Goal:** Create a clear visual cue on the artifact itself that allows users to initiate an edit request.
        *   [ ] Open `components/artifact.tsx`.
        *   [ ] **Decision:** Choose an appropriate location for an "Edit" button/icon. Possibilities:
            *   Next to the artifact title in the header.
            *   As part of the `ArtifactActions` bar at the top right.
            *   As a floating button overlaying the content (less recommended for usability). Let's target the header near the title or in the actions bar.
        *   [ ] **If adding to header:**
            *   Locate the `div` containing the artifact title.
            *   Import `Button` and `PencilEditIcon`.
            *   Add a small, icon-only `Button` next to the title.
            *   Wrap it in `Tooltip` for accessibility.
        *   [ ] **If adding to `ArtifactActions`:**
            *   This might require modifying the `Artifact` class definition (`components/create-artifact.tsx`) to include a standard "start edit" action, or adding it directly within `components/artifact-actions.tsx` if structure allows. Let's assume adding it directly to `ArtifactActions` for now.
            *   Open `components/artifact-actions.tsx`.
            *   Import `Button` and `PencilEditIcon`.
            *   Add a new `Tooltip`-wrapped `Button` to the list of actions, potentially as the first action.
        *   [ ] **Implement `onClick` Handler:**
            *   The `onClick` handler should *not* directly modify state.
            *   It should use the `append` function (which needs to be available in this component's context, likely passed down from `components/chat.tsx` via `components/artifact.tsx`).
            *   **Retrieve** the current artifact's `id` (e.g., `artifact.documentId`).
            *   **Call** `append` with a user message explicitly stating the intent to edit *this specific artifact*.
            *   **Example Prompt Structure:** `append({ role: 'user', content: \`I want to edit the artifact '${artifact.title}' (ID: ${artifact.documentId}). Please apply the following changes: \` })`. *Refinement:* Pre-filling the main input is better UX.
            *   **Revised `onClick`:**
                1.  Get the `setInput` function (pass it down from `Chat` -> `Artifact` -> `ArtifactActions`).
                2.  Get the main textarea `ref` (pass it down or use context).
                3.  Call `setInput(\`Edit artifact '${artifact.title}' (ID: ${artifact.documentId}): \`)`.
                4.  Focus the main textarea (`textareaRef.current?.focus()`).
        *   [ ] Add appropriate styling (e.g., `variant="ghost"`, `size="icon"`).
        *   [ ] Add a descriptive tooltip (e.g., "Request edit for this artifact").

    *   #### Story 3.2: Review and Clarify Toolbar Action Prompts
        *   **Goal:** Ensure the prompts sent when clicking existing toolbar buttons (e.g., "Add comments") are clear about modifying the *current* artifact.
        *   [ ] Open the `client.tsx` file for each artifact type (e.g., `artifacts/code/client.tsx`, `artifacts/text/client.tsx`).
        *   [ ] Locate the `toolbar` array definition within the `new Artifact(...)` configuration.
        *   [ ] Review the `onClick` handler for each toolbar item, specifically the `content` string passed to `appendMessage`.
        *   [ ] **If** a prompt seems ambiguous (e.g., just "Add comments"), modify it to be more specific, referencing the current context.
        *   **Example Modification (Code Artifact - Add Comments):**
            *   *Potentially Ambiguous:* `content: 'Add comments to the code snippet for understanding'`
            *   *More Explicit:* `content: 'Add comments to *this* code artifact to explain it.'`
        *   [ ] Repeat this review for all relevant toolbar actions across all artifact types. *Self-correction:* Directly adding the ID might be brittle if `appendMessage` context changes. Relying on clearer natural language like "this artifact" or "the current code" within the prompt sent is safer.

---

**Epic 4: Verification and Iteration**

*   **Goal:** Systematically test the changes with various user inputs and refine the descriptions/prompts based on observed AI behavior.

    *   #### Story 4.1: Execute Defined Test Cases
        *   **Goal:** Verify the AI now correctly triggers `updateDocument` for common modification requests.
        *   [ ] Create an artifact (e.g., a simple Python code snippet or a short text paragraph).
        *   [ ] **Test Case 1 (Direct Command):** Send prompt: "Change the first sentence of this document to '[new sentence]'". **Verify:** AI calls `updateDocument`. Artifact updates.
        *   [ ] **Test Case 2 (Synonym):** Send prompt: "Modify the code artifact to include error handling." **Verify:** AI calls `updateDocument`. Artifact updates.
        *   [ ] **Test Case 3 (Implicit Reference):** Send prompt: "Add a concluding paragraph." (immediately after creating a text artifact). **Verify:** AI calls `updateDocument`. Artifact updates.
        *   [ ] **Test Case 4 (Pronoun):** Send prompt: "Fix the typo in it." (referring to the artifact). **Verify:** AI calls `updateDocument`. Artifact updates.
        *   [ ] **Test Case 5 (Awkward Phrasing):** Send prompt: "Make the code better." **Verify:** AI might ask for clarification (as per new system prompt) or attempt `updateDocument`. Observe the behavior.
        *   [ ] **Test Case 6 (Frontend Button):** Click the newly added "Edit" button (if implemented). Type a change description. Send. **Verify:** AI calls `updateDocument`. Artifact updates.
        *   [ ] **Test Case 7 (Toolbar Button):** Click an existing toolbar button (e.g., "Add comments" on code). **Verify:** AI calls `updateDocument`. Artifact updates.
        *   [ ] **Test Case 8 (Negative Test):** Ask a general question unrelated to the artifact. **Verify:** AI responds in chat, *does not* call `updateDocument`.

    *   #### Story 4.2: Analyze Failures and Refine
        *   **Goal:** Identify why the AI failed to use the tool (if applicable) and adjust prompts/descriptions accordingly.
        *   [ ] **If** any test case fails (AI responds in chat instead of updating):
            *   [ ] Note the exact prompt used.
            *   [ ] Hypothesize why the AI failed (e.g., description not specific enough, prompt too ambiguous, context lost).
            *   [ ] **Iterate:** Go back to Epic 1 or Epic 2 and refine the relevant description or system prompt rule based on the hypothesis.
            *   [ ] Re-run the failing test case.
            *   [ ] Repeat until the desired level of reliability is achieved for common update requests. Document the refinements made.

---