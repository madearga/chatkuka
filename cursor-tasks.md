Okay, here is an extremely detailed Markdown checklist designed for a competent AI Coding Agent to migrate the Chatkuka application's authentication to **exclusively use Google OAuth**, while meticulously **preserving all existing functionality** and making **minimal database changes**.

**Project Goal:** Transition Chatkuka authentication to Google OAuth only, removing email/password login/registration, without introducing regressions in any other feature (chat, artifacts, history, payments, etc.).

**Core Constraints:**

1.  **No Functional Regression:** All features currently working (chat, artifacts, history, search, payments, visibility, pinning, etc.) MUST remain fully functional after the changes.
2.  **Google OAuth Only:** Email/Password login and registration must be completely removed from the UI and backend logic. Google OAuth becomes the *only* way to authenticate.
3.  **Minimal Database Changes:** The existing database schema (specifically the `User` and `UserOAuthAccount` tables) should remain unchanged. The `password` column in the `User` table will become unused but should not be removed in this phase to minimize risk. The Drizzle adapter must handle user creation/linking via Google correctly with the existing schema.
4.  **Responsiveness:** All changes must maintain the application's responsiveness across devices.
5.  **Clarity for AI:** Instructions must be explicit, unambiguous, and broken down into atomic steps.

---

### **Project Checklist: Migrate Authentication to Google OAuth Only**

---

#### **Story 1: Configure NextAuth Providers**

**Goal:** Modify the NextAuth.js configuration to remove the `Credentials` provider and ensure only `GoogleProvider` is active.

**Target File:** `app/(auth)/auth.ts`

**Tasks:**

*   [x] **1.1: Open File:** Open the file `app/(auth)/auth.ts`.
*   [x] **1.2: Locate Imports:** Identify import statements related to `Credentials` from `next-auth/providers/credentials` and any dependencies used *only* by the Credentials provider's `authorize` callback (e.g., `compare` from `bcrypt-ts`, `getUser` from `@/lib/db/queries` if *only* used there).
*   [x] **1.3: Remove Imports:** Delete the import statement(s) identified in step 1.2 (specifically `Credentials` and potentially `compare`, `getUser`). *Do not* remove imports used by other parts of the file (like `GoogleProvider`, `DrizzleAdapter`, `getUserById`, `authConfig`).
*   [x] **1.4: Locate `providers` Array:** Find the `providers: [...]` array within the `NextAuth({...})` configuration object.
*   [x] **1.5: Identify Credentials Block:** Locate the entire `Credentials({...})` object within the `providers` array. This includes the `credentials: {}` and `async authorize(...) {...}` parts.
*   [x] **1.6: Delete Credentials Block:** Delete the *entire* `Credentials({...})` object from the `providers` array, including the comma separating it from other providers if necessary.
*   [x] **1.7: Verify GoogleProvider:** Ensure the `GoogleProvider({...})` object remains in the `providers` array and its configuration (`clientId`, `clientSecret`) is correct (referencing environment variables).
*   [x] **1.8: Review Callbacks:** Briefly review the `callbacks.jwt` and `callbacks.session` functions. Confirm they do *not* contain logic that *exclusively* depends on the `Credentials` provider being present. The existing logic to fetch user data by ID for JWT refresh should remain.
*   [x] **1.9: Save File:** Save the changes to `app/(auth)/auth.ts`.

---

#### **Story 2: Update Login Page UI**

**Goal:** Modify the login page UI to remove the email/password form and solely present the Google Login option.

**Target File:** `app/(auth)/login/page.tsx`

**Tasks:**

*   [x] **2.1: Open File:** Open the file `app/(auth)/login/page.tsx`.
*   [x] **2.2: Locate Imports:** Identify import statements for components and hooks related to the email/password form: `AuthForm`, `SubmitButton`, `login`, `useActionState`, `useState`, `useEffect`, `toast`.
*   [x] **2.3: Remove Imports:** Delete the import statements identified in step 2.2. Keep `Link` (if used elsewhere) and `GoogleLoginButton`.
*   [x] **2.4: Remove State Hooks:** Delete the `useState` hooks for `email` and `isSuccessful`.
*   [x] **2.5: Remove Action State Hook:** Delete the `useActionState` hook for the `login` action.
*   [x] **2.6: Remove Effect Hook:** Delete the `useEffect` hook that handles the `state` from `useActionState`.
*   [x] **2.7: Remove Submit Handler:** Delete the `handleSubmit` function.
*   [x] **2.8: Locate JSX:** Find the main JSX `return` statement.
*   [x] **2.9: Modify Heading/Description:** Update the `h3` and `p` tags within the header `div` to reflect Google-only login (e.g., "Sign In with Google", "Use your Google account to access Chatkuka").
*   [x] **2.10: Remove Divider:** Locate and delete the `div` element that renders the "Or continue with" text and the horizontal lines around it.
*   [x] **2.11: Remove AuthForm:** Locate and delete the entire `<AuthForm>` component invocation, including its children (`<SubmitButton>` and the "Don't have an account?" paragraph).
*   [x] **2.12: Position Google Button:** Ensure the `<GoogleLoginButton />` component is rendered appropriately within the main content `div` (likely within the `div` with `px-4 sm:px-16`). Adjust styling if necessary for centering.
*   [x] **2.13: Optional Cleanup:** Remove any remaining unused variables or functions within the component.
*   [x] **2.14: Save File:** Save the changes to `app/(auth)/login/page.tsx`.

---

#### **Story 3: Update Registration Page UI**

**Goal:** Modify the registration page UI to remove the email/password form and solely present the Google Login option for signing up.

**Target File:** `app/(auth)/register/page.tsx`

**Tasks:**

*   [x] **3.1: Open File:** Open the file `app/(auth)/register/page.tsx`.
*   [x] **3.2: Locate Imports:** Identify import statements for components and hooks related to the email/password form: `AuthForm`, `SubmitButton`, `register`, `useActionState`, `useState`, `useEffect`, `toast`.
*   [x] **3.3: Remove Imports:** Delete the import statements identified in step 3.2. Keep `Link` (if used elsewhere) and `GoogleLoginButton`.
*   [x] **3.4: Remove State Hooks:** Delete the `useState` hooks for `email` and `isSuccessful`.
*   [x] **3.5: Remove Action State Hook:** Delete the `useActionState` hook for the `register` action.
*   [x] **3.6: Remove Effect Hook:** Delete the `useEffect` hook that handles the `state` from `useActionState`.
*   [x] **3.7: Remove Submit Handler:** Delete the `handleSubmit` function.
*   [x] **3.8: Locate JSX:** Find the main JSX `return` statement.
*   [x] **3.9: Modify Heading/Description:** Update the `h3` and `p` tags within the header `div` to reflect Google-only sign-up (e.g., "Sign Up with Google", "Create your Chatkuka account using Google").
*   [x] **3.10: Remove Divider:** Locate and delete the `div` element that renders the "Or continue with" text and the horizontal lines around it.
*   [x] **3.11: Remove AuthForm:** Locate and delete the entire `<AuthForm>` component invocation, including its children (`<SubmitButton>` and the "Already have an account?" paragraph).
*   [x] **3.12: Position Google Button:** Ensure the `<GoogleLoginButton />` component is rendered appropriately within the main content `div` (likely within the `div` with `px-4 sm:px-16`). Adjust styling if necessary for centering.
*   [x] **3.13: Optional Cleanup:** Remove any remaining unused variables or functions within the component.
*   [x] **3.14: Save File:** Save the changes to `app/(auth)/register/page.tsx`.

---

#### **Story 4: Remove Backend Credentials Logic**

**Goal:** Remove the server-side logic (Server Actions) responsible for handling email/password login and registration.

**Target File:** `app/(auth)/actions.ts`

**Tasks:**

*   [x] **4.1: Open File:** Open the file `app/(auth)/actions.ts`.
*   [x] **4.2: Locate Functions/Schemas/Types:** Identify the `login` function, the `register` function, the `authFormSchema` (Zod schema), the `LoginActionState` interface, and the `RegisterActionState` interface.
*   [x] **4.3: Locate Imports:** Identify imports used *only* by the functions being removed (e.g., `z` from `zod`, `createUser`, `getUser`, `signIn` *if only used for credentials* - unlikely as Google flow might use it too, `compare` from `bcrypt-ts`).
*   [x] **4.4: Delete Functions:** Delete the entire `login` async function definition.
*   [x] **4.5: Delete Functions:** Delete the entire `register` async function definition.
*   [x] **4.6: Delete Schema/Types:** Delete the `authFormSchema`, `LoginActionState`, and `RegisterActionState` definitions.
*   [x] **4.7: Delete Unused Imports:** Delete the imports identified in step 4.3 that are no longer used anywhere else in the file. *Be cautious* not to remove imports needed by other potential actions in this file (if any exist).
*   [x] **4.8: Save File:** Save the changes to `app/(auth)/actions.ts`. If the file is now empty, it can potentially be deleted, but leaving an empty file is also safe.

---

#### **Story 5: Verify Database Adapter and User Handling**

**Goal:** Ensure the Drizzle adapter correctly handles user creation and retrieval via Google OAuth using the existing database schema. *No code changes are expected here, only verification.*

**Target File:** `lib/db/auth-adapter.ts`, `lib/db/schema.ts`

**Tasks:**

*   [x] **5.1: Review Schema:** Open `lib/db/schema.ts`. Confirm the `User` table has `id`, `email`, `name`, `subscriptionStatus`. Confirm the `UserOAuthAccount` table exists with `userId`, `provider`, `providerAccountId`. **Do not modify the schema.**
*   [x] **5.2: Review Adapter `createUser`:** Open `lib/db/auth-adapter.ts`. Review the `createUser` function. Verify it correctly inserts into the `user` table using `email` and `name` provided by NextAuth (from Google), and sets a default `subscriptionStatus`. Verify it does *not* attempt to insert a password. (The existing code seems correct).
*   [x] **5.3: Review Adapter `getUserByAccount`:** Review the `getUserByAccount` function. Verify it correctly joins `UserOAuthAccountTable` and `user` tables to find a user based on `provider` ('google') and `providerAccountId`. (The existing code seems correct).
*   [x] **5.4: Review Adapter `linkAccount`:** Review the `linkAccount` function. Verify it correctly inserts a new record into `UserOAuthAccountTable` linking the `userId` to the Google `provider` and `providerAccountId`. Verify it handles cases where the link might already exist. (The existing code seems correct).
*   [x] **5.5: Conceptual Verification:** Understand that when a user signs in with Google for the *first time*:
    *   NextAuth calls `getUserByAccount` (fails to find).
    *   NextAuth calls `getUserByEmail` (might find if email exists, or fail).
    *   If user doesn't exist, NextAuth calls `createUser`.
    *   NextAuth calls `linkAccount`.
    *   If a user *exists* by email but hasn't linked Google, NextAuth *should* call `linkAccount` for the existing user.
    *   The adapter handles this flow correctly.

---

#### **Story 6: Remove Unused UI Components**

**Goal:** Clean up the codebase by removing components that were only used for the email/password authentication flow.

**Target Files:** `components/auth-form.tsx`, `components/submit-button.tsx`

**Tasks:**

*   [x] **6.1: Delete AuthForm:** Delete the file `components/auth-form.tsx`.
*   [x] **6.2: Delete SubmitButton:** Delete the file `components/submit-button.tsx` (assuming it was only used within `AuthForm`). If it's used elsewhere, skip this step.
*   [x] **6.3: Check Imports:** Search the codebase (using IDE search) for any remaining imports of `AuthForm` or `SubmitButton` and remove them (likely already handled by UI updates in Stories 2 & 3).

---

#### **Story 7: Verify Middleware Logic**

**Goal:** Ensure the middleware correctly handles authentication checks now that only Google OAuth exists.

**Target File:** `middleware.ts`

**Tasks:**

*   [x] **7.1: Open File:** Open the file `middleware.ts`.
*   [x] **7.2: Review Logic:** Examine the middleware function wrapped by `NextAuth(authConfig).auth`.
*   [x] **7.3: Verify `isLoggedIn`:** Confirm that `isLoggedIn` is correctly determined by `!!session`. This should work fine for JWT sessions populated by Google OAuth.
*   [x] **7.4: Verify Public Path Logic:** Ensure `isPublicPath` correctly identifies public routes (`/login`, `/register`, `/api/auth/*`).
*   [x] **7.5: Verify Redirect Logic:**
    *   Check the condition `if (requiresAuth && !isLoggedIn)` redirects unauthenticated users trying to access protected routes to `/login`. This is correct.
    *   Check the condition `if (isLoggedIn && (isOnLogin || isOnRegister))` redirects authenticated users away from login/register pages to `/`. This is correct.
*   [x] **7.6: Verify Premium Check:** Confirm the premium check logic (`if (isLoggedIn) { ... if (isPremiumPath) { ... } }`) correctly reads `subscriptionStatus` from the `session.user` (populated by the `session` callback in `auth.ts`). This should still work.
*   [x] **7.7: Save File:** Save the file (likely no changes needed unless there was specific Credentials logic, which is uncommon in middleware).

---

#### **Story 8: Comprehensive Functionality Testing**

**Goal:** Rigorously test *all* aspects of the application to ensure no features were unintentionally broken by the authentication changes.

**Target Files:** Running Application (`bun run dev`)

**Tasks:**

*   [ ] **8.1: Clear Browser Data:** Clear cookies, local storage, and session storage for the application domain.
*   [ ] **8.2: Test Unauthenticated Access:**
    *   [ ] Try accessing `/`. Verify redirection to `/login`.
    *   [ ] Try accessing a specific chat URL `/chat/[uuid]`. Verify redirection to `/login` (or appropriate handling if public chats are allowed unauthenticated). *Correction:* Middleware allows access, page component should handle auth/visibility. Verify public chats load, private redirect.
    *   [ ] Try accessing `/subscription`. Verify redirection to `/login`.
*   [ ] **8.3: Test Google Sign-Up (New User):**
    *   [ ] Navigate to `/register` (or `/login`).
    *   [ ] Click "Sign in with Google".
    *   [ ] Use a Google account **not** previously used with the app.
    *   [ ] Complete the Google OAuth flow.
    *   [ ] **Verify:** User is created in the database (`User` and `UserOAuthAccount` tables).
    *   [ ] **Verify:** User is redirected to the application's main page (`/`).
    *   [ ] **Verify:** User session is active (e.g., user email shown in sidebar).
    *   [ ] **Verify:** Default `subscriptionStatus` is 'inactive' in the database and session.
*   [ ] **8.4: Test Google Sign-In (Existing User):**
    *   [ ] Log out.
    *   [ ] Navigate to `/login`.
    *   [ ] Click "Sign in with Google".
    *   [ ] Use the *same* Google account as in step 8.3.
    *   [ ] Complete the Google OAuth flow.
    *   [ ] **Verify:** User is logged in successfully and redirected to `/`.
    *   [ ] **Verify:** No new user or account record is created in the database.
*   [ ] **8.5: Test Core Chat Functionality:**
    *   [ ] Start a new chat.
    *   [ ] Send messages (text). Verify responses stream correctly.
    *   [ ] Upload a file. Verify it attaches and can be used in a message.
    *   [ ] Use the "Search Web" toggle. Verify search results appear and are used.
    *   [ ] Change AI models. Verify the selected model is used (check API route logs if needed).
    *   [ ] Use message actions (Copy, Regenerate, Vote). Verify they work.
*   [ ] **8.6: Test Artifact Functionality:**
    *   [ ] Create each type of artifact (Text, Code, Image, Sheet). Verify creation and initial content generation.
    *   [ ] Interact with each artifact (edit text, run code, edit image prompt, edit sheet). Verify updates work and versions are created.
    *   [ ] Use artifact-specific actions and toolbar items. Verify they function.
    *   [ ] Open and close artifacts. Verify state persistence/resetting.
*   [ ] **8.7: Test History and Sidebar:**
    *   [ ] Verify new chats appear in the sidebar.
    *   [ ] Navigate between different chats. Verify content loads correctly.
    *   [ ] Pin/Unpin chats. Verify behavior and persistence.
    *   [ ] Change chat visibility (Public/Private). Verify behavior and persistence.
    *   [ ] Delete a chat. Verify it's removed from the list and DB.
    *   [ ] Use the chat search (`Cmd/Ctrl+K`). Verify it finds relevant chats based on title/content.
*   [ ] **8.8: Test Subscription/Payment Flow:**
    *   [ ] Navigate to `/subscription`.
    *   [ ] If user is free, attempt to upgrade. Verify Midtrans Snap window appears.
    *   [ ] (Requires Sandbox) Complete a successful payment. Verify `subscriptionStatus` updates to 'active' in DB/session and UI reflects Pro status.
    *   [ ] (Requires Sandbox) Simulate a failed payment. Verify status remains 'inactive' or handles appropriately.
    *   [ ] If user is active, verify the status page shows correct info (renews on, plan, cancel button).
    *   [ ] Test cancelling a subscription. Verify status changes.
    *   [ ] Test accessing a Pro-only model/feature as a Free user. Verify the upgrade prompt appears (`UpgradeDialog`).
    *   [ ] Test accessing a Pro-only model/feature as a Pro user. Verify access is granted.
*   [ ] **8.9: Test Logout:**
    *   [ ] Click the Sign Out button.
    *   [ ] **Verify:** User is logged out and redirected (likely to `/login`).
    *   [ ] **Verify:** Session is cleared.
*   [ ] **8.10: Cross-Browser/Device Testing (Basic):**
    *   [ ] Repeat key authentication and chat flows on a different browser.
    *   [ ] Repeat key authentication and chat flows using browser's mobile emulation mode.
*   [ ] **8.11: Console Check:** Monitor the browser's developer console and the `bun run dev` terminal output for any new errors or warnings during testing.

---

**Completion Criteria:** All tasks completed. Google OAuth is the sole authentication method. All existing application features function identically to before the change. No regressions are observed. Database schema remains unchanged.