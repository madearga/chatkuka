import { NextResponse } from 'next/server';
import { z } from 'zod'; // Keep Zod import for potential future use, though not directly used in this copied logic

import { updatePaymentStatus } from '@/lib/db/queries'; // Assuming updatePaymentStatus is here
import { verifyWebhookSignature } from '@/lib/midtrans'; // Assuming verifyWebhookSignature is here
import { db } from '@/lib/db/db'; // Assuming db is here
import { user } from '@/lib/db/schema'; // Assuming user schema is here
import { eq } from 'drizzle-orm'; // Assuming eq is here

// Helper function to handle successful subscription payments (copied from original file)
async function handleSuccessfulSubscriptionPayment({
  orderId,
  userId,
  isInitial,
  savedTokenId,
}: {
  orderId: string;
  userId: string;
  isInitial: boolean;
  savedTokenId?: string;
}) {
  try {
    // Calculate the new period end date (1 month from now)
    const newPeriodEnd = new Date();
    newPeriodEnd.setMonth(newPeriodEnd.getMonth() + 1);

    // Update user's subscription status
    await db
      .update(user)
      .set({
        subscriptionStatus: 'active',
        currentPeriodEnd: newPeriodEnd,
        // Use savedTokenId if available, otherwise use tokenId if it was passed (though it's not in the original PUT logic params directly)
        ...(isInitial && savedTokenId ? { midtransPaymentTokenId: savedTokenId } : {}),
      })
      .where(eq(user.id, userId));

    console.log(`Successfully processed ${isInitial ? 'initial' : 'renewal'} subscription payment for user ${userId}`);
  } catch (error) {
    console.error(`Failed to process successful subscription payment:`, error);
    // It's often better to still return a success (200 OK) to Midtrans even if DB update fails,
    // to prevent Midtrans from retrying indefinitely. Log the error for investigation.
    // throw error; // Avoid throwing here unless Midtrans retry is desired for this specific failure
  }
}

// Helper function to handle failed subscription payments (copied from original file)
async function handleFailedSubscriptionPayment({
  orderId,
  userId,
  isInitial,
}: {
  orderId: string;
  userId: string;
  isInitial: boolean;
}) {
  try {
    // If it's an initial payment, update status to inactive
    // If it's a renewal, update status to past_due
    const newStatus = isInitial ? 'inactive' : 'past_due';

    // Update user's subscription status
    await db
      .update(user)
      .set({
        subscriptionStatus: newStatus,
      })
      .where(eq(user.id, userId));

    console.log(`Processed failed ${isInitial ? 'initial' : 'renewal'} subscription payment for user ${userId}`);
  } catch (error) {
    console.error(`Failed to process failed subscription payment:`, error);
     // It's often better to still return a success (200 OK) to Midtrans even if DB update fails,
    // to prevent Midtrans from retrying indefinitely. Log the error for investigation.
    // throw error;
  }
}


// Handle Midtrans webhook notifications via POST
export async function POST(request: Request) {
  console.log("Received POST request on /api/payment/notification");
  try {
    // Get the raw request body
    const rawBody = await request.text();
    let notification;
    try {
       notification = JSON.parse(rawBody);
       console.log("Webhook: Parsed notification body:", notification);
    } catch (parseError) {
        console.error('Webhook Error: Failed to parse request body as JSON', parseError);
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    // Extract notification data
    const orderId = notification.order_id;
    const transactionStatus = notification.transaction_status;
    const paymentType = notification.payment_type;
    const transactionId = notification.transaction_id;
    const grossAmount = notification.gross_amount?.toString();
    const savedTokenId = notification.saved_token_id;
    const tokenId = notification.token_id;
    const fraudStatus = notification.fraud_status;
    const statusCode = notification.status_code; // Get status code for verification

    // --- Get the signature_key FROM THE JSON BODY --- 
    const signatureFromBody = notification.signature_key;
    if (!signatureFromBody) {
      console.error(`Webhook Error: Missing 'signature_key' in notification body for Order ID: ${orderId}`);
      // Decide how to handle: return 400 Bad Request or potentially process without verification (unsafe)
      return NextResponse.json({ error: "Missing signature_key in body" }, { status: 400 });
    }
    console.log(`Webhook: Found signature_key in body for Order ID: ${orderId}`);

    // --- Data Validation ---
    if (!orderId || !transactionStatus || !grossAmount || !statusCode) {
       console.error('Webhook Error: Missing essential notification data (order_id, transaction_status, gross_amount, status_code)');
       return NextResponse.json({ error: 'Missing essential notification data' }, { status: 400 });
    }
    console.log(`Webhook: Processing notification for Order ID: ${orderId}, Status: ${transactionStatus}`);

    // Verify the signature using the key from the body
    console.log("Webhook: Verifying signature...");
    const isValidSignature = await verifyWebhookSignature({
      orderId,
      statusCode: statusCode, // Use the status_code from the body
      grossAmount: grossAmount,
      receivedSignature: signatureFromBody // Use the signature from the body
    });

    if (!isValidSignature) {
      console.error(`Webhook Error: Invalid signature for Order ID: ${orderId}`);
      // Return 403 Forbidden for invalid signature
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
    }
    console.log(`Webhook: Signature verified successfully for Order ID: ${orderId}`);

    // --- Handle Fraud Status (Important!) ---
    // Only process 'settlement' or 'capture' if fraud status is 'accept'.
    // Handle 'challenge' based on your business policy (e.g., review manually, treat as pending).
    if (fraudStatus === 'deny') {
        console.log(`Webhook: Fraud status is 'deny' for Order ID: ${orderId}. Treating as failed.`);
        // Optionally update your DB to reflect fraud denial
        // You might want a specific status like 'fraud_denied'
        await updatePaymentStatus({
             orderId,
             status: 'failed', // Or a specific fraud status
             paymentType,
             transactionId,
        });
        // Return 200 OK to Midtrans to stop retries.
        return NextResponse.json({ success: true, message: "Fraud denied, processed." });
    }

     if (fraudStatus === 'challenge') {
        console.log(`Webhook: Fraud status is 'challenge' for Order ID: ${orderId}. Requires review. Treating as pending for now.`);
         // Keep status as pending or update to a specific 'challenge' status
         // Return 200 OK to Midtrans to stop retries.
         return NextResponse.json({ success: true, message: "Fraud challenge, review required." });
     }

     // Proceed only if fraudStatus is 'accept'
     if (fraudStatus !== 'accept') {
         console.log(`Webhook: Unknown or unhandled fraud status '${fraudStatus}' for Order ID: ${orderId}. Ignoring.`);
         return NextResponse.json({ success: true, message: "Unhandled fraud status." });
     }

     console.log(`Webhook: Fraud status 'accept' for Order ID: ${orderId}. Proceeding...`); // Add log


    // Determine payment status based on transaction_status (only if fraudStatus is 'accept')
    let status: 'pending' | 'success' | 'failed' | 'expired';

    switch (transactionStatus) {
      case 'capture': // Card payment successful capture
      case 'settlement': // Other payment methods successful
        status = 'success';
        break;
      case 'deny': // Card payment denied by bank
      case 'cancel': // User cancelled on payment page or Core API cancel
      case 'failure': // General failure (less common)
        status = 'failed';
        break;
      case 'expire': // Payment link/request expired
        status = 'expired';
        break;
       case 'pending': // Transaction is pending payment
         status = 'pending';
         break;
      default:
         console.log(`Webhook: Unhandled transaction_status '${transactionStatus}' for Order ID: ${orderId}. Treating as pending.`);
        status = 'pending'; // Default to pending for unknown statuses
    }
     console.log(`Webhook: Determined internal status: '${status}' for Order ID: ${orderId}`); // Add log


    // Update payment status in database
     console.log(`Webhook: Updating payment status in DB for Order ID: ${orderId} to '${status}'...`); // Add log
    const updatedPayment = await updatePaymentStatus({
      orderId,
      status,
      paymentType, // Store the payment type used
      transactionId, // Store Midtrans transaction ID
    });
    console.log(`Webhook: DB payment status updated for Order ID: ${orderId}`); // Add log


    // --- Subscription Logic ---
    // Check if this is a subscription-related payment AFTER main status update
    const isSubscriptionInitial = orderId.startsWith('SUB_INIT_');
    const isSubscriptionRenewal = orderId.startsWith('SUB_RENEW_');

    if ((isSubscriptionInitial || isSubscriptionRenewal)) {
        console.log(`Webhook: Order ID ${orderId} is related to a subscription.`); // Add log
        if (status === 'success') {
             console.log(`Webhook: Handling SUCCESSFUL subscription payment for Order ID: ${orderId}`); // Add log
            // Handle successful subscription payment
            await handleSuccessfulSubscriptionPayment({
                orderId,
                userId: updatedPayment.userId, // Ensure updatePaymentStatus returns the userId
                isInitial: isSubscriptionInitial,
                // Pass the correct token ID based on whether it's initial or renewal
                savedTokenId: savedTokenId || tokenId, // Use saved_token_id if available (recurring), else token_id (potential first save)
            });
        } else if (status === 'failed' || status === 'expired') { // Also handle expired as failed subscription
             console.log(`Webhook: Handling FAILED/EXPIRED subscription payment for Order ID: ${orderId}`); // Add log
            // Handle failed/expired subscription payment
            await handleFailedSubscriptionPayment({
                orderId,
                userId: updatedPayment.userId, // Ensure updatePaymentStatus returns the userId
                isInitial: isSubscriptionInitial,
            });
        } else {
             console.log(`Webhook: Subscription Order ID ${orderId} has status '${status}', no user update needed yet.`); // Add log
        }
    } else {
         console.log(`Webhook: Order ID ${orderId} is NOT related to a subscription.`); // Add log
    }


    // Always return a success response to Midtrans if processing reached this point without critical errors
    console.log(`Webhook: Successfully processed notification for Order ID: ${orderId}. Sending 200 OK to Midtrans.`); // Add log
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Webhook processing failed unexpectedly:', error);
    // Return 500 for unexpected server errors, Midtrans might retry
    return NextResponse.json(
      { error: 'Failed to process webhook due to server error' },
      { status: 500 }
    );
  }
} 