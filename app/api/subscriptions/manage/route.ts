import { NextResponse } from 'next/server';

import { auth } from '@/app/(auth)/auth';
import { db } from '@/lib/db/db';
import { user } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      console.log('Subscription Manage API: Unauthorized GET request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Explicitly check if user ID exists in the session
    if (!session.user.id) {
      console.error('Subscription Manage API: User ID missing in session for GET');
      return NextResponse.json({ error: 'User ID missing in session' }, { status: 400 });
    }

    // Get user's subscription details
    const [userData] = await db
      .select({
        id: user.id,
        email: user.email,
        subscriptionStatus: user.subscriptionStatus,
        planId: user.planId,
        currentPeriodEnd: user.currentPeriodEnd,
      })
      .from(user)
      .where(eq(user.id, session.user.id));

    if (!userData) {
      console.error('Subscription Manage API: User not found');
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Return subscription details
    return NextResponse.json({
      status: userData.subscriptionStatus || 'inactive',
      planId: userData.planId,
      currentPeriodEnd: userData.currentPeriodEnd,
      isActive: userData.subscriptionStatus === 'active',
    });
  } catch (error) {
    console.error('Subscription Manage API: Unhandled error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription details' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      console.log('Subscription Manage API: Unauthorized POST request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Explicitly check if user ID exists in the session
    if (!session.user.id) {
      console.error('Subscription Manage API: User ID missing in session for POST');
      return NextResponse.json({ error: 'User ID missing in session' }, { status: 400 });
    }

    // Get action from request body
    const { action } = await request.json();

    if (action !== 'cancel') {
      return NextResponse.json(
        { error: 'Invalid action. Supported actions: cancel' },
        { status: 400 }
      );
    }

    // Get user's current subscription status
    const [userData] = await db
      .select({
        id: user.id,
        subscriptionStatus: user.subscriptionStatus,
      })
      .from(user)
      .where(eq(user.id, session.user.id));

    if (!userData) {
      console.error('Subscription Manage API: User not found');
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if subscription is already cancelled or inactive
    if (userData.subscriptionStatus === 'cancelled' || userData.subscriptionStatus === 'inactive') {
      return NextResponse.json({
        message: 'Subscription is already cancelled or inactive',
        status: userData.subscriptionStatus,
      });
    }

    // Update subscription status to cancelled
    await db
      .update(user)
      .set({
        subscriptionStatus: 'cancelled',
      })
      .where(eq(user.id, userData.id));

    return NextResponse.json({
      message: 'Subscription cancelled successfully',
      status: 'cancelled',
    });
  } catch (error) {
    console.error('Subscription Manage API: Unhandled error:', error);
    return NextResponse.json(
      { error: 'Failed to manage subscription' },
      { status: 500 }
    );
  }
}
