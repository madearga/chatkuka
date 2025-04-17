import { auth } from '@/app/(auth)/auth';
import { searchChatsByUserId } from '@/lib/db/queries';
import { groupChatsByDate, formatDate, generateUUID } from '@/lib/utils'; // Ensure formatDate and generateUUID are imported
import { NextResponse } from 'next/server'; // Import NextResponse

import type { Chat } from '@/lib/db/schema';

function transformSearchResults(searchResults: any[], query: string): Chat[] {
  // Check if searchResults is valid
  if (!searchResults || !Array.isArray(searchResults)) {
    console.warn('transformSearchResults received invalid searchResults:', searchResults);
    return [];
  }

  // Define a type for the search result
  type SearchResult = {
    id?: string;
    title?: string;
    preview?: string;
    createdAt?: string | Date;
    role?: string;
    userId?: string;
    visibility?: string;
    [key: string]: any; // Allow other properties
  };

  // First filter out invalid results, then map to Chat objects
  return searchResults
    .filter((result): result is SearchResult => {
      if (!result || typeof result !== 'object') {
        console.warn('Invalid search result item:', result);
        return false;
      }
      return true;
    })
    .map((result) => {

    let preview = result.preview;
    let contextPreview = '';

    try {
      // NOTE: user messages stored in our DB are plain string & tool call results are stored as JSON.
      // TODO: As tool call results have different schemas in the DB, we only show no preview available for now
      if (result.role !== 'user') {
        preview = 'No preview available';

        // LLM responses are stored under the "text" key
        if (result.role === 'assistant') {
          // Attempt to parse JSON safely
          try {
            // Check if preview is a string before parsing
            if (typeof result.preview === 'string') {
              const previewData = JSON.parse(result.preview);
              if (
                Array.isArray(previewData) &&
                previewData[0] &&
                previewData[0].text
              ) {
                preview = previewData[0].text;
              } else if (
                typeof previewData === 'object' &&
                previewData !== null &&
                previewData.text
              ) {
                // Handle cases where it might be a single object, not an array
                preview = previewData.text;
              }
            }
          } catch (jsonError) {
            console.warn("Could not parse preview JSON:", jsonError, result.preview);
            // If parsing fails, keep "No preview available"
          }
        }
      }

      // Generate a context preview with 50 characters before and after the query match
      if (preview && preview !== 'No preview available' && typeof preview === 'string') {
        // Added check for null/undefined preview and ensure it's a string
        const sanitizedQuery = query.toLowerCase();
        const lowerPreview = preview.toLowerCase();
        const matchIndex = lowerPreview.indexOf(sanitizedQuery);

        // Calculate start and end indices for the context window
        if (matchIndex !== -1) {
          const startIndex = Math.max(0, matchIndex - 50);
          const endIndex = Math.min(
            preview.length,
            matchIndex + sanitizedQuery.length + 50,
          );

          contextPreview = preview.substring(startIndex, endIndex);

          // Add ellipsis if we're not showing from the beginning or to the end
          if (startIndex > 0) {
            contextPreview = '...' + contextPreview;
          }
          if (endIndex < preview.length) {
            contextPreview += '...';
          }
          preview = contextPreview;
        } else {
          // If for some reason the query isn't found in the preview, fallback to showing the first part
          preview =
            preview?.length > 100 ? preview?.slice(0, 100) + '...' : preview;
        }
      }
    } catch (e: any) {
      console.error("Error transforming search result preview:", e, result);
      preview = 'No preview available';
    }

    // Ensure all required fields are present and match Chat type
    return {
      id: result.id || generateUUID(),
      title: result.title || 'Untitled',
      createdAt: result.createdAt ? new Date(result.createdAt) : new Date(), // Ensure it's a Date object
      userId: result.userId || '',
      visibility: (result.visibility || 'private') as 'public' | 'private',
      // Add preview for display purposes (not part of Chat type)
      preview: preview || 'No preview available',
      // Add role for display purposes (not part of Chat type)
      role: result.role || 'user',
    } as Chat;
  }); // We've already filtered out invalid results
}

export async function GET(request: Request) {
  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    // console.log("API Search: Unauthorized access attempt."); // Keep logging minimal
    return Response.json({ error: 'Unauthorized!' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q')?.trim?.();

  if (!query) {
    // console.log("API Search: Missing query parameter."); // Keep logging minimal
    return Response.json(
      { error: 'Search query is required' },
      { status: 400 },
    );
  }

  console.log(`API Search: User ${session.user.id} searching for "${query}"`);

  try {
    const searchResults = await searchChatsByUserId({
      userId: session.user.id,
      query,
    });
    console.log(`API Search: Found ${searchResults.length} raw results.`);

    const transformedResults = transformSearchResults(searchResults, query);
    const groupedResults = groupChatsByDate(transformedResults);
    console.log(`API Search: Returning grouped results:`, JSON.stringify(groupedResults));

    return Response.json(groupedResults);
  } catch (error) {
    // console.error("API Search: Error during search execution:", error); // Keep logging minimal
    return Response.json(
      { error: 'Failed to execute search' },
      { status: 500 },
    );
  }
}
