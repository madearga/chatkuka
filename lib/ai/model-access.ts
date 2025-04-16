// Model access control based on user subscription status
import { User } from '@/lib/db/schema';

// Define model tiers
export enum ModelTier {
  FREE = 'free',
  PAID = 'paid',
}

// Map models to their required tier
export const MODEL_TIER_MAP: Record<string, ModelTier> = {
  // Google Models
  'chat-model-small': ModelTier.FREE, // Gemini Flash 2.0

  // OpenAI
  'openai-gpt4o-mini': ModelTier.FREE, // OpenAI GPT-4o Mini
  'chatgpt-4.1-nano': ModelTier.FREE, // OpenAI GPT-4.1 Nano
  'chatgpt-4.1-mini': ModelTier.FREE, // OpenAI GPT-4.1 Mini

  // Google Models
  'chat-model-large': ModelTier.PAID, // Gemini Pro 2.5
  'gemini-2.0-flash-thinking': ModelTier.PAID, // Gemini 2.0 Flash Thinking

  // OpenAI
  'chatgpt-4o': ModelTier.PAID, // Latest OpenAI GPT-4o model
  'chatgpt-4.1': ModelTier.PAID, // OpenAI GPT-4.1

  // DeepSeek
  'chat-model-reasoning': ModelTier.PAID, // DeepSeek-R1-Distill-Llama-70B
  'deepseek-v3': ModelTier.PAID, // DeepSeek-V3
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
