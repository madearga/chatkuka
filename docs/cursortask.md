Okay, here is a highly detailed, step-by-step checklist designed for an AI Coding Agent to implement the centralization of the Tavily API client logic. Each task aims to be a distinct, actionable "one-point" story.

**Project Goal:** Refactor the Tavily search API interaction from `app/(chat)/api/chat/route.ts` into a dedicated, reusable client module at `lib/clients/tavily.ts`.

**File Target:** `lib/clients/tavily.ts` (New File)
**File Target:** `app/(chat)/api/chat/route.ts` (Refactor)

---

### **Story 1: Create Tavily Client Module Structure**

*   [x] Create a new directory `lib/clients`.
*   [x] Create a new file named `tavily.ts` inside the `lib/clients` directory.
*   [x] Add the `'use server';` directive at the top of `lib/clients/tavily.ts` if server-only logic is intended, or omit if it might be used in shared contexts (prefer server-only for API keys). *Decision: Use 'server-only' for now.*
*   [x] Import necessary types/modules (e.g., `zod` if planning to use it for validation later).
*   [x] Define the basic structure for the primary search function, e.g., `export async function searchTavily(query: string, options?: TavilySearchOptions): Promise<TavilySearchResponse | { error: string }>`. (Types will be defined next).
*   [x] Add a basic `try...catch` block inside the `searchTavily` function.

---

### **Story 2: Define Input/Output Types for Tavily Client**

*   [x] In `lib/clients/tavily.ts`, define the `TavilySearchOptions` interface/type based on the parameters used in the current `fetch` call in `chat/route.ts` and the Tavily API documentation. Include fields like `searchDepth`, `includeAnswer`, `maxResults`, `includeDomains`, `excludeDomains`, `includeImages`, `includeRawContent`, `topic`, `timeRange`, `days`, `includeImageDescriptions`. Ensure all fields are optional where applicable.
    ```typescript
    // Example Structure:
    interface TavilySearchOptions {
      searchDepth?: 'basic' | 'advanced';
      includeAnswer?: boolean;
      maxResults?: number;
      includeDomains?: string[];
      excludeDomains?: string[];
      includeImages?: boolean;
      includeRawContent?: boolean;
      includeImageDescriptions?: boolean;
      topic?: string;
      timeRange?: string; // Note: This might overlap with 'days'. Clarify API usage if necessary.
      days?: number;
    }
    ```
*   [x] In `lib/clients/tavily.ts`, define the `TavilySearchResult` interface/type based on the expected fields in the `results` array from the Tavily API (e.g., `title`, `url`, `content`, `score`, `rawContent`, `publishedDate`).
*   [x] In `lib/clients/tavily.ts`, define the `TavilyImage` interface/type if `includeImages` is used (e.g., `url`, `description`).
*   [x] In `lib/clients/tavily.ts`, define the `TavilySearchResponse` interface/type for a successful search, including fields like `query`, `answer`, `results` (as an array of `TavilySearchResult`), `images` (as an array of `TavilyImage`), `responseTime`.
*   [x] Refine the return type of the `searchTavily` function signature to use `TavilySearchResponse` for success. Keep the possibility of returning an error object or throwing a custom error. *Decision: Throw specific errors for failures.* Update function signature: `export async function searchTavily(query: string, options?: TavilySearchOptions): Promise<TavilySearchResponse>`.

---

### **Story 3: Implement Secure API Key Handling**

*   [x] Inside `lib/clients/tavily.ts`, access the Tavily API key using `process.env.TAVILY_API_KEY`.
*   [x] At the beginning of the `searchTavily` function, add a check to ensure the `TAVILY_API_KEY` environment variable is present and not empty.
*   [x] If the API key is missing or empty, throw a specific `Error('Tavily API key is not configured.')`.

---

### **Story 4: Implement Core Fetch Logic in Client**

*   [x] Inside the `try` block of `searchTavily`, construct the URL for the Tavily search endpoint (`https://api.tavily.com/search`).
*   [x] Create the `headers` object for the `fetch` call, including `'Content-Type': 'application/json'` and `'Authorization': \`Bearer ${tavilyApiKey}\``.
*   [x] Create the `requestBody` object. It must include the `query`.
*   [x] Dynamically add properties to `requestBody` based on the provided `options` argument, mapping `TavilySearchOptions` fields to the actual Tavily API parameter names (e.g., `searchDepth` -> `search_depth`, `includeAnswer` -> `include_answer`). Only include options if they have a value.
    *   [x] Map `searchDepth`.
    *   [x] Map `includeAnswer`.
    *   [x] Map `maxResults`.
    *   [x] Map `includeDomains`.
    *   [x] Map `excludeDomains`.
    *   [x] Map `includeImages`.
    *   [x] Map `includeRawContent`.
    *   [x] Map `includeImageDescriptions`.
    *   [x] Map `topic`.
    *   [x] Map `timeRange` OR `days` (ensure only one is sent if both are provided, check Tavily docs for precedence).
*   [x] Make the `fetch` call using `POST` method, passing the constructed `url`, `headers`, and `JSON.stringify(requestBody)`.

---

### **Story 5: Implement Response Handling in Client**

*   [x] Await the `fetch` response.
*   [x] Check if `response.ok` is false. If not ok, attempt to parse the error response body as JSON. Throw a specific error including the status code and the error message from the body (e.g., `Error(\`Tavily API error (${response.status}): ${errorData.message || 'Unknown error'}\`)`). If parsing the error body fails, throw a generic error with the status code (e.g., `Error(\`Tavily API request failed with status: ${response.status}\`)`).
*   [x] If the response is ok, parse the response body using `response.json()`.
*   [x] *Optional (Recommended):* Validate the parsed JSON data against a Zod schema derived from the `TavilySearchResponse` interface to ensure the API contract is met. If validation fails, throw a specific validation error.
*   [x] If validation passes (or is skipped), cast the parsed data to `TavilySearchResponse` and return it.

---

### **Story 6: Implement Error Handling in Client**

*   [x] In the `catch` block surrounding the `fetch` call within `searchTavily`, catch any potential errors (network errors, JSON parsing errors, validation errors, specific errors thrown earlier).
*   [x] Log the caught error server-side for debugging purposes (`console.error('Error in searchTavily:', error);`).
*   [x] Re-throw the caught error or throw a new, more generic error (e.g., `Error('Failed to execute Tavily search.')`) to be handled by the calling function (the API route). *Decision: Re-throw the original or specific error for better context in the API route.*

---

### **Story 7: Refactor API Route (`app/(chat)/api/chat/route.ts`) to Use Client**

*   [x] Import the `searchTavily` function from `lib/clients/tavily.ts`.
*   [x] Locate the section within the `POST` handler where the direct `fetch` call to Tavily is made (inside the `if (useSearch && searchToolAvailable && searchQuery && tavilyApiKey)` block).
*   [x] Remove the code block that constructs the headers, body, and makes the `fetch` call to Tavily.
*   [x] Keep the existing `try...catch` block around the Tavily logic.
*   [x] Inside the `try` block, call the new `searchTavily` function: `const searchResults = await searchTavily(searchQuery, searchOptions);`.
*   [x] Remove the redundant `tavilyApiKey` variable definition and the check `if (!response.ok)` within this specific block, as this handling is now inside the client.
*   [x] Ensure the existing logic that uses `searchResults` (logging, updating `dataStream`, augmenting `systemMessage`) still works correctly with the structure returned by `searchTavily`.
*   [x] Update the `catch` block associated with the search call. It should now catch errors thrown by `searchTavily`. Log the error and update the `dataStream` with the error status as before. Ensure the `error instanceof Error ? error.message : String(error)` pattern correctly captures the message from the potentially more specific errors thrown by the client.

---

### **Story 8: Final Cleanup and Documentation**

*   [x] In `app/(chat)/api/chat/route.ts`, remove any unused imports or variables related to the direct Tavily `fetch` call.
*   [x] In `lib/clients/tavily.ts`, add JSDoc comments to the `searchTavily` function explaining its purpose, parameters (`query`, `options`), return type (`Promise<TavilySearchResponse>`), and potential errors it might throw.
*   [x] Add inline comments within `lib/clients/tavily.ts` for any complex logic, especially around constructing the request body or handling specific API options.
*   [x] Verify that no existing functionality related to chat generation, tool use (other than search), or database interaction in `app/(chat)/api/chat/route.ts` has been accidentally broken during the refactor.

---

This detailed checklist breaks down the refactoring process into small, manageable steps suitable for implementation, ensuring the Tavily client logic is properly centralized and the API route is updated correctly without impacting other features.
