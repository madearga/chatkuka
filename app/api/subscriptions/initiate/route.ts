import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { db } from '@/lib/db';
import { user } from '@/lib/db/schema';
import { createPayment } from '@/lib/db/queries';
import { createSnapTransaction, generateOrderId } from '@/lib/midtrans';
import { eq } from 'drizzle-orm';

// Monthly subscription plan details
const SUBSCRIPTION_PLAN = {
  id: 'monthly_99k',
  name: 'Monthly Subscription',
  price: 99000,
  currency: 'IDR',
};

export async function POST() {
  try {
    // Authentication check
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Check existing subscription status
    const [userRecord] = await db
      .select({
        subscriptionStatus: user.subscriptionStatus,
      })
      .from(user)
      .where(eq(user.id, userId));

    if (!userRecord) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user already has an active or pending subscription
    if (
      userRecord.subscriptionStatus === 'active' ||
      userRecord.subscriptionStatus === 'pending_activation'
    ) {
      return NextResponse.json(
        { error: 'User already has an active or pending subscription' },
        { status: 409 }
      );
    }

    // Generate a unique order ID for this subscription initiation
    const orderId = generateOrderId('SUB_INIT_');

    // Prepare Midtrans transaction parameters
    const transaction = await createSnapTransaction({
      orderId,
      amount: SUBSCRIPTION_PLAN.price,
      customer: {
        id: userId,
        email: session.user.email ?? 'unknown@example.com',
      },
      items: [
        {
          id: SUBSCRIPTION_PLAN.id,
          name: SUBSCRIPTION_PLAN.name,
          price: SUBSCRIPTION_PLAN.price,
          quantity: 1,
        },
      ],
      // Add credit card tokenization option
      creditCardOptions: {
        saveCard: true,
      },
    });

    // Update user record to pending_activation status
    await db
      .update(user)
      .set({
        subscriptionStatus: 'pending_activation',
        planId: SUBSCRIPTION_PLAN.id,
      })
      .where(eq(user.id, userId));

    // Create payment record
    await createPayment({
      orderId,
      amount: SUBSCRIPTION_PLAN.price.toString(),
      userId,
      snapToken: transaction.token,
    });

    // Return the token and order ID to the frontend
    return NextResponse.json({
      token: transaction.token,
      orderId,
      redirectUrl: transaction.redirectUrl,
    });
  } catch (error) {
    console.error('Failed to initiate subscription:', error);
    return NextResponse.json(
      { error: 'Failed to initiate subscription' },
      { status: 500 }
    );
  }
}
