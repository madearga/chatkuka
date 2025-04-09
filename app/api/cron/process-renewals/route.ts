import { NextResponse } from 'next/server';
import { db } from '@/lib/db/db';
import { user } from '@/lib/db/schema';
import { createPayment, updatePaymentStatus } from '@/lib/db/queries';
import { coreApi, generateOrderId } from '@/lib/midtrans';
import { and, eq, lte, isNotNull } from 'drizzle-orm';

// Monthly subscription plan details
const SUBSCRIPTION_PLAN = {
  id: 'monthly_99k',
  name: 'Monthly Subscription',
  price: 1000, // Changed from 99000 to 1000 for testing
  currency: 'IDR',
};

// Secret key for securing the cron job endpoint
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: Request) {
  try {
    // Verify the cron job secret
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');

    if (!CRON_SECRET || secret !== CRON_SECRET) {
      console.error('Invalid or missing CRON_SECRET');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find users with active subscriptions that need renewal
    const usersToRenew = await db
      .select({
        id: user.id,
        email: user.email,
        midtransPaymentTokenId: user.midtransPaymentTokenId,
        currentPeriodEnd: user.currentPeriodEnd,
      })
      .from(user)
      .where(
        and(
          eq(user.subscriptionStatus, 'active'),
          isNotNull(user.currentPeriodEnd),
          lte(user.currentPeriodEnd, new Date()),
          isNotNull(user.midtransPaymentTokenId)
        )
      );

    console.log(`Found ${usersToRenew.length} users to renew`);

    // Process each user's renewal
    const results = await Promise.all(
      usersToRenew.map(async (userData) => {
        try {
          // Generate a unique order ID for this renewal
          const orderId = generateOrderId('SUB_RENEW_');

          // Prepare the charge payload
          const chargePayload = {
            payment_type: 'credit_card',
            transaction_details: {
              order_id: orderId,
              gross_amount: SUBSCRIPTION_PLAN.price,
            },
            credit_card: {
              token_id: userData.midtransPaymentTokenId,
              authentication: true,
            },
            customer_details: {
              email: userData.email,
              first_name: 'Subscriber',
              customer_id: userData.id,
            },
          };

          // Attempt to charge the saved payment method
          const chargeResponse = await coreApi.charge(chargePayload);

          // Calculate the new period end date (1 month from now)
          const newPeriodEnd = new Date();
          newPeriodEnd.setMonth(newPeriodEnd.getMonth() + 1);

          // Update the user's subscription period
          await db
            .update(user)
            .set({
              currentPeriodEnd: newPeriodEnd,
            })
            .where(eq(user.id, userData.id));

          // Record the initial payment attempt
          const newPayment = await createPayment({
            orderId,
            amount: SUBSCRIPTION_PLAN.price.toString(),
            userId: userData.id,
            // snapToken is not relevant here
            // status defaults to pending
          });

          // Update the payment record with transaction details from the charge
          if (chargeResponse.transaction_id) {
             await updatePaymentStatus({
               orderId, // Use the same orderId
               status: chargeResponse.transaction_status === 'capture' || chargeResponse.transaction_status === 'settlement'
                         ? 'success'
                         : chargeResponse.transaction_status === 'pending'
                           ? 'pending'
                           : 'failed', // Determine status based on charge response
               transactionId: chargeResponse.transaction_id,
               paymentType: 'credit_card', // Or chargeResponse.payment_type if available
             });
          } else {
             // Handle cases where charge might succeed but transaction_id is missing (unlikely)
             await updatePaymentStatus({ orderId, status: 'failed' });
          }

          return {
            userId: userData.id,
            orderId,
            status: 'success',
            transactionStatus: chargeResponse.transaction_status,
          };
        } catch (error) {
          console.error(`Failed to renew subscription for user ${userData.id}:`, error);

          // If renewal fails, mark the subscription as past_due
          await db
            .update(user)
            .set({
              subscriptionStatus: 'past_due',
            })
            .where(eq(user.id, userData.id));

          return {
            userId: userData.id,
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      })
    );

    return NextResponse.json({
      processed: usersToRenew.length,
      results,
    });
  } catch (error) {
    console.error('Failed to process subscription renewals:', error);
    return NextResponse.json(
      { error: 'Failed to process subscription renewals' },
      { status: 500 }
    );
  }
}
