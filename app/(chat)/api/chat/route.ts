import {
  type Message,
  createDataStreamResponse,
  smoothStream,
  streamText,
} from 'ai';

import { auth } from '@/app/(auth)/auth';
import { myProvider } from '@/lib/ai/models';
import { systemPrompt } from '@/lib/ai/prompts';
import {
  deleteChatById,
  getChatById,
  saveChat,
  saveMessages,
} from '@/lib/db/queries';
import {
  generateUUID,
  getMostRecentUserMessage,
  sanitizeResponseMessages,
} from '@/lib/utils';

import { generateTitleFromUserMessage } from '../../actions';
import { createDocument } from '@/lib/ai/tools/create-document';
import { updateDocument } from '@/lib/ai/tools/update-document';
import { requestSuggestions } from '@/lib/ai/tools/request-suggestions';
import { getWeather } from '@/lib/ai/tools/get-weather';

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const {
      id,
      messages,
      selectedChatModel,
      useSearch,
      searchQuery,
      searchOptions,
    }: { 
      id: string; 
      messages: Array<Message>; 
      selectedChatModel: string;
      useSearch?: boolean;
      searchQuery?: string;
      searchOptions?: {
        searchDepth?: 'basic' | 'advanced';
        includeAnswer?: boolean;
        maxResults?: number;
      };
    } = await request.json();

    const session = await auth();

    if (!session || !session.user || !session.user.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    const userMessage = getMostRecentUserMessage(messages);

    if (!userMessage) {
      return new Response('No user message found', { status: 400 });
    }

    const chat = await getChatById({ id });

    if (!chat) {
      const title = await generateTitleFromUserMessage({ message: userMessage });
      await saveChat({ id, userId: session.user.id, title });
    }

    // Simpan pesan pengguna ke database
    await saveMessages({
      messages: [{ ...userMessage, createdAt: new Date(), chatId: id }],
    });

    // Get Tavily API key from environment variables
    const tavilyApiKey = process.env.TAVILY_API_KEY;
    
    // Check if search is available
    const searchToolAvailable = Boolean(tavilyApiKey);
    
    if (!searchToolAvailable && useSearch) {
      console.warn('Tavily API key is missing but search was requested');
    }

    // Jika search diminta tapi tidak tersedia, beri tahu pengguna
    if (useSearch && !searchToolAvailable) {
      const errorMessage = {
        id: generateUUID(),
        role: 'assistant',
        content: "I'm sorry, but the web search functionality is currently unavailable. Please check if the Tavily API key is configured correctly. I'll try to answer your question based on my existing knowledge.",
        createdAt: new Date(),
        chatId: id
      };
      
      await saveMessages({
        messages: [errorMessage],
      });
    }

    return createDataStreamResponse({
      execute: async (dataStream) => {
        // Jika search diaktifkan, kirim status pencarian ke client
        if (useSearch && searchToolAvailable && searchQuery) {
          // Kirim status pencarian ke client
          dataStream.writeData({
            type: 'search-status',
            status: 'searching',
            query: searchQuery,
          });
        }

        // Determine which tools to use
        type ToolName = 'getWeather' | 'createDocument' | 'updateDocument' | 'requestSuggestions';
        const activeTools = selectedChatModel === 'chat-model-reasoning'
          ? ([] as ToolName[])
          : (['getWeather', 'createDocument', 'updateDocument', 'requestSuggestions'] as ToolName[]);

        // Combine standard tools
        const tools = {
          getWeather,
          createDocument: createDocument({ session, dataStream }),
          updateDocument: updateDocument({ session, dataStream }),
          requestSuggestions: requestSuggestions({
            session,
            dataStream,
          }),
        };

        // If search is enabled, perform search before starting the AI response
        let systemMessage = systemPrompt({ selectedChatModel });
        let searchResults = null;
        
        if (useSearch && searchToolAvailable && searchQuery && tavilyApiKey) {
          try {
            // Update status to processing
            dataStream.writeData({
              type: 'search-status',
              status: 'processing',
              query: searchQuery,
            });
            
            // Perform the search
            const response = await fetch('https://api.tavily.com/search', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${tavilyApiKey}`,
              },
              body: JSON.stringify({
                query: searchQuery,
                search_depth: searchOptions?.searchDepth || 'basic',
                include_answer: searchOptions?.includeAnswer !== false,
                max_results: searchOptions?.maxResults || 5,
              }),
            });
            
            if (!response.ok) {
              throw new Error(`Search failed with status: ${response.status}`);
            }
            
            searchResults = await response.json();
            
            // Send search results to client
            dataStream.writeData({
              type: 'search-results',
              status: 'complete',
              query: searchQuery,
              results: searchResults.results,
              answer: searchResults.answer,
              images: searchResults.images,
              responseTime: searchResults.responseTime,
            });
            
            // Add search results to system message
            systemMessage += `\n\nSearch results for "${searchQuery}":\n\n`;
            if (searchResults.answer) {
              systemMessage += `Summary: ${searchResults.answer}\n\n`;
            }
            
            searchResults.results.forEach((result: any, index: number) => {
              systemMessage += `Source ${index + 1}: ${result.title}\n`;
              systemMessage += `URL: ${result.url}\n`;
              systemMessage += `Content: ${result.content}\n\n`;
            });
            
            systemMessage += `Please use these search results to provide a comprehensive response to the user's query.`;
            
          } catch (error) {
            console.error('Search error:', error);
            
            // Send error to client
            dataStream.writeData({
              type: 'search-status',
              status: 'error',
              query: searchQuery,
              error: error instanceof Error ? error.message : String(error),
            });
            
            systemMessage += `\n\nAttempted to search for "${searchQuery}" but encountered an error. Please inform the user that the search failed and answer based on your knowledge.`;
          }
        } else if (useSearch && !searchToolAvailable) {
          systemMessage += `\n\nThe user requested web search, but it's not available. Please inform them that search is unavailable and answer based on your knowledge.`;
        }

        const result = streamText({
          model: myProvider.languageModel(selectedChatModel),
          system: systemMessage,
          messages,
          maxSteps: 5,
          experimental_activeTools: activeTools,
          experimental_transform: smoothStream({ chunking: 'word' }),
          experimental_generateMessageId: generateUUID,
          tools,
          onFinish: async ({ response, reasoning }) => {
            if (session.user?.id) {
              try {
                const sanitizedResponseMessages = sanitizeResponseMessages({
                  messages: response.messages,
                  reasoning,
                });

                if (sanitizedResponseMessages && sanitizedResponseMessages.length > 0) {
                  const messagesToSave = sanitizedResponseMessages.map((message) => {
                    return {
                      id: message.id,
                      chatId: id,
                      role: message.role,
                      content: message.content,
                      createdAt: new Date(),
                    };
                  }).filter(msg => msg.content !== undefined && msg.content !== null);

                  if (messagesToSave.length > 0) {
                    await saveMessages({
                      messages: messagesToSave,
                    });
                  } else {
                    console.log('No messages to save after mapping and filtering');
                  }
                } else {
                  console.log('No messages to save after sanitization');
                }
              } catch (error) {
                console.error('Failed to save chat', error);
              }
            }
          },
          experimental_telemetry: {
            isEnabled: true,
            functionId: 'stream-text',
          },
        });

        result.mergeIntoDataStream(dataStream, {
          sendReasoning: true,
        });
      },
      onError: (error) => {
        console.error('Error in chat API route:', error);
        return 'Oops, an error occurred while processing your request. Please try again.';
      },
    });
  } catch (error) {
    console.error('Unhandled error in chat API route:', error);
    return new Response('An unexpected error occurred', { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new Response('Not Found', { status: 404 });
  }

  const session = await auth();

  if (!session || !session.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const chat = await getChatById({ id });

    if (chat.userId !== session.user.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    await deleteChatById({ id });

    return new Response('Chat deleted', { status: 200 });
  } catch (error) {
    return new Response('An error occurred while processing your request', {
      status: 500,
    });
  }
}
