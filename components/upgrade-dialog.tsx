'use client';

// Remove unused import
// import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';

interface UpgradeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  modelName: string;
}

export function UpgradeDialog({ isOpen, onClose, modelName }: UpgradeDialogProps) {
  const router = useRouter();

  const handleUpgrade = () => {
    router.push('/subscription');
    onClose();
  };

  // If not open, don't render anything
  if (!isOpen) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-center text-xl pt-4">Upgrade to Pro</DialogTitle>
          <DialogDescription className="text-center pt-2">
            <span className="font-medium">{modelName}</span> is available exclusively for Pro subscribers.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-4">
          <div className="flex items-center">
            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium">Access to advanced models</p>
              <p className="text-sm text-muted-foreground">
                Use Gemini 2.5 Pro and other powerful models
              </p>
            </div>
          </div>
          <div className="flex items-center">
            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium">Advanced reasoning capabilities</p>
              <p className="text-sm text-muted-foreground">
                Solve complex problems with step-by-step reasoning
              </p>
            </div>
          </div>
        </div>
        <DialogFooter className="flex flex-col sm:flex-row sm:justify-between gap-2">
          <Button variant="outline" onClick={onClose} className="sm:w-auto w-full">
            Not now
          </Button>
          <Button onClick={handleUpgrade} className="sm:w-auto w-full">
            Upgrade to Pro
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
