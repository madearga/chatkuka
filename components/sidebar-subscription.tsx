'use client';

import { CreditCard } from 'lucide-react';
import { useState } from 'react';

import { SubscriptionStatus } from '@/components/subscription-status';
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

export function SidebarSubscription() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton className="bg-primary text-primary-foreground hover:bg-primary/90">
              <CreditCard className="size-4" />
              <span>Subscription</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Subscription</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <SubscriptionStatus />
        </div>
      </DialogContent>
    </Dialog>
  );
}
