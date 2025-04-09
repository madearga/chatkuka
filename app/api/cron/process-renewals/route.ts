import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { user } from '@/lib/db/schema';
import { createPayment } from '@/lib/db/queries';
import { coreApi, generateOrderId } from '@/lib/midtrans';
import { and, eq, lte, isNotNull } from 'drizzle-orm';

// Monthly subscription plan details
const SUBSCRIPTION_PLAN = {
  id: 'monthly_99k',
  name: 'Monthly Subscription',
  price: 99000,
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
      usersToRenew.map(async (user) => {
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
              token_id: user.midtransPaymentTokenId,
              authentication: true,
            },
            customer_details: {
              email: user.email,
              first_name: 'Subscriber',
              customer_id: user.id,
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
            .where(eq(user.id, user.id));

          // Record the payment
          await createPayment({
            orderId,
            amount: SUBSCRIPTION_PLAN.price.toString(),
            userId: user.id,
            status: chargeResponse.transaction_status || 'pending',
            transactionId: chargeResponse.transaction_id,
            paymentType: 'credit_card',
          });

          return {
            userId: user.id,
            orderId,
            status: 'success',
            transactionStatus: chargeResponse.transaction_status,
          };
        } catch (error) {
          console.error(`Failed to renew subscription for user ${user.id}:`, error);
          
          // If renewal fails, mark the subscription as past_due
          await db
            .update(user)
            .set({
              subscriptionStatus: 'past_due',
            })
            .where(eq(user.id, user.id));
            
          return {
            userId: user.id,
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
