'use server';

import { z } from 'zod';

interface TavilySearchOptions {
  searchDepth?: 'basic' | 'advanced';
  includeAnswer?: boolean;
  maxResults?: number;
  includeDomains?: string[];
  excludeDomains?: string[];
  includeImages?: boolean;
  includeRawContent?: boolean;
  includeImageDescriptions?: boolean;
  topic?: string;
  timeRange?: string;
  days?: number;
}

interface TavilySearchResult {
  title: string;
  url: string;
  content: string;
  score?: number;
  rawContent?: string;
  publishedDate?: string;
}

interface TavilyImage {
  url: string;
  description?: string;
}

interface TavilySearchResponse {
  query: string;
  answer?: string;
  results: TavilySearchResult[];
  images?: TavilyImage[];
  responseTime?: number;
}

/**
 * Perform a search query using the Tavily API.
 *
 * @param query - The search query string.
 * @param options - Optional search parameters to customize the query.
 * @returns A Promise resolving to TavilySearchResponse containing the answer, results, images, and metadata.
 * @throws If the API key is missing, the request fails, or the response is invalid.
 */
export async function searchTavily(
  query: string,
  options?: TavilySearchOptions
): Promise<TavilySearchResponse> {
  try {
    const tavilyApiKey = process.env.TAVILY_API_KEY;
    if (!tavilyApiKey) throw new Error('Tavily API key is not configured.');

    const url = 'https://api.tavily.com/search';

    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tavilyApiKey}`,
    };

    // Build request body with required query and optional parameters
    const requestBody: Record<string, unknown> = { query };

    if (options) {
      if (options.searchDepth) requestBody['search_depth'] = options.searchDepth;
      if (options.includeAnswer !== undefined) requestBody['include_answer'] = options.includeAnswer;
      if (options.maxResults !== undefined) requestBody['max_results'] = options.maxResults;
      if (options.includeDomains) requestBody['include_domains'] = options.includeDomains;
      if (options.excludeDomains) requestBody['exclude_domains'] = options.excludeDomains;
      if (options.includeImages !== undefined) requestBody['include_images'] = options.includeImages;
      if (options.includeRawContent !== undefined) requestBody['include_raw_content'] = options.includeRawContent;
      if (options.includeImageDescriptions !== undefined) requestBody['include_image_descriptions'] = options.includeImageDescriptions;
      if (options.topic) requestBody['topic'] = options.topic;
      if (options.timeRange) requestBody['time_range'] = options.timeRange;
      if (options.days !== undefined) requestBody['days'] = options.days;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      try {
        const errorData = await response.json();
        throw new Error(
          `Tavily API error (${response.status}): ${errorData.message || 'Unknown error'}`
        );
      } catch {
        throw new Error(`Tavily API request failed with status: ${response.status}`);
      }
    }

    const data = await response.json();

    // Optional: validate with Zod here

    return data as TavilySearchResponse;
  } catch (error) {
    console.error('Error in searchTavily:', error);
    throw error;
  }
}
