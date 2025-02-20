import { NextResponse } from 'next/server';
import { z } from 'zod';

import { auth } from '@/app/(auth)/auth';
import { createPayment, updatePaymentStatus } from '@/lib/db/queries';
import { createSnapTransaction, generateOrderId } from '@/lib/midtrans';

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
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = paymentSchema.parse(body);
    
    // Generate unique order ID
    const orderId = generateOrderId();

    // Create Midtrans transaction
    const transaction = await createSnapTransaction({
      orderId,
      amount: validatedData.amount,
      customer: {
        id: session.user.id,
        email: session.user.email ?? 'anonymous@user.com',
      },
      items: validatedData.items,
    });

    // Save payment record to database
    await createPayment({
      orderId,
      amount: validatedData.amount.toString(),
      userId: session.user.id,
      snapToken: transaction.token,
    });

    return NextResponse.json({
      token: transaction.token,
      orderId,
    });
  } catch (error) {
    console.error('Payment creation failed:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to process payment' },
      { status: 500 }
    );
  }
}

// Handle Midtrans webhook notifications
export async function PUT(request: Request) {
  try {
    const notification = await request.json();
    
    const orderId = notification.order_id;
    const transactionStatus = notification.transaction_status;
    const paymentType = notification.payment_type;
    const transactionId = notification.transaction_id;

    let status: 'pending' | 'success' | 'failed' | 'expired';
    
    switch (transactionStatus) {
      case 'capture':
      case 'settlement':
        status = 'success';
        break;
      case 'deny':
      case 'cancel':
      case 'failure':
        status = 'failed';
        break;
      case 'expire':
        status = 'expired';
        break;
      default:
        status = 'pending';
    }

    await updatePaymentStatus({
      orderId,
      status,
      paymentType,
      transactionId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook processing failed:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
} 