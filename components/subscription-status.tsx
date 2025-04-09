'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface SubscriptionData {
  status: string;
  planId: string | null;
  currentPeriodEnd: string | null;
  isActive: boolean;
}

export function SubscriptionStatus() {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitiating, setIsInitiating] = useState(false);
  const [snapScriptLoaded, setSnapScriptLoaded] = useState(false);

  useEffect(() => {
    // Load Midtrans Snap script
    const loadSnapScript = () => {
      try {
        const script = document.createElement('script');
        script.src = process.env.NEXT_PUBLIC_MIDTRANS_SNAP_URL ?? 'https://app.sandbox.midtrans.com/snap/snap.js';
        script.setAttribute('data-client-key', process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY ?? '');
        script.onload = () => {
          console.log('Midtrans script loaded successfully');
          setSnapScriptLoaded(true);
        };
        script.onerror = (error) => {
          console.error('Failed to load Midtrans script:', error);
          toast.error('Failed to load payment gateway. Please try again later.');
        };
        document.body.appendChild(script);
      } catch (error) {
        console.error('Error in loadSnapScript:', error);
        toast.error('Failed to initialize payment gateway');
      }
    };

    if (typeof window !== 'undefined') {
      if (!window.snap) {
        loadSnapScript();
      } else {
        console.log('Midtrans snap already loaded');
        setSnapScriptLoaded(true);
      }
    }

    // Fetch subscription status
    async function fetchSubscription() {
      try {
        const response = await fetch('/api/subscriptions/manage');
        if (response.ok) {
          const data = await response.json();
          setSubscription(data);
        } else {
          console.error('Failed to fetch subscription status', await response.text());
          toast.error('Failed to load subscription status');
        }
      } catch (error) {
        console.error('Failed to fetch subscription status', error);
        toast.error('Failed to load subscription status');
      } finally {
        setIsLoading(false);
      }
    }

    fetchSubscription();

    return () => {
      const container = document.getElementById('snap-container');
      if (container) {
        container.innerHTML = '';
      }
    };
  }, []);

  const handleSubscribe = async () => {
    try {
      setIsInitiating(true);

      // Check if Midtrans script is loaded
      if (!window.snap) {
        toast.error('Payment gateway is not ready. Please try again.');
        setIsInitiating(false);
        return;
      }

      // Call subscription initiation API
      const response = await fetch('/api/subscriptions/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Subscription initiation failed:', errorData);
        throw new Error(errorData.error || 'Subscription initiation failed');
      }

      const data = await response.json();
      console.log('Payment token received:', data.token ? 'Yes' : 'No');

      if (!data.token) {
        throw new Error('No payment token received from server');
      }

      const container = document.getElementById('snap-container');
      if (container) {
        container.innerHTML = '';
      }

      // Open Midtrans payment popup
      console.log('Opening Midtrans payment popup...');
      window.snap.embed(data.token, {
        embedId: 'snap-container',
        onSuccess: (result) => {
          console.log('Payment success:', result);
          toast.success('Payment successful! Your subscription will be activated shortly.');
          setTimeout(() => {
            window.location.reload();
          }, 3000);
        },
        onPending: (result) => {
          console.log('Payment pending:', result);
          toast.info('Payment is pending. Your subscription will be activated once payment is confirmed.');
          setIsInitiating(false);
        },
        onError: (error) => {
          console.error('Payment error:', error);
          toast.error('Payment failed');
          setIsInitiating(false);
        },
        onClose: () => {
          console.log('Payment popup closed');
          setIsInitiating(false);
        },
      });
    } catch (error) {
      console.error('Error in handleSubscribe:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to initiate subscription');
      setIsInitiating(false);
    }
  };

  const handleCancelSubscription = async () => {
    try {
      const response = await fetch('/api/subscriptions/manage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'cancel' }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to cancel subscription');
      }

      const data = await response.json();
      toast.success('Subscription cancelled successfully');
      
      // Update local state
      if (subscription) {
        setSubscription({
          ...subscription,
          status: 'cancelled',
          isActive: false,
        });
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to cancel subscription');
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 border rounded-lg animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
        <div className="h-10 bg-gray-200 rounded w-1/3"></div>
      </div>
    );
  }

  return (
    <div className="p-4 border rounded-lg">
      <h2 className="text-xl font-bold mb-4">Subscription Status</h2>
      
      {subscription?.isActive ? (
        <div>
          <div className="bg-green-100 text-green-800 p-2 rounded mb-2">
            You have an active subscription
          </div>
          <p className="mb-1">Status: {subscription.status}</p>
          {subscription.currentPeriodEnd && (
            <p className="mb-4">
              Renews on: {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
            </p>
          )}
          <Button 
            onClick={handleCancelSubscription}
            variant="outline"
            className="mt-2"
          >
            Cancel Subscription
          </Button>
        </div>
      ) : (
        <div>
          <div className="bg-yellow-100 text-yellow-800 p-2 rounded mb-2">
            You are on the free plan
          </div>
          <p className="mb-4">Upgrade to Pro for full access to all features</p>
          
          {isInitiating && (
            <div
              id="snap-container"
              className="w-full min-h-[400px] mb-4 rounded-lg border border-border"
            ></div>
          )}
          
          <Button 
            onClick={handleSubscribe}
            disabled={!snapScriptLoaded || isInitiating}
            className="mt-2"
          >
            {isInitiating ? 'Processing...' : 'Upgrade to Pro'}
          </Button>
          
          {!snapScriptLoaded && (
            <p className="text-sm text-muted-foreground mt-2">
              Loading payment gateway...
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// Add TypeScript declaration for window.snap
declare global {
  interface Window {
    snap?: {
      embed: (token: string, options: {
        embedId: string;
        onSuccess: (result: any) => void;
        onPending: (result: any) => void;
        onError: (error: any) => void;
        onClose: () => void;
      }) => void;
    };
  }
}
