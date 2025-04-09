import { SubscriptionStatus } from '@/components/subscription-status';
import { auth } from '@/app/(auth)/auth';
import { redirect } from 'next/navigation';

export default async function SubscriptionPage() {
  const session = await auth();

  // Redirect to login if not authenticated
  if (!session?.user) {
    redirect('/login');
  }

  return (
    <div className="container max-w-4xl py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Subscription</h1>
        <p className="text-muted-foreground">
          Manage your subscription and access premium features
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <h2 className="text-xl font-semibold mb-4">Free Plan</h2>
          <div className="p-6 border rounded-lg bg-card">
            <div className="mb-4">
              <div className="text-3xl font-bold">Rp 0</div>
              <div className="text-muted-foreground">Forever free</div>
            </div>
            <ul className="space-y-2 mb-6">
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Basic chat functionality</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Limited message history</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Standard response time</span>
              </li>
            </ul>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Pro Plan</h2>
          <div className="p-6 border rounded-lg bg-card border-primary">
            <div className="mb-4">
              <div className="text-3xl font-bold">Rp 1.000</div>
              <div className="text-muted-foreground">per month</div>
            </div>
            <ul className="space-y-2 mb-6">
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Everything in Free plan</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Unlimited message history</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Priority response time</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Advanced features access</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Premium support</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <SubscriptionStatus />
      </div>
    </div>
  );
}
