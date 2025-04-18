'use server';

import { tavily } from '@tavily/core';

export interface TavilySearchOptions {
  searchDepth?: 'basic' | 'advanced';
  includeAnswer?: boolean;
  maxResults?: number;
  includeDomains?: string[];
  excludeDomains?: string[];
  includeImages?: boolean;
  includeRawContent?: boolean;
  includeImageDescriptions?: boolean;
  topic?: 'general' | 'news' | 'finance';
  timeRange?: 'day' | 'week' | 'month' | 'year' | 'd' | 'w' | 'm' | 'y';
  days?: number;
}

export interface TavilySearchResult {
  title: string;
  url: string;
  content: string;
  score?: number;
  rawContent?: string;
  publishedDate?: string;
}

export interface TavilyImage {
  url: string;
  description?: string;
}

export interface TavilySearchResponse {
  query: string;
  answer?: string;
  results: TavilySearchResult[];
  images?: TavilyImage[];
  responseTime?: number;
  error?: string; // Added to handle errors
}

export interface TavilyExtractResult {
  url: string;
  rawContent: string;
  images?: string[];
  error?: string;
}

export interface TavilyExtractResponse {
  results: TavilyExtractResult[];
  error?: string;
}

/**
 * Perform a search query using the Tavily API.
 *
 * @param query - The search query string.
 * @param options - Optional search parameters to customize the query.
 * @returns A Promise resolving to TavilySearchResponse containing the answer, results, images, and metadata.
 * @throws If the API key is missing, the request fails, or the response is invalid.
 */
export async function searchTavilyApi(
  query: string,
  options?: TavilySearchOptions,
): Promise<TavilySearchResponse> {
  try {
    const tavilyApiKey = process.env.TAVILY_API_KEY;
    if (!tavilyApiKey) {
      console.error('Tavily API key is not configured.');
      return {
        query,
        results: [],
        error: 'Tavily API key is not configured.',
      };
    }

    const client = tavily({ apiKey: tavilyApiKey });

    const result = await client.search(query, {
      ...options,
    });

    return result;
  } catch (error) {
    console.error('Error in searchTavilyApi:', error);
    return {
      query,
      results: [],
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Extract content from specified URLs using the Tavily API.
 *
 * @param urls - Array of URLs to extract content from.
 * @param options - Optional extraction parameters.
 * @returns A Promise resolving to TavilyExtractResponse containing the extracted content.
 */
export async function extractTavilyApi(
  urls: string[],
  options?: { includeImages?: boolean },
): Promise<TavilyExtractResponse> {
  try {
    const tavilyApiKey = process.env.TAVILY_API_KEY;
    if (!tavilyApiKey) {
      console.error('Tavily API key is not configured.');
      return {
        results: [],
        error: 'Tavily API key is not configured.',
      };
    }

    const client = tavily({ apiKey: tavilyApiKey });

    const response = await client.extract(urls, options || {});

    return {
      results: response.results.map((result) => ({
        url: result.url,
        rawContent: result.rawContent,
        images: options?.includeImages ? result.images : undefined,
      })),
    };
  } catch (error) {
    console.error('Error in extractTavilyApi:', error);
    return {
      results: [],
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
