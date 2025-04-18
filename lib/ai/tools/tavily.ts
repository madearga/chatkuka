import { tool, type Tool } from 'ai';
import { z } from 'zod';
import {
  searchTavilyApi,
  extractTavilyApi,
  type TavilySearchResponse,
  type TavilyExtractResponse
} from '@/lib/services/tavily';

type TavilyTools = 'search' | 'searchContext' | 'searchQNA' | 'extract';

export const tavilyTools = (
  config?: {
    excludeTools?: TavilyTools[];
  },
): Partial<Record<TavilyTools, Tool>> => {
  const tools: Partial<Record<TavilyTools, Tool>> = {
    search: tool({
      description:
        'Perform a comprehensive web search and get detailed results including optional images and AI-generated answers',
      parameters: z.object({
        query: z
          .string()
          .describe('The search query to find information about'),
        searchDepth: z
          .enum(['basic', 'advanced'])
          .optional()
          .describe(
            'Depth of search - basic is faster, advanced is more thorough',
          ),
        topic: z
          .enum(['general', 'news'])
          .optional()
          .describe(
            'Category of search - general for broad searches, news for recent events',
          ),
        days: z
          .number()
          .optional()
          .describe(
            'Number of days back to search (only works with news topic, defaults to 3)',
          ),
        timeRange: z
          .enum(['day', 'week', 'month', 'year', 'd', 'w', 'm', 'y'])
          .optional()
          .describe('Time range for results - alternative to days parameter'),
        maxResults: z
          .number()
          .optional()
          .describe('Maximum number of results to return (default: 5)'),
        includeImages: z
          .boolean()
          .optional()
          .describe('Include related images in the response'),
        includeImageDescriptions: z
          .boolean()
          .optional()
          .describe(
            'Add descriptive text for each image (requires includeImages)',
          ),
        includeAnswer: z
          .boolean()
          .optional()
          .describe(
            'Include AI-generated answer to query - basic is quick, advanced is detailed',
          ),
        includeRawContent: z
          .boolean()
          .optional()
          .describe('Include cleaned HTML content of each result'),
        includeDomains: z
          .array(z.string())
          .optional()
          .describe('List of domains to specifically include in results'),
        excludeDomains: z
          .array(z.string())
          .optional()
          .describe('List of domains to exclude from results'),
      }),
      execute: async ({ query, ...options }) => {
        try {
          return await searchTavilyApi(query, {
            ...options,
          });
        } catch (error) {
          return { error: String(error) } as TavilySearchResponse;
        }
      },
    }),
    searchContext: tool({
      description:
        'Search the web and get content and sources within a specified token limit, optimized for context retrieval',
      parameters: z.object({
        query: z
          .string()
          .describe('The search query to find information about'),
        maxTokens: z
          .number()
          .optional()
          .describe('Maximum number of tokens in the response (default: 4000)'),
        searchDepth: z
          .enum(['basic', 'advanced'])
          .optional()
          .describe(
            'Depth of search - basic is faster, advanced is more thorough',
          ),
        topic: z
          .enum(['general', 'news'])
          .optional()
          .describe(
            'Category of search - general for broad searches, news for recent events',
          ),
        days: z
          .number()
          .optional()
          .describe(
            'Number of days back to search (only works with news topic)',
          ),
        maxResults: z
          .number()
          .optional()
          .describe('Maximum number of results to return'),
        includeDomains: z
          .array(z.string())
          .optional()
          .describe('List of domains to specifically include in results'),
        excludeDomains: z
          .array(z.string())
          .optional()
          .describe('List of domains to exclude from results'),
      }),
      execute: async ({ query, ...options }) => {
        try {
          // Note: searchContext is a specialized endpoint in the Tavily API
          // For now, we'll use the regular search API with appropriate options
          const result = await searchTavilyApi(query, {
            ...options,
            includeRawContent: true,
          });

          // Format the response for context retrieval
          return result;
        } catch (error) {
          return String(error);
        }
      },
    }),
    searchQNA: tool({
      description:
        'Search the web and get a direct answer to your question, optimized for AI agent interactions',
      parameters: z.object({
        query: z.string().describe('The question to find an answer for'),
        searchDepth: z
          .enum(['basic', 'advanced'])
          .optional()
          .describe(
            'Depth of search - defaults to advanced for better answers',
          ),
        topic: z
          .enum(['general', 'news'])
          .optional()
          .describe(
            'Category of search - general for broad searches, news for recent events',
          ),
        days: z
          .number()
          .optional()
          .describe(
            'Number of days back to search (only works with news topic)',
          ),
        maxResults: z
          .number()
          .optional()
          .describe('Maximum number of results to consider'),
        includeDomains: z
          .array(z.string())
          .optional()
          .describe('List of domains to specifically include in results'),
        excludeDomains: z
          .array(z.string())
          .optional()
          .describe('List of domains to exclude from results'),
      }),
      execute: async ({ query, ...options }) => {
        try {
          // Note: searchQNA is a specialized endpoint in the Tavily API
          // For now, we'll use the regular search API with appropriate options
          const result = await searchTavilyApi(query, {
            ...options,
            includeAnswer: true,
            searchDepth: options.searchDepth || 'advanced',
          });

          return result;
        } catch (error) {
          return String(error);
        }
      },
    }),
    extract: tool({
      description: 'Extract content and optionally images from a list of URLs',
      parameters: z.object({
        urls: z
          .array(z.string().url())
          .max(20)
          .describe('List of URLs to extract content from (maximum 20 URLs)'),
        includeImages: z
          .boolean()
          .optional()
          .describe('Include images from the extracted content'),
      }),
      execute: async ({ urls, includeImages }) => {
        try {
          return await extractTavilyApi(urls, { includeImages });
        } catch (error) {
          return {
            results: [],
            error: String(error),
          } as TavilyExtractResponse;
        }
      },
    }),
  };

  // Filter out excluded tools
  if (config?.excludeTools) {
    for (const toolName of config.excludeTools) {
      delete tools[toolName];
    }
  }

  return tools;
};

// Export a standalone tavilySearchTool for direct use in the chat API
export const tavilySearchTool = tool({
  description: 'Search the web for current information on a given query',
  parameters: z.object({
    query: z.string().describe('The search query to find information about'),
    searchDepth: z
      .enum(['basic', 'advanced'])
      .optional()
      .describe('Depth of search - basic is faster, advanced is more thorough'),
    maxResults: z
      .number()
      .optional()
      .describe('Maximum number of results to return (default: 5)'),
    includeAnswer: z
      .boolean()
      .optional()
      .describe('Include AI-generated answer to query'),
    includeImages: z
      .boolean()
      .optional()
      .describe('Include related images in the response'),
  }),
  execute: async ({ query, ...options }) => {
    try {
      return await searchTavilyApi(query, options);
    } catch (error) {
      return {
        query,
        results: [],
        error: String(error)
      } as TavilySearchResponse;
    }
  },
});
