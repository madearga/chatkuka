'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export function UpgradePrompt() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-muted/30 rounded-lg border border-muted-foreground/20 my-4">
      <AlertCircle className="size-12 text-primary mb-4" />
      <h3 className="text-xl font-semibold mb-2">Upgrade to Pro</h3>
      <p className="text-center text-muted-foreground mb-4">
        Access advanced models like Gemini 2.5 Pro and reasoning capabilities
        with a Pro subscription.
      </p>
      <Button
        onClick={() => router.push('/subscription')}
        className="bg-primary text-primary-foreground hover:bg-primary/90"
      >
        Upgrade Now
      </Button>
    </div>
  );
}
