import { NextResponse } from 'next/server';

import { auth } from '@/app/(auth)/auth';
import { createPayment } from '@/lib/db/queries';
import { createSnapTransaction, generateOrderId } from '@/lib/midtrans';
import { db } from '@/lib/db/db';
import { user } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// Monthly subscription plan details
const SUBSCRIPTION_PLAN = {
  id: 'monthly_99k',
  name: 'Monthly Subscription',
  price: 1000,
  currency: 'IDR',
};

export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      console.log('Subscription API: Unauthorized request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Explicitly check if user ID exists in the session
    if (!session.user.id) {
      console.error('Subscription API: User ID missing in session');
      return NextResponse.json({ error: 'User ID missing in session' }, { status: 400 });
    }

    // Get user's current subscription status
    const [userData] = await db
      .select({
        id: user.id,
        email: user.email,
        subscriptionStatus: user.subscriptionStatus,
      })
      .from(user)
      .where(eq(user.id, session.user.id));

    if (!userData) {
      console.error('Subscription API: User not found');
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user already has an active or pending subscription
    if (userData.subscriptionStatus === 'active' || userData.subscriptionStatus === 'pending_activation') {
      console.log(`Subscription API: User ${userData.id} already has an active or pending subscription`);
      return NextResponse.json(
        { error: 'User already has an active or pending subscription' },
        { status: 409 }
      );
    }

    // Generate unique order ID with subscription prefix
    const orderId = generateOrderId('SUB_INIT_');
    console.log(`Subscription API: Generated order ID: ${orderId}`);

    // Create Midtrans transaction
    console.log('Subscription API: Creating Midtrans transaction...');
    const transaction = await createSnapTransaction({
      orderId,
      amount: SUBSCRIPTION_PLAN.price,
      customer: {
        id: userData.id,
        email: userData.email,
      },
      items: [
        {
          id: SUBSCRIPTION_PLAN.id,
          name: SUBSCRIPTION_PLAN.name,
          price: SUBSCRIPTION_PLAN.price,
          quantity: 1,
        },
      ],
      creditCardOptions: {
        saveCard: true, // Save card for future recurring payments
        secure: true,
      },
    });

    if (!transaction.token) {
      console.error('Subscription API: No token received from Midtrans');
      return NextResponse.json(
        { error: 'Failed to generate payment token' },
        { status: 500 }
      );
    }

    // Update user's subscription status to pending_activation
    await db
      .update(user)
      .set({
        subscriptionStatus: 'pending_activation',
        planId: SUBSCRIPTION_PLAN.id,
      })
      .where(eq(user.id, userData.id));

    // Save payment record to database
    console.log('Subscription API: Saving payment record to database...');
    try {
      await createPayment({
        orderId,
        amount: SUBSCRIPTION_PLAN.price.toString(),
        userId: userData.id,
        snapToken: transaction.token,
      });
    } catch (dbError) {
      console.error('Subscription API: Failed to save payment record', dbError);
      // Continue even if DB save fails - we have the token already
    }

    console.log('Subscription API: Successfully created subscription payment');
    return NextResponse.json({
      token: transaction.token,
      orderId,
      plan: SUBSCRIPTION_PLAN,
    });
  } catch (error) {
    console.error('Subscription API: Unhandled error:', error);
    return NextResponse.json(
      { error: 'Failed to process subscription request' },
      { status: 500 }
    );
  }
}
