'use client';

import { CreditCard } from 'lucide-react';
import { useState } from 'react';

import { PaymentForm } from '@/components/payment-form';
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

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
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
          />
        </div>
      </DialogContent>
    </Dialog>
  );
} 