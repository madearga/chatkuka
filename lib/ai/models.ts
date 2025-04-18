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
    // Google Models
    'chat-model-small': google('gemini-2.0-flash'),
    'chat-model-large': google('gemini-2.5-pro-exp-03-25'),
    'title-model': google('gemini-2.5-pro-exp-03-25'),
    'artifact-model': google('gemini-2.5-pro-exp-03-25'),

    // OpenAI Models
    'openai-gpt4o-mini': requestyOpenAI('openai/gpt-4o-mini'),
    'chatgpt-4o': requestyOpenAI('openai/gpt-4o'),
    'chatgpt-4.1-nano': requestyOpenAI('openai/gpt-4.1-nano'),
    'chatgpt-4.1-mini': requestyOpenAI('openai/gpt-4.1-mini'),
    'chatgpt-4.1': requestyOpenAI('openai/gpt-4.1-2025-04-14'),
    'openai-o3': requestyOpenAI('openai/o3-2025-04-16'),
    'openai-o4-mini': requestyOpenAI('openai/o4-mini'),

    // DeepSeek Models
    'chat-model-reasoning': wrapLanguageModel({
      model: groq('deepseek-r1-distill-llama-70b'),
      middleware: extractReasoningMiddleware({ tagName: 'think' }),
    }),
    'deepseek-v3': requestyOpenAI('together/deepseek-ai/DeepSeek-V3'),

    // Gemini Models
    'gemini-2.0-flash-thinking': requestyOpenAI(
      'google/gemini-2.0-flash-thinking-exp-01-21',
    ),
    'gemini-2.5-flash-preview': google('gemini-2.5-flash-preview-04-17'),
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
  provider: 'google' | 'openai' | 'deepseek' | 'groq' | 'fireworks' | 'anthropic';
}

export const chatModels: Array<ChatModel> = [
  // Google Models
  {
    id: 'chat-model-small',
    name: 'Gemini Flash 2.0',
    description: 'Google Gemini Flash 2.0 model for fast, lightweight tasks',
    tier: MODEL_TIER_MAP['chat-model-small'],
    provider: 'google',
  },
  {
    id: 'gemini-2.5-flash-preview',
    name: 'Gemini 2.5 Flash Preview',
    description: 'Google Gemini 2.5 Flash Preview model with improved performance',
    tier: MODEL_TIER_MAP['gemini-2.5-flash-preview'],
    provider: 'google',
  },
  // OpenAI
  {
    id: 'openai-gpt4o-mini',
    name: 'GPT-4o Mini',
    description: 'Fast and capable model, suitable for various tasks.',
    tier: MODEL_TIER_MAP['openai-gpt4o-mini'],
    provider: 'openai',
  },
  {
    id: 'chatgpt-4.1-nano',
    name: 'ChatGPT 4.1 Nano',
    description: 'Lightweight version of GPT-4.1 for fast responses.',
    tier: MODEL_TIER_MAP['chatgpt-4.1-nano'],
    provider: 'openai',
  },
  {
    id: 'chatgpt-4.1-mini',
    name: 'ChatGPT 4.1 Mini',
    description: 'Smaller version of GPT-4.1 with good performance.',
    tier: MODEL_TIER_MAP['chatgpt-4.1-mini'],
    provider: 'openai',
  },
  {
    id: 'openai-o3',
    name: 'OpenAI o3',
    description: 'OpenAI o3 model with advanced capabilities and efficiency.',
    tier: MODEL_TIER_MAP['openai-o3'],
    provider: 'openai',
  },
  {
    id: 'openai-o4-mini',
    name: 'OpenAI o4-mini',
    description: 'OpenAI o4-mini model with advanced capabilities.',
    tier: MODEL_TIER_MAP['openai-o4-mini'],
    provider: 'openai',
  },

  // Google Models
  {
    id: 'chat-model-large',
    name: 'Gemini Pro 2.5',
    description: 'Google Gemini Pro 2.5 model for complex, multi-step tasks',
    tier: MODEL_TIER_MAP['chat-model-large'],
    provider: 'google',
  },
  {
    id: 'gemini-2.0-flash-thinking',
    name: 'Gemini 2.0 Flash Thinking',
    description:
      'Google Gemini model optimized for fast thinking and reasoning.',
    tier: MODEL_TIER_MAP['gemini-2.0-flash-thinking'],
    provider: 'google',
  },
  // OpenAI
  {
    id: 'chatgpt-4o',
    name: 'ChatGPT-4o',
    description: 'Latest OpenAI GPT-4o model with advanced capabilities.',
    tier: MODEL_TIER_MAP['chatgpt-4o'],
    provider: 'openai',
  },
  {
    id: 'chatgpt-4.1',
    name: 'ChatGPT 4.1',
    description: 'Latest OpenAI GPT-4.1 model with advanced capabilities.',
    tier: MODEL_TIER_MAP['chatgpt-4.1'],
    provider: 'openai',
  },
  // DeepSeek
  {
    id: 'chat-model-reasoning',
    name: 'DeepSeek-R1-Distill-Llama-70B',
    description: 'DeepSeek Llama model with advanced reasoning capabilities',
    tier: MODEL_TIER_MAP['chat-model-reasoning'],
    provider: 'groq',
  },
  {
    id: 'deepseek-v3',
    name: 'DeepSeek-V3',
    description: 'Advanced DeepSeek model with strong reasoning capabilities.',
    tier: MODEL_TIER_MAP['deepseek-v3'],
    provider: 'deepseek',
  },
];
