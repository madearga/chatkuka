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
      const script = document.createElement('script');
      script.src = process.env.NEXT_PUBLIC_MIDTRANS_SNAP_URL ?? 'https://app.sandbox.midtrans.com/snap/snap.js';
      script.setAttribute('data-client-key', process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY ?? '');
      script.onload = () => setSnapScriptLoaded(true);
      document.body.appendChild(script);
    };

    if (!window.snap) {
      loadSnapScript();
    } else {
      setSnapScriptLoaded(true);
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
        throw new Error('Payment request failed');
      }

      const { token } = await response.json();

      const container = document.getElementById('snap-container');
      if (container) {
        container.innerHTML = '';
      }

      if (window.snap && token) {
        window.snap.embed(token, {
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
            setIsLoading(false);
          },
        });
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to initiate payment');
      onError?.(error);
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div 
        id="snap-container" 
        className="w-full min-h-[400px] mb-4 rounded-lg border border-border"
      ></div>
      
      <Button
        onClick={handlePayment}
        disabled={!snapScriptLoaded || isLoading}
        className="w-full"
      >
        {isLoading ? 'Processing...' : 'Pay Now'}
      </Button>
    </div>
  );
} 