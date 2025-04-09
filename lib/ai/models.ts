import { openai } from '@ai-sdk/openai';
import { fireworks } from '@ai-sdk/fireworks';
import { google } from '@ai-sdk/google';
import { groq } from '@ai-sdk/groq';
import { fal } from '@ai-sdk/fal';
import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from 'ai';
import { ModelTier } from './model-access';

export const DEFAULT_CHAT_MODEL: string = 'chat-model-small';

export const myProvider = customProvider({
  languageModels: {
    'chat-model-small': google('gemini-2.0-flash'),
    'chat-model-large': google('gemini-2.5-pro-exp-03-25'),
    'chat-model-image-gen': google('gemini-2.0-flash'), // Added model for inline image generation
    'chat-model-reasoning': wrapLanguageModel({
      model: groq('deepseek-r1-distill-llama-70b'),
      middleware: extractReasoningMiddleware({ tagName: 'think' }),
    }),
    'title-model': google('gemini-2.5-pro-exp-03-25'),
    'artifact-model': google('gemini-2.5-pro-exp-03-25'),
  },
  imageModels: {
    'small-model': fal.image('fal-ai/flux/schnell'),
    'large-model': fal.image('fal-ai/flux/schnell'),
  },
});



interface ChatModel {
  id: string;
  name: string;
  description: string;
  tier?: ModelTier; // Tier required to access this model
}

export const chatModels: Array<ChatModel> = [
  {
    id: 'chat-model-small',
    name: 'Small model (Free)',
    description: 'Small model for fast, lightweight tasks',
    tier: ModelTier.FREE,
  },
  {
    id: 'chat-model-large',
    name: 'Large model (Pro)',
    description: 'Large model for complex, multi-step tasks',
    tier: ModelTier.PAID,
  },
  {
    id: 'chat-model-reasoning',
    name: 'Reasoning model (Pro)',
    description: 'Uses advanced reasoning',
    tier: ModelTier.PAID,
  },
  {
    id: 'chat-model-image-gen',
    name: 'Image generation (Free)',
    description: 'Specialized model for generating images inline',
    tier: ModelTier.FREE,
  },
];
