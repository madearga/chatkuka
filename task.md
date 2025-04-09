Okay, this is a significant feature enhancement involving recurring payments. Implementing subscriptions requires careful handling of state, secure payment method storage (via tokenization), webhook verification, and potentially scheduled tasks.

Here is a very detailed checklist designed for a competent AI coding agent to implement a Rp 99,000 monthly subscription using Midtrans, building upon the existing codebase.

---

### **Project Checklist: Midtrans Monthly Subscription (Rp 99,000)**

**Goal:** Implement a feature allowing users to subscribe to a monthly plan costing Rp 99,000 using Midtrans. This includes initiating the subscription, handling the first payment, securely storing payment method details (via Midtrans tokenization), processing recurring payments (likely via backend logic triggering Midtrans Core API), managing subscription status, handling webhooks securely, and controlling access based on subscription status.

**Assumptions:**
*   The subscription grants access to specific premium features or removes limitations (to be defined in Access Control).
*   We will use Midtrans Snap for the *initial* payment and user experience, aiming to tokenize the card during this process.
*   Subsequent *recurring* payments will be initiated by our backend (using a scheduler/cron job) via the Midtrans Core API using the stored token.
*   Midtrans's native subscription features might not be used directly; our application manages the subscription lifecycle and triggers renewals.

---

**Epic 1: Database Schema & Migrations**

*   **Goal:** Update the database schema to support subscription information and track payment history related to subscriptions.

    *   #### Story 1.1: Enhance `User` Table Schema
        *   **Goal:** Add fields to the `User` table to track subscription status and details.
        *   **Target File:** `lib/db/schema.ts`
        *   [x] Locate the `user` table definition.
        *   [x] Add a new `subscriptionStatus` column:
            *   Type: `varchar` with an enum constraint.
            *   Enum values: `'inactive'`, `'active'`, `'pending_activation'`, `'past_due'`, `'cancelled'`.
            *   Default value: `'inactive'`.
            *   `notNull()`.
        *   [x] Add a new `planId` column (optional, but good practice):
            *   Type: `varchar(50)`.
            *   `notNull(false)` (allow null for non-subscribed users).
            *   *Example value could be `'monthly_99k'`*.
        *   [x] Add a new `currentPeriodEnd` column:
            *   Type: `timestamp`.
            *   `notNull(false)` (allow null for inactive subscriptions).
            *   This will store the date/time when the current subscription period expires and the next charge is due.
        *   [x] Add a new `midtransPaymentTokenId` column:
            *   Type: `text`.
            *   `notNull(false)`.
            *   This will securely store the token identifier provided by Midtrans for the user's saved payment method (e.g., saved card token). **Do NOT store raw card details.**
        *   [x] Add a new `midtransSubscriptionId` column (optional, if using Midtrans specific subscription feature - less likely needed for this plan):
            *   Type: `varchar(100)`.
            *   `notNull(false)`.

    *   #### Story 1.2: Enhance `Payment` Table Schema
        *   **Goal:** Potentially add a field to link payments to subscription cycles if detailed tracking is needed.
        *   **Target File:** `lib/db/schema.ts`
        *   [x] Locate the `payment` table definition.
        *   [x] *Consider* adding a `subscriptionCycleStart` (timestamp, nullable) and `subscriptionCycleEnd` (timestamp, nullable) if tracking payment per cycle is required. *Decision: Skip for now to keep it simpler; rely on `createdAt` and `User.currentPeriodEnd`.*
        *   [x] *Consider* adding a `paymentFor` column (e.g., enum: 'one-time', 'subscription_initial', 'subscription_renewal'). *Decision: Skip for now; infer from context.*
        *   [x] Verify existing fields (`orderId`, `amount`, `status`, `userId`, `transactionId`, `paymentType`) are sufficient for tracking recurring payments.

    *   #### Story 1.3: Generate and Apply Database Migration
        *   **Goal:** Create and apply a Drizzle migration reflecting the schema changes.
        *   **Tool:** Drizzle Kit CLI
        *   [x] Run `pnpm run db:generate` (or equivalent Drizzle Kit command) to create a new migration file in `lib/db/migrations/`.
        *   [x] Inspect the generated SQL migration file for correctness. Ensure it adds the new columns to the `User` table with correct types, defaults, and nullability.
        *   [x] Run `pnpm run db:migrate` (or equivalent command) to apply the migration to the database. Verify successful application in the console output.

---

**Epic 2: Backend API & Logic**

*   **Goal:** Implement API endpoints and core logic for subscription initiation, management, and recurring billing.

    *   #### Story 2.1: Update Midtrans Configuration
        *   **Goal:** Ensure all necessary Midtrans keys and settings are configured.
        *   **Target Files:** `lib/midtrans.ts`, `.env.local` / Vercel Env Vars
        *   [x] Verify `MIDTRANS_SERVER_KEY`, `MIDTRANS_CLIENT_KEY`, `MIDTRANS_ENV` are set.
        *   [x] **CRITICAL:** Add `MIDTRANS_SIGNATURE_KEY` (obtained from Midtrans Dashboard MAP -> Settings -> Access Keys) to environment variables. This is **different** from the Server Key and vital for webhook security.
        *   [x] In `lib/midtrans.ts`, consider initializing a `midtransClient.CoreApi` instance alongside the existing `Snap` instance if needed for direct charges using tokens (likely required for renewals). Ensure it uses the correct server key and production status.
            ```typescript
            // In lib/midtrans.ts (add alongside snap)
            export const coreApi = new midtransClient.CoreApi({
              isProduction: IS_PRODUCTION,
              serverKey: MIDTRANS_SERVER_KEY,
              clientKey: MIDTRANS_CLIENT_KEY, // Client key might not be needed for Core API server-side calls
            });
            ```

    *   #### Story 2.2: Create Subscription Initiation API Endpoint
        *   **Goal:** An endpoint for the frontend to call when a user clicks "Subscribe". This endpoint will prepare the initial Midtrans payment.
        *   **Target File:** `app/api/subscriptions/initiate/route.ts` (Create this file/route)
        *   [x] Create the route handler file (`route.ts`).
        *   [x] Implement a `POST` handler function.
        *   [x] **Authentication:** Use `await auth()` to get the session. Return 401 if no user or user ID.
        *   [x] **Check Existing Subscription:** Query the database (`User` table) for the user's current `subscriptionStatus`. If already 'active' or 'pending_activation', return an appropriate error/message (e.g., 409 Conflict).
        *   [x] **Define Plan Details:** Hardcode or fetch plan details (ID: `'monthly_99k'`, amount: `1000`). <!-- Changed from 99000 to 1000 for testing -->
        *   [x] **Generate Order ID:** Use `generateOrderId('SUB_INIT_')` from `lib/midtrans.ts`.
        *   [x] **Prepare Midtrans Snap Parameters:**
            *   `transaction_details`: Use the generated `orderId` and `gross_amount: 1000`. <!-- Changed from 99000 to 1000 for testing -->
            *   `customer_details`: Populate with user's email and ID from session.
            *   `item_details`: Define the subscription item (e.g., `{ id: 'monthly_99k', price: 1000, quantity: 1, name: 'Monthly Subscription' }`). <!-- Changed from 99000 to 1000 for testing -->
            *   **Tokenization:** Add `credit_card: { save_card: true }` to *request* Midtrans to attempt saving the card details securely if the user pays with a card. (Note: Actual token availability depends on Midtrans flow and webhook).
        *   [x] **Call Midtrans Snap:** Use `createSnapTransaction` (from `lib/midtrans.ts`) with the prepared parameters.
        *   [x] **Handle Midtrans Errors:** Add `try...catch` around the `createSnapTransaction` call. Log errors and return a 500 response if Midtrans fails.
        *   [x] **Update Database (Initial):** *Before* returning the token, update the user's record in the database:
            *   Set `subscriptionStatus` to `'pending_activation'`.
            *   Set `planId` to `'monthly_99k'`.
            *   *Do not* set `currentPeriodEnd` or `midtransPaymentTokenId` yet (wait for successful payment webhook).
        *   [x] **Return Response:** Return a JSON response containing the `snapToken` and `orderId` to the frontend. Example: `NextResponse.json({ token: transaction.token, orderId })`.

    *   #### Story 2.3: Create Subscription Management API Endpoint
        *   **Goal:** Endpoints for users to view status and cancel their subscription.
        *   **Target File:** `app/api/subscriptions/manage/route.ts` (Create this file/route)
        *   [x] Create the route handler file.
        *   [x] Implement a `GET` handler:
            *   Auth check.
            *   Fetch user's `subscriptionStatus`, `planId`, `currentPeriodEnd` from the DB.
            *   Return this data as JSON.
        *   [x] Implement a `POST` handler (for cancellation):
            *   Auth check.
            *   Get user's current subscription details from DB.
            *   If status is already `'cancelled'` or `'inactive'`, return success/no-action needed.
            *   Update user's `subscriptionStatus` in the DB to `'cancelled'`. *Consider if you want immediate cancellation or cancellation at period end. For simplicity, let's do immediate for now, but `cancel_at_period_end` is often better UX.*
            *   *(Optional - If using Midtrans Subscription API):* Call the relevant Midtrans API to cancel the subscription there. If managing manually, this step isn't needed.
            *   Log the cancellation action.
            *   Return a success response.

    *   #### Story 2.4: Implement Recurring Billing Logic (Scheduler/Cron Job)
        *   **Goal:** Define the logic that will run periodically to charge subscribed users.
        *   **Target Platform:** Vercel Cron Jobs (or other scheduler). Configure to run daily (e.g., `0 0 * * *`).
        *   **Target Logic Location:** Can be a Server Action (`lib/actions/billing.ts`) or a dedicated API route (`app/api/cron/process-renewals/route.ts`) called by the cron job. Let's plan for an API route secured by a secret.
        *   [x] Create the API route file (e.g., `app/api/cron/process-renewals/route.ts`).
        *   [x] **Security:** Add a check for a secret key passed in the request header or query parameter, comparing it against an environment variable (`CRON_SECRET`). Return 401/403 if invalid.
        *   [x] **Query for Due Renewals:**
            *   Get the current date/time.
            *   Query the `User` table for users where:
                *   `subscriptionStatus` is `'active'`.
                *   `currentPeriodEnd` is not null AND `currentPeriodEnd` is less than or equal to the current date/time.
                *   `midtransPaymentTokenId` is not null.
        *   [x] **Process Each Due User:** Loop through the fetched users.
            *   For each user:
                *   **Generate Order ID:** Create a unique `orderId` for this renewal attempt (e.g., `generateOrderId('SUB_RENEW_')`).
                *   **Prepare Core API Charge Payload:**
                    *   `payment_type`: `'credit_card'`
                    *   `transaction_details`: `{ order_id: newOrderId, gross_amount: 1000 }` <!-- Changed from 99000 to 1000 for testing -->
                    *   `credit_card`: `{ token_id: user.midtransPaymentTokenId, authentication: true }` (Use the stored token ID. `authentication: true` might be needed for subsequent charges).
                    *   `customer_details`: Include user email/ID if needed by Midtrans.
                *   **Call Midtrans Core API:** Use the initialized `coreApi.charge(payload)` method. Wrap in `try...catch`.
                *   **Handle Midtrans Response:**
                    *   **Success (`transaction_status: 'capture'` or `'settlement'`):** Log success. The *actual* subscription update (`currentPeriodEnd`, `payment` record) should happen in the **webhook handler** upon receiving the success notification from Midtrans for this `transaction_id`.
                    *   **Pending (`transaction_status: 'pending'`):** Log pending status. Wait for webhook.
                    *   **Failure (`transaction_status: 'deny'`, `'cancel'`, `'expire'`, or error thrown):**
                        *   [x] Log the failure details (transaction ID, status, message).
                        *   [x] Update user's `subscriptionStatus` in DB to `'past_due'`.
                        *   [x] *(Optional)* Implement retry logic (e.g., flag for retry next day, up to X times).
                        *   [x] *(Optional)* Trigger a notification to the user.
        *   [x] Return a success response from the cron API route (e.g., `NextResponse.json({ processed: users.length })`).

---

**Epic 3: Secure Webhook Handling** ✅

*   **Goal:** Securely process incoming notifications from Midtrans for both initial and recurring payments.

    *   #### Story 3.1: Enhance Midtrans Webhook Handler
        *   **Goal:** Implement signature verification and handle various transaction statuses correctly for subscriptions.
        *   **Target File:** `app/api/payment/route.ts` (Enhance existing `PUT` handler)
        *   [x] **Implement Signature Verification:** Add the SHA-512 signature check using `MIDTRANS_SIGNATURE_KEY` as detailed in the previous response's "Midtrans Implementation Steps - Step 1". **This is mandatory.** Return 403 Forbidden if the signature is invalid.
        *   [x] **Parse Notification:** Safely parse the incoming JSON payload *after* signature verification (or use raw body for verification if needed). Extract `order_id`, `transaction_status`, `transaction_id`, `payment_type`, `gross_amount`, `masked_card`, `saved_token_id`, `token_id`, `fraud_status`, etc.
        *   [x] **Identify Payment Type (Initial vs. Renewal):** Determine if the `order_id` corresponds to an initial subscription payment (e.g., starts with `SUB_INIT_`) or a renewal (e.g., starts with `SUB_RENEW_`).
        *   [x] **Handle Successful Initial Payment (`settlement` or `capture` for `SUB_INIT_` order):**
            *   [x] Find the user associated with the `order_id` (query `payment` table, then `user` table, or infer from webhook if possible).
            *   [x] Verify `gross_amount` matches 99000.
            *   [x] **Capture Payment Token:** Extract the relevant token ID (`saved_token_id` or `token_id` - check Midtrans webhook docs for the exact field for saved cards/tokens) from the payload.
            *   [x] **Update User:** Update the user's record in the DB:
                *   Set `subscriptionStatus` to `'active'`.
                *   Set `midtransPaymentTokenId` to the captured token ID.
                *   Set `currentPeriodEnd` to 1 month from the current date.
            *   [x] **Record Payment:** Insert a record into the `payment` table for this successful transaction.
            *   [x] Log success.
        *   [x] **Handle Successful Renewal Payment (`settlement` or `capture` for `SUB_RENEW_` order):**
            *   [x] Find the user associated with the `order_id`.
            *   [x] Verify `gross_amount`.
            *   [x] **Update User:** Update `currentPeriodEnd` by adding 1 month to the *previous* `currentPeriodEnd` (or current date if renewal was late). Ensure `subscriptionStatus` is `'active'`.
            *   [x] **Record Payment:** Insert a record into the `payment` table.
            *   [x] Log success.
        *   [x] **Handle Failed/Denied/Expired Payments (for renewals):**
            *   [x] Find the user associated with the `order_id`.
            *   [x] **Update User:** Set `subscriptionStatus` to `'past_due'` or `'inactive'` based on your business rules/retry strategy.
            *   [x] **Record Payment Attempt (Optional):** Consider logging failed attempts in the `payment` table with status 'failed'.
            *   [x] Log failure.
        *   [x] **Handle Pending Payments:** Log the status. Usually no immediate DB action is needed; wait for a final status webhook.
        *   [x] **Handle Fraud Status:** Implement logic based on `fraud_status` if necessary (e.g., `challenge`, `accept`, `deny`).
        *   [x] **Return 200 OK:** Respond to Midtrans with a 200 status code quickly after processing (or after validation if processing is deferred).

---

**Epic 4: Frontend User Interface** ✅

*   **Goal:** Provide UI elements for users to subscribe, view status, and cancel.

    *   #### Story 4.1: Subscription Initiation UI
        *   **Goal:** Add a button or section for non-subscribed users to start the subscription process.
        *   **Target File(s):** `components/sidebar-subscription.tsx`, `components/subscription-form.tsx`
        *   [x] Add a "Subscribe Now" button or link, conditionally rendered based on user's subscription status (fetch status via `/api/subscriptions/manage` GET endpoint or include in session).
        *   [x] On click, trigger the process to call `/api/subscriptions/initiate`.

    *   #### Story 4.2: Integrate Midtrans Snap for Initial Payment
        *   **Goal:** Use the Snap token returned by the initiation API to display the Midtrans payment popup.
        *   **Target File:** `components/subscription-form.tsx`
        *   [x] Modify the payment initiation function (triggered by the subscribe button).
        *   [x] Add `async` to the handler.
        *   [x] Add `setIsLoading(true)`.
        *   [x] Call `fetch('/api/subscriptions/initiate', { method: 'POST' })`.
        *   [x] Handle potential errors from the API call (show toast).
        *   [x] Parse the JSON response to get `{ token, orderId }`.
        *   [x] Check if `window.snap` is available (ensure script is loaded).
        *   [x] Call `window.snap.embed(token, { embedId: 'snap-container', onSuccess: ..., onPending: ..., onError: ..., onClose: ... })`.
        *   [x] Implement `onSuccess` callback: Show a temporary success message (e.g., "Payment successful, activating..."). *Do not assume activation is complete here.* Maybe trigger a refetch of subscription status after a short delay. `setIsLoading(false)`.
        *   [x] Implement `onPending`: Show pending message. `setIsLoading(false)`.
        *   [x] Implement `onError`: Show error toast. `setIsLoading(false)`.
        *   [x] Implement `onClose`: `setIsLoading(false)`.
        *   [x] Remove or adapt the static `amount` and `items` from `PaymentForm` if reusing it; data comes from the backend now.

    *   #### Story 4.3: Display Subscription Status UI
        *   **Goal:** Show the user their current plan, status, and next billing date.
        *   **Target File(s):** `components/subscription-form.tsx`
        *   [x] Fetch subscription status using SWR or similar (call `/api/subscriptions/manage` GET).
        *   [x] Conditionally render status information (e.g., "Plan: Monthly", "Status: Active", "Renews on: [formatted date]").
        *   [x] Format the `currentPeriodEnd` date for display.

    *   #### Story 4.4: Cancellation UI
        *   **Goal:** Allow users to cancel their subscription.
        *   **Target File(s):** `components/subscription-form.tsx`
        *   [x] Add a "Cancel Subscription" button, conditionally rendered only for `'active'` users.
        *   [x] Add a confirmation dialog (e.g., use `AlertDialog`) before proceeding.
        *   [x] On confirmation, call `fetch('/api/subscriptions/manage', { method: 'POST' })`.
        *   [x] Handle success: Show success toast, update local UI state/refetch status.
        *   [x] Handle error: Show error toast.

---

**Epic 5: Access Control** ✅

*   **Goal:** Restrict access to premium features based on subscription status.

    *   #### Story 5.1: Implement Access Checks
        *   **Goal:** Add logic to verify active subscription status before allowing access to protected resources.
        *   **Target File(s):** `middleware.ts` (for route protection), specific API routes, specific Page components, specific UI components.
        *   [x] **Identify Premium Features:** Determine which parts of the application are subscription-only.
        *   [x] **Backend Check:** In API routes handling premium actions, fetch the user's `subscriptionStatus`. If not `'active'`, return a 403 Forbidden error.
        *   [x] **Frontend Check (UI):** In components rendering premium features, check the user's status. Conditionally render the feature, show an upgrade prompt, or disable functionality if not active.
        *   [x] **Middleware (Optional):** If entire routes are premium, enhance `middleware.ts` to fetch user status (might require DB lookup if not in JWT session) and redirect non-active users away from protected paths. *Note: Adding DB lookups to middleware can impact performance.*

---

**Epic 6: Testing and Deployment** ⚠️

*   **Goal:** Ensure the subscription flow works correctly in sandbox and production.
*   **Note:** This epic requires actual testing with Midtrans sandbox/production environments and cannot be fully completed in this environment.

    *   #### Story 6.1: Sandbox Environment Testing
        *   **Goal:** Thoroughly test the entire subscription lifecycle using Midtrans Sandbox credentials.
        *   [ ] Configure `.env.local` with Sandbox keys (Server, Client, Signature). Set `MIDTRANS_ENV=sandbox`.
        *   [ ] Test subscription initiation via UI.
        *   [ ] Complete a payment using Midtrans Sandbox payment methods.
        *   [ ] **Verify Webhook:** Use `ngrok` or similar to receive webhooks locally. Verify the signature check passes for valid notifications and fails for invalid ones. Verify the database is updated correctly on successful initial payment (status active, token stored, period end set).
        *   [ ] **Test Renewal Trigger:** Manually trigger the cron job logic/API endpoint (`/api/cron/process-renewals`).
        *   [ ] Simulate a successful renewal payment via Midtrans Sandbox (if possible, or mock the Core API call/webhook). Verify `currentPeriodEnd` is updated in DB and a payment record is created.
        *   [ ] Simulate a failed renewal payment. Verify user status changes to `past_due` or `inactive`.
        *   [ ] Test cancellation flow via UI. Verify status changes in DB. Verify renewals stop.
        *   [ ] Test access control for premium features based on status changes.

    *   #### Story 6.2: Production Deployment
        *   **Goal:** Configure and deploy the feature to production.
        *   [ ] Update Vercel environment variables with Production Midtrans keys (Server, Client, Signature). Set `MIDTRANS_ENV=production`.
        *   [ ] Configure the production webhook URL in the Midtrans Dashboard (MAP).
        *   [ ] Configure the Vercel Cron Job (or chosen scheduler) to call the renewal API route (`/api/cron/process-renewals`) with the `CRON_SECRET`.
        *   [ ] Deploy the application.
        *   [ ] Perform a final smoke test in production with a real payment method.

---