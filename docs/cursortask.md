Okay, here is a highly detailed, step-by-step Markdown checklist designed for an AI Coding Agent to implement the "Context-Aware Suggestions" enhancement for the Text Artifact.

**Project Goal:** Enhance the AI suggestion generation for text documents by providing the AI model with the full document content, title, and kind, instead of just the content, to improve the relevance and quality of suggestions.

**Primary File Target:** `lib/ai/tools/request-suggestions.ts`

---

### **Project Checklist: Context-Aware Suggestions Enhancement**

**Story 1: Locate and Prepare the `request-suggestions` Tool**

*   [x] Navigate to the file: `lib/ai/tools/request-suggestions.ts`.
*   [x] Identify the `tool({...})` definition block for `requestSuggestions`.
*   [x] Locate the `execute: async ({ documentId }) => { ... }` function within the tool definition.
*   [x] Verify that the `documentId` parameter is correctly received.
*   [x] Verify the existing call `const document = await getDocumentById({ id: documentId });` successfully retrieves the document object.
*   [x] Verify the existing error handling for cases where `document` or `document.content` is not found.

**Story 2: Construct the Enhanced Context Prompt**

*   [x] Inside the `execute` function, immediately *after* the successful retrieval of the `document` object (and the check for `!document || !document.content`).
*   [x] Create a new constant variable named `contextPrompt` using a template literal (backticks `` ` ``).
*   [x] Add the text `Document Title:` followed by a newline (`\n`) to the `contextPrompt`.
*   [x] Append the value of `document.title` to the `contextPrompt`.
*   [x] Add the text `\n\nDocument Kind:` followed by a newline (`\n`) to the `contextPrompt`.
*   [x] Append the value of `document.kind` (which should be `'text'` in this artifact's context) to the `contextPrompt`.
*   [x] Add the text `\n\nFull Document Content:\n---\n` to the `contextPrompt` to clearly delineate the content section.
*   [x] Append the full value of `document.content` to the `contextPrompt`.
*   [x] Add the text `\n---\n` after the document content in the `contextPrompt`.
*   [x] Add the concluding instruction `Based on the full document content above, please provide suggestions to improve the piece of writing and describe the change. It is very important for the edits to contain full sentences instead of just words. Max 5 suggestions.` to the `contextPrompt`.

**Story 3: Update the AI Model Call (`streamObject`)**

*   [x] Locate the `const { elementStream } = streamObject({ ... });` call within the `execute` function.
*   [x] Find the `prompt:` property within the configuration object passed to `streamObject`.
*   [x] Change the value of the `prompt:` property from its current value (likely `document.content`) to the newly created `contextPrompt` variable.
    ```typescript
    // Example modification:
    const { elementStream } = streamObject({
      model: myProvider.languageModel('artifact-model'), // Keep the model reference
      system: 'You are a help writing assistant...', // Keep existing system prompt
      prompt: contextPrompt, // *** CHANGE THIS LINE ***
      output: 'array',       // Keep existing output/schema
      schema: z.object({ /* ... existing schema ... */ }),
    });
    ```
*   [x] Verify that the `system:` prompt within `streamObject` is still appropriate (it defines the overall role, which should remain valid).
*   [x] Verify that the `schema:` for the expected output (`originalSentence`, `suggestedSentence`, `description`) remains unchanged, as the *output format* is not being altered.

**Story 4: Consider Model Compatibility and Context Limits**

*   [x] Identify the specific AI model assigned to `'artifact-model'` by checking `lib/ai/models.ts`. (Current: `google('gemini-2.5-pro-exp-03-25')`).
*   [x] Add a comment near the `streamObject` call noting that the `contextPrompt` significantly increases input tokens compared to sending only `document.content`.
    ```typescript
    // Note: Using contextPrompt increases input tokens. Monitor for context window limits with large documents.
    const { elementStream } = streamObject({ /* ... */ });
    ```
*   [x] *Manual Check/Test:* (Add a task for human reviewer or later testing phase) Test this feature with a very large text document to ensure the combined `contextPrompt` does not exceed the token limit of the configured `'artifact-model'`. Log potential errors related to context length.

**Story 5: Verify Tool Signature and Integration**

*   [x] Review the Zod schema defined in the `parameters` property of the `requestSuggestions` tool definition. Confirm it still only requires `{ documentId: z.string() }`. No changes should be needed here as context is derived internally.
*   [x] Check if this tool (`requestSuggestions`) is used directly elsewhere (e.g., imported and called from another server action or API route). Confirm that no changes are required at the calling site, as the tool's *external* signature hasn't changed.

**Story 6: Test the Enhanced Suggestion Functionality**

*   [ ] **Test Case 1 (Basic):** Use the UI to request suggestions on a short (~3-5 sentences) text document. Verify suggestions are generated and displayed correctly.
*   [ ] **Test Case 2 (Contextual Relevance):** Create a text document with two distinct paragraphs on different topics. Request suggestions. Verify if any suggestions relate to the overall structure, flow between paragraphs, or the document title, which wouldn't have been possible before.
*   [ ] **Test Case 3 (No Content):** Attempt to request suggestions on an empty document (or handle this case gracefully in the `execute` function if not already done). Verify appropriate error handling or no suggestions are generated.
*   [ ] **Test Case 4 (Streaming):** Ensure suggestions are still streamed correctly to the client via `dataStream.writeData({ type: 'suggestion', content: suggestion });` as they are generated by the `elementStream`.
*   [ ] **Test Case 5 (Comparison - Manual):** Select a sample document. Generate suggestions *before* this change. Then, generate suggestions *after* this change. Qualitatively compare if the suggestions generated with full context are more relevant or helpful.

**Story 7: Update Documentation and Comments**

*   [ ] Add or update the JSDoc comment block for the `execute` function within `requestSuggestions` to explain that it now uses the document's title, kind, and full content as context for generating suggestions.
*   [ ] Add inline comments within the `execute` function explaining the structure and purpose of the `contextPrompt` template literal.
*   [ ] Review `docs/artifacts.md` or any other relevant documentation files. If they detail the suggestion mechanism, update them to reflect the use of enhanced context.

---

This checklist provides a granular breakdown for implementing the context-aware suggestion feature, ensuring the AI agent addresses all necessary modifications and considerations.
