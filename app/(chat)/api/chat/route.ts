import {
  type Message,
  createDataStreamResponse,
  smoothStream,
  streamText,
} from 'ai';

import { auth } from '@/app/(auth)/auth';
import { myProvider } from '@/lib/ai/models';
import { systemPrompt } from '@/lib/ai/prompts';
import { hasModelAccess, getDefaultModelForUser } from '@/lib/ai/model-access';
import {
  deleteChatById,
  getChatById,
  saveChat,
  saveMessages,
  getUserById,
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
import { searchTavily } from '@/lib/clients/tavily';

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    let {
      id,
      messages,
      selectedChatModel,
      useSearch,
      searchQuery,
      searchOptions,
      systemPrompt: requestSystemPrompt, // Add systemPrompt from request
    }: {
      id: string;
      messages: Array<Message & { attachmentUrl?: string | null }>;
      selectedChatModel: string;
      useSearch?: boolean;
      searchQuery?: string;
      searchOptions?: {
        searchDepth?: 'basic' | 'advanced';
        includeAnswer?: boolean;
        maxResults?: number;
        includeDomains?: string[];
        excludeDomains?: string[];
        includeImages?: boolean;
        includeImageDescriptions?: boolean;
        topic?: string;
        timeRange?: string;
        days?: number;
      };
      systemPrompt?: string; // Add systemPrompt type
    } = await request.json();

    const session = await auth();

    // Enhanced session validation
    if (!session) {
      console.error('No session found');
      return new Response('Unauthorized - No session', { status: 401 });
    }

    if (!session.user) {
      console.error('No user in session');
      return new Response('Unauthorized - No user in session', { status: 401 });
    }

    if (!session.user.id) {
      console.error('No user ID in session');
      return new Response('Unauthorized - No user ID in session', { status: 401 });
    }

    // Log session info for debugging
    console.log('Session user ID:', session.user.id);
    console.log('Session user email:', session.user.email);

    // Get user data from database to check subscription status
    const user = await getUserById(session.user.id);

    // Validate model access based on subscription status
    if (!hasModelAccess(user, selectedChatModel)) {
      console.error(`User ${session.user.email} attempted to use model ${selectedChatModel} without proper subscription`);
      const defaultModel = getDefaultModelForUser(user);
      console.log(`Falling back to default model: ${defaultModel}`);

      // Override selected model with the default model for the user's tier
      selectedChatModel = defaultModel;

      // Add a system message to inform the user about the model downgrade
      if (messages.length > 0 && messages[messages.length - 1].role === 'user') {
        // Add a system message before the AI response
        messages.push({
          id: generateUUID(),
          role: 'system',
          content: `This model requires a Pro subscription. Your message has been processed with the free tier model instead. [Upgrade to Pro](/subscription) to access advanced models.`,
        });
      }
    }

    const userMessage = getMostRecentUserMessage(messages);

    if (!userMessage) {
      return new Response('No user message found', { status: 400 });
    }

    // Check if chat exists
    let chat;
    try {
      chat = await getChatById({ id });
      console.log('Existing chat found:', chat);
    } catch (error) {
      console.error('Error fetching chat:', error);
      return new Response('Error fetching chat', { status: 500 });
    }

    // Create new chat if it doesn't exist
    if (!chat) {
      try {
        const title = await generateTitleFromUserMessage({ message: userMessage });
        console.log('Creating new chat with title:', title);
        console.log('User ID from session:', session.user.id);

        await saveChat({ id, userId: session.user.id, title });
        console.log('Successfully created new chat with ID:', id);
      } catch (error) {
        console.error('Failed to save chat in database', error);
        // Return detailed error information
        return new Response(`Failed to create chat - database error: ${error instanceof Error ? error.message : String(error)}`, {
          status: 500
        });
      }
    }

    // Save user message to database
    try {
      // Get attachmentUrl from message if available
      const attachmentUrl = (userMessage as any).attachmentUrl || null;

      await saveMessages({
        messages: [{
          ...userMessage,
          createdAt: new Date(),
          chatId: id,
          attachmentUrl
        }],
      });
      console.log('Successfully saved user message');
    } catch (error) {
      console.error('Failed to save user message', error);
      // Continue execution even if message saving fails
    }

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
        let systemMessage = requestSystemPrompt || systemPrompt({ selectedChatModel });
        let searchResults = null;

        if (useSearch && searchToolAvailable && searchQuery && tavilyApiKey) {
          try {
            // Update status to processing
            dataStream.writeData({
              type: 'search-status',
              status: 'processing',
              query: searchQuery,
            });

            searchResults = await searchTavily(searchQuery, searchOptions);
            console.log('Search results from Tavily:', searchResults);

            // Send search results to client
            dataStream.writeData({
              type: 'search-results',
              status: 'complete',
              query: searchQuery,
              results: searchResults.results ? JSON.parse(JSON.stringify(searchResults.results)) : [],
              answer: searchResults.answer,
              images: searchResults.images ? JSON.parse(JSON.stringify(searchResults.images)) : [],
              responseTime: searchResults.responseTime,
            } as any);

            // Add search results to system message
            systemMessage += `\n\nSearch results for "${searchQuery}":\n\n`;
            if (searchResults.answer) {
              systemMessage += `Summary: ${searchResults.answer}\n\n`;
            }

            if (Array.isArray(searchResults.results) && searchResults.results.length > 0) {
              systemMessage += `Sources:\n`;
              searchResults.results.forEach((result: any, index: number) => {
                systemMessage += `Source ${index + 1}: ${result.title}\n`;
                systemMessage += `URL: ${result.url}\n`;
                systemMessage += `Content: ${result.content}\n\n`;
              });

              // Add citation instructions
              systemMessage += `\nWhen referencing the above search results in your response, please cite the sources using markdown links in this format: [Source Title](URL).\n`;
              systemMessage += `For example: "According to [${searchResults.results[0].title}](${searchResults.results[0].url}), ..."\n\n`;
            } else {
              systemMessage += `No search results found.\n\n`;
            }

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
