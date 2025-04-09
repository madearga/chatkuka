import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { db } from '@/lib/db';
import { user } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// GET handler to retrieve subscription status
export async function GET() {
  try {
    // Authentication check
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Fetch user's subscription details
    const [userRecord] = await db
      .select({
        subscriptionStatus: user.subscriptionStatus,
        planId: user.planId,
        currentPeriodEnd: user.currentPeriodEnd,
      })
      .from(user)
      .where(eq(user.id, userId));

    if (!userRecord) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Format the date for display if it exists
    const formattedPeriodEnd = userRecord.currentPeriodEnd
      ? new Date(userRecord.currentPeriodEnd).toISOString()
      : null;

    // Return subscription details
    return NextResponse.json({
      status: userRecord.subscriptionStatus || 'inactive',
      planId: userRecord.planId || null,
      currentPeriodEnd: formattedPeriodEnd,
      isActive: userRecord.subscriptionStatus === 'active',
    });
  } catch (error) {
    console.error('Failed to fetch subscription status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription status' },
      { status: 500 }
    );
  }
}

// POST handler to cancel subscription
export async function POST() {
  try {
    // Authentication check
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Fetch user's current subscription status
    const [userRecord] = await db
      .select({
        subscriptionStatus: user.subscriptionStatus,
      })
      .from(user)
      .where(eq(user.id, userId));

    if (!userRecord) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if already cancelled or inactive
    if (
      userRecord.subscriptionStatus === 'cancelled' ||
      userRecord.subscriptionStatus === 'inactive'
    ) {
      return NextResponse.json({
        message: 'Subscription is already cancelled or inactive',
        status: 'cancelled',
      });
    }

    // Update subscription status to cancelled
    await db
      .update(user)
      .set({
        subscriptionStatus: 'cancelled',
      })
      .where(eq(user.id, userId));

    // Log the cancellation
    console.log(`User ${userId} cancelled their subscription`);

    // Return success response
    return NextResponse.json({
      message: 'Subscription cancelled successfully',
      status: 'cancelled',
    });
  } catch (error) {
    console.error('Failed to cancel subscription:', error);
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}
