import { NextResponse } from 'next/server';
import { z } from 'zod';

import { auth } from '@/app/(auth)/auth';
import { createPayment, updatePaymentStatus } from '@/lib/db/queries';
import { createSnapTransaction, generateOrderId, verifyWebhookSignature } from '@/lib/midtrans';
import { db } from '@/lib/db/db';
import { user } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// Helper function to handle successful subscription payments
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
        ...(isInitial && savedTokenId ? { midtransPaymentTokenId: savedTokenId } : {}),
      })
      .where(eq(user.id, userId));

    console.log(`Successfully processed ${isInitial ? 'initial' : 'renewal'} subscription payment for user ${userId}`);
  } catch (error) {
    console.error(`Failed to process successful subscription payment:`, error);
    throw error;
  }
}

// Helper function to handle failed subscription payments
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
    throw error;
  }
}

// Validate payment request body
const paymentSchema = z.object({
  amount: z.number().min(1),
  items: z.array(z.object({
    id: z.string(),
    name: z.string(),
    price: z.number(),
    quantity: z.number().min(1),
  })),
});

export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      console.log('Payment API: Unauthorized request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch (e) {
      console.error('Payment API: Invalid JSON in request body', e);
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }

    // Validate with Zod schema
    let validatedData;
    try {
      validatedData = paymentSchema.parse(body);
    } catch (e) {
      if (e instanceof z.ZodError) {
        console.error('Payment API: Invalid request data', e.errors);
        return NextResponse.json(
          { error: 'Invalid request data', details: e.errors },
          { status: 400 }
        );
      }
      throw e;
    }

    // Generate unique order ID
    const orderId = generateOrderId();
    console.log(`Payment API: Generated order ID: ${orderId}`);

    // Create Midtrans transaction
    console.log('Payment API: Creating Midtrans transaction...');
    const transaction = await createSnapTransaction({
      orderId,
      amount: validatedData.amount,
      customer: {
        id: session.user?.id || 'anonymous',
        email: session.user?.email ?? 'anonymous@user.com',
      },
      items: validatedData.items,
    });

    if (!transaction.token) {
      console.error('Payment API: No token received from Midtrans');
      return NextResponse.json(
        { error: 'Failed to generate payment token' },
        { status: 500 }
      );
    }

    // Save payment record to database
    console.log('Payment API: Saving payment record to database...');
    try {
      await createPayment({
        orderId,
        amount: validatedData.amount.toString(),
        userId: session.user?.id || 'anonymous',
        snapToken: transaction.token,
      });
    } catch (dbError) {
      console.error('Payment API: Failed to save payment record', dbError);
      // Continue even if DB save fails - we have the token already
    }

    console.log('Payment API: Successfully created payment');
    return NextResponse.json({
      token: transaction.token,
      orderId,
    });
  } catch (error) {
    console.error('Payment API: Unhandled error:', error);
    return NextResponse.json(
      { error: 'Failed to process payment' },
      { status: 500 }
    );
  }
}

// Handle Midtrans webhook notifications
// (This PUT function is now removed as the logic has been moved to POST in app/api/payment/notification/route.ts)
/*
export async function PUT(request: Request) {
  // ... original PUT logic ...
}
*/