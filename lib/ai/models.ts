import { openai, createOpenAI } from '@ai-sdk/openai';
import { fireworks } from '@ai-sdk/fireworks';
import { google } from '@ai-sdk/google';
import { groq } from '@ai-sdk/groq';
import { fal } from '@ai-sdk/fal';
import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from 'ai';
import { ModelTier, MODEL_TIER_MAP } from './model-access';

const requestyOpenAI = createOpenAI({
  baseURL: process.env.REQUESTY_BASE_URL,
  apiKey: process.env.REQUESTY_API_KEY,
  compatibility: 'strict',
});

export const DEFAULT_CHAT_MODEL: string = 'chat-model-small';

export const myProvider = customProvider({
  languageModels: {
    'chat-model-small': google('gemini-2.0-flash'),
    'chat-model-large': google('gemini-2.5-pro-exp-03-25'),
    'chat-model-image-gen': google('gemini-2.0-flash'),
    'chat-model-reasoning': wrapLanguageModel({
      model: groq('deepseek-r1-distill-llama-70b'),
      middleware: extractReasoningMiddleware({ tagName: 'think' }),
    }),
    'title-model': google('gemini-2.5-pro-exp-03-25'),
    'artifact-model': google('gemini-2.5-pro-exp-03-25'),

    'openai-gpt4o-mini': requestyOpenAI('openai/gpt-4o-mini'),
    'chatgpt-4o': requestyOpenAI('openai/gpt-4o'),
  },
  imageModels: {
    'small-model': fal.image('fal-ai/flux/schnell'),
    'large-model': fal.image('fal-ai/flux/schnell'),
    // Add more image models if needed
  },
});

interface ChatModel {
  id: string;
  name: string;
  description: string;
  tier?: ModelTier;
}

export const chatModels: Array<ChatModel> = [
  {
    id: 'chat-model-small',
    name: 'Small model (Free)',
    description: 'Small model for fast, lightweight tasks',
    tier: MODEL_TIER_MAP['chat-model-small'],
  },
  {
    id: 'chat-model-large',
    name: 'Large model (Pro)',
    description: 'Large model for complex, multi-step tasks',
    tier: MODEL_TIER_MAP['chat-model-large'],
  },
  {
    id: 'chat-model-reasoning',
    name: 'Reasoning model (Pro)',
    description: 'Uses advanced reasoning',
    tier: MODEL_TIER_MAP['chat-model-reasoning'],
  },
  {
    id: 'chat-model-image-gen',
    name: 'Image generation (Free)',
    description: 'Specialized model for generating images inline',
    tier: MODEL_TIER_MAP['chat-model-image-gen'],
  },
  {
    id: 'openai-gpt4o-mini',
    name: 'GPT-4o Mini (Free)',
    description: 'Fast and capable model, suitable for various tasks.',
    tier: MODEL_TIER_MAP['openai-gpt4o-mini'],
  },
  {
    id: 'chatgpt-4o',
    name: 'ChatGPT-4o (Pro)',
    description: 'Latest OpenAI GPT-4o model with advanced capabilities.',
    tier: MODEL_TIER_MAP['chatgpt-4o'],
  },
];
