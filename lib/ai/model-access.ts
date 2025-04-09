// Model access control based on user subscription status
import { User } from '@/lib/db/schema';

// Define model tiers
export enum ModelTier {
  FREE = 'free',
  PAID = 'paid',
}

// Map models to their required tier
export const MODEL_TIER_MAP: Record<string, ModelTier> = {
  'chat-model-small': ModelTier.FREE, // Gemini 2.0 Flash - available to all users
  'chat-model-large': ModelTier.PAID, // Gemini 2.5 Pro - paid users only
  'chat-model-reasoning': ModelTier.PAID, // Reasoning model - paid users only
  'chat-model-image-gen': ModelTier.FREE, // Image generation model - available to all users
};

// Check if a user has access to a specific model
export function hasModelAccess(user: User | null | undefined, modelId: string): boolean {
  // If model doesn't exist in the map, default to requiring paid tier
  const requiredTier = MODEL_TIER_MAP[modelId] || ModelTier.PAID;
  
  // If free tier model, allow access to everyone
  if (requiredTier === ModelTier.FREE) {
    return true;
  }
  
  // For paid tier models, check subscription status
  return user?.subscriptionStatus === 'active';
}

// Get available models for a user based on their subscription status
export function getAvailableModelsForUser(user: User | null | undefined): string[] {
  const isPaidUser = user?.subscriptionStatus === 'active';
  
  if (isPaidUser) {
    // Paid users have access to all models
    return Object.keys(MODEL_TIER_MAP);
  } else {
    // Free users only have access to free tier models
    return Object.entries(MODEL_TIER_MAP)
      .filter(([_, tier]) => tier === ModelTier.FREE)
      .map(([modelId]) => modelId);
  }
}

// Get the default model for a user based on their subscription status
export function getDefaultModelForUser(user: User | null | undefined): string {
  const isPaidUser = user?.subscriptionStatus === 'active';
  
  // Default to small model for free users, large model for paid users
  return isPaidUser ? 'chat-model-large' : 'chat-model-small';
}
