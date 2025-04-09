'use client';

import { CreditCard } from 'lucide-react';
import { useState } from 'react';

import { PaymentForm } from '@/components/payment-form';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

export function SidebarPayment() {
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset error when dialog opens/closes
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      setError(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton className="bg-primary text-primary-foreground hover:bg-primary/90">
              <CreditCard className="size-4" />
              <span>Try Payment</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Test Payment with Midtrans</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          {error ? (
            <div className="p-4 mb-4 border border-red-200 bg-red-50 rounded-md text-red-800">
              <p className="font-medium">Error loading payment form</p>
              <p className="text-sm">{error}</p>
              <Button
                variant="outline"
                className="mt-2"
                onClick={() => setError(null)}
              >
                Try Again
              </Button>
            </div>
          ) : (
            <PaymentForm
              amount={10000}
              items={[
                {
                  id: 'test-item',
                  name: 'Test Item',
                  price: 10000,
                  quantity: 1,
                },
              ]}
              onSuccess={() => {
                setIsOpen(false);
              }}
              onError={(err) => {
                console.error('Payment error in sidebar:', err);
                setError(err instanceof Error ? err.message : 'Unknown payment error');
              }}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}