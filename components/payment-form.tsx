'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';

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

interface PaymentFormProps {
  amount: number;
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  onSuccess?: () => void;
  onPending?: () => void;
  onError?: (error: any) => void;
}

export function PaymentForm({
  amount,
  items,
  onSuccess,
  onPending,
  onError,
}: PaymentFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [snapScriptLoaded, setSnapScriptLoaded] = useState(false);

  useEffect(() => {
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

    return () => {
      const container = document.getElementById('snap-container');
      if (container) {
        container.innerHTML = '';
      }
    };
  }, []);

  const handlePayment = async () => {
    try {
      setIsLoading(true);

      // Check if Midtrans script is loaded
      if (!window.snap) {
        toast.error('Payment gateway is not ready. Please try again.');
        setIsLoading(false);
        return;
      }

      console.log('Initiating payment request...');
      const response = await fetch('/api/payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          items,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Payment request failed:', errorData);
        throw new Error(errorData.error || 'Payment request failed');
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

      console.log('Opening Midtrans payment popup...');
      window.snap.embed(data.token, {
        embedId: 'snap-container',
        onSuccess: (result) => {
          console.log('Payment success:', result);
          toast.success('Payment successful!');
          onSuccess?.();
          router.refresh();
        },
        onPending: (result) => {
          console.log('Payment pending:', result);
          toast.info('Payment is pending');
          onPending?.();
        },
        onError: (error) => {
          console.error('Payment error:', error);
          toast.error('Payment failed');
          onError?.(error);
        },
        onClose: () => {
          console.log('Payment popup closed');
          setIsLoading(false);
        },
      });
    } catch (error) {
      console.error('Error in handlePayment:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to initiate payment');
      onError?.(error);
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      {isLoading && (
        <div
          id="snap-container"
          className="w-full min-h-[400px] mb-4 rounded-lg border border-border"
        ></div>
      )}

      <Button
        onClick={handlePayment}
        disabled={!snapScriptLoaded || isLoading}
        className="w-full"
      >
        {isLoading ? 'Processing...' : 'Pay Now'}
      </Button>

      {!snapScriptLoaded && (
        <p className="text-sm text-muted-foreground mt-2 text-center">
          Loading payment gateway...
        </p>
      )}
    </div>
  );
}