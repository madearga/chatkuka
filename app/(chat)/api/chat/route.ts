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
  type DBSchemaMessage,
} from '@/lib/db/queries';
import { generateUUID, getMostRecentUserMessage } from '@/lib/utils';

import { generateTitleFromUserMessage } from '../../actions';
import { createDocument } from '@/lib/ai/tools/create-document';
import { updateDocument } from '@/lib/ai/tools/update-document';
import { requestSuggestions } from '@/lib/ai/tools/request-suggestions';
import { getWeather } from '@/lib/ai/tools/get-weather';
import { tavilySearchTool } from '@/lib/ai/tools/tavily';

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
        topic?: 'general' | 'news' | 'finance';
        timeRange?: 'day' | 'week' | 'month' | 'year' | 'd' | 'w' | 'm' | 'y';
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
      return new Response('Unauthorized - No user ID in session', {
        status: 401,
      });
    }

    // Log session info for debugging
    console.log('Session user ID:', session.user.id);
    console.log('Session user email:', session.user.email);

    // Get user data from database to check subscription status
    const user = await getUserById(session.user.id);

    // Validate model access based on subscription status
    if (!hasModelAccess(user, selectedChatModel)) {
      console.error(
        `User ${session.user.email} attempted to use model ${selectedChatModel} without proper subscription`,
      );
      const defaultModel = getDefaultModelForUser(user);
      console.log(`Falling back to default model: ${defaultModel}`);

      // Override selected model with the default model for the user's tier
      selectedChatModel = defaultModel;

      // Add a system message to inform the user about the model downgrade
      if (
        messages.length > 0 &&
        messages[messages.length - 1].role === 'user'
      ) {
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
        // Generate title using the original user message (before transformation)
        const title = await generateTitleFromUserMessage({
          message: userMessage,
        });
        console.log('Creating new chat with title:', title);
        console.log('User ID from session:', session.user.id);

        await saveChat({ id, userId: session.user.id, title });
        console.log('Successfully created new chat with ID:', id);
      } catch (error) {
        console.error('Failed to save chat in database', error);
        // Return detailed error information
        return new Response(
          `Failed to create chat - database error: ${error instanceof Error ? error.message : String(error)}`,
          {
            status: 500,
          },
        );
      }
    }

    // Save user message to database
    try {
      // Get the attachments from the user message if available
      const attachments = (userMessage as any).experimental_attachments ?? [];

      // Construct the message to save using the DBSchemaMessage type
      const userMessageToSave: DBSchemaMessage = {
        id: userMessage.id,
        role: userMessage.role,
        // Create a text part from the user's content
        parts: [{ type: 'text', text: userMessage.content ?? '' }],
        createdAt: new Date(),
        chatId: id,
        // Assign the extracted attachments
        attachments: attachments,
      };

      await saveMessages({
        // Pass the correctly typed message in an array
        messages: [userMessageToSave],
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
      // Create error message using the new DBSchemaMessage format
      const errorMessage: DBSchemaMessage = {
        id: generateUUID(),
        role: 'assistant',
        // Create a text part for the error content
        parts: [
          {
            type: 'text',
            text: "I'm sorry, but the web search functionality is currently unavailable. Please check if the Tavily API key is configured correctly. I'll try to answer your question based on my existing knowledge.",
          },
        ],
        createdAt: new Date(),
        chatId: id,
        attachments: [], // Default empty attachments
      };

      await saveMessages({
        messages: [errorMessage],
      });
    }

    return createDataStreamResponse({
      execute: async (dataStream) => {

        // Define available tools
        const availableTools: Record<string, any> = {
          getWeather,
          createDocument: createDocument({
            session,
            dataStream,
            selectedModel: selectedChatModel,
          }),
          updateDocument: updateDocument({
            session,
            dataStream,
            selectedModel: selectedChatModel,
          }),
          requestSuggestions: requestSuggestions({
            session,
            dataStream,
          }),
        };

        // Add tavilySearchTool if search is enabled and API key is available
        const isSearchToolAvailable = !!tavilyApiKey;

        if (useSearch && isSearchToolAvailable) {
          availableTools.tavilySearchTool = tavilySearchTool;
          console.log("[API Route] Tavily search tool included for AI.");
        } else {
          console.log("[API Route] Tavily search tool excluded for AI.");
        }

        // Create system message
        let systemMessage =
          requestSystemPrompt || systemPrompt({ selectedChatModel });

        // Add search instructions to system prompt if search is enabled
        if (useSearch && searchToolAvailable && tavilyApiKey) {
          systemMessage += `\n\nThe user has enabled web search. If the user's query requires current or factual information, use the tavilySearchTool to search the web. When using search results, cite sources using markdown links in this format: [Source Title](URL).`;
        } else if (useSearch && !searchToolAvailable) {
          systemMessage += `\n\nThe user requested web search, but it's not available. Please inform them that search is unavailable and answer based on your knowledge.`;
        }

        // Set temperature to 1 for o3 and o4-mini models which don't support temperature=0
        const needsDefaultTemp =
          selectedChatModel === 'openai-o3' ||
          selectedChatModel === 'openai-o4-mini';

        const result = streamText({
          model: myProvider.languageModel(selectedChatModel),
          system: systemMessage,
          messages,
          maxSteps: 5,
          tools: availableTools,
          toolChoice: 'auto', // Let AI decide when to use tools
          temperature: needsDefaultTemp ? 1 : 0, // Set temperature to 1 for models that require it
          onFinish: async (response) => {
            // 1.7.1: Log the entire response object for debugging purposes
            console.log(
              '[onFinish] Full Response Object:',
              JSON.stringify(response, null, 2),
            );

            // Initialize array for assistant messages to save
            const assistantMessagesToSave: DBSchemaMessage[] = [];

            // 1.7.2: Iterate through response.response.messages if available
            if (response.response && response.response.messages && response.response.messages.length > 0) {
              for (const msg of response.response.messages) {
                if (msg.role === 'assistant') {
                  // 1.7.3: Build parts for this assistant message
                  const partsForDb: Array<any> = [];

                  // Process text content
                  if (typeof msg.content === 'string' && msg.content.trim().length > 0) {
                    partsForDb.push({ type: 'text', text: msg.content });
                  } else if (Array.isArray(msg.content)) {
                    // Find text parts in content array
                    for (const part of msg.content) {
                      if (part.type === 'text' && part.text && part.text.trim().length > 0) {
                        partsForDb.push({ type: 'text', text: part.text });
                      }
                    }
                  }

                  // Process tool calls and results
                  // First, collect all tool calls from this message
                  const toolCalls: any[] = [];

                  // Extract tool calls from message content
                  if (Array.isArray(msg.content)) {
                    for (const part of msg.content) {
                      // Check for tool-call type (using any to bypass type checking)
                      const anyPart = part as any;
                      if (anyPart.type === 'tool_call' || anyPart.type === 'tool-call') {
                        toolCalls.push({
                          id: anyPart.id,
                          name: anyPart.name,
                          args: anyPart.args
                        });
                      }
                    }
                  }

                  // Also check if tool_calls exists directly on the message (using any to bypass type checking)
                  const anyMsg = msg as any;
                  if (anyMsg.tool_calls && Array.isArray(anyMsg.tool_calls)) {
                    toolCalls.push(...anyMsg.tool_calls);
                  }

                  // For each tool call, find matching result in steps
                  if (toolCalls.length > 0 && response.steps && response.steps.length > 0) {
                    for (const toolCall of toolCalls) {
                      let matchingResult = null;

                      // Search through all steps for matching tool result
                      for (const step of response.steps) {
                        if (step.toolResults && step.toolResults.length > 0) {
                          for (const toolResult of step.toolResults) {
                            if (
                              toolResult.type === 'tool-result' &&
                              toolResult.toolCallId === toolCall.id
                            ) {
                              matchingResult = toolResult;
                              break;
                            }
                          }
                          if (matchingResult) break;
                        }
                      }

                      // Add tool invocation to parts
                      if (matchingResult) {
                        partsForDb.push({
                          type: 'tool-invocation',
                          toolInvocation: {
                            toolCallId: matchingResult.toolCallId,
                            toolName: matchingResult.toolName,
                            state: 'result',
                            args: matchingResult.args || toolCall.args,
                            result: matchingResult.result
                          }
                        });
                      } else {
                        // Tool call without result (in progress)
                        partsForDb.push({
                          type: 'tool-invocation',
                          toolInvocation: {
                            toolCallId: toolCall.id,
                            toolName: toolCall.name,
                            state: 'call',
                            args: toolCall.args
                          }
                        });
                      }
                    }
                  }

                  // If we have parts to save, create a message object
                  if (partsForDb.length > 0) {
                    assistantMessagesToSave.push({
                      id: generateUUID(),
                      role: 'assistant',
                      parts: partsForDb,
                      attachments: [],
                      createdAt: new Date(),
                      chatId: id,
                    });
                  }
                }
              }
            } else {
              // Fallback to using response.text if messages aren't available
              const parts: Array<any> = [];

              if (response.text && response.text.trim().length > 0) {
                parts.push({ type: 'text', text: response.text });
              }

              // Process tool results from all steps
              if (response.steps && response.steps.length > 0) {
                for (const step of response.steps) {
                  if (step.toolResults && step.toolResults.length > 0) {
                    for (const toolResult of step.toolResults) {
                      if (
                        toolResult.type === 'tool-result' &&
                        toolResult.toolCallId &&
                        toolResult.toolName &&
                        toolResult.result
                      ) {
                        parts.push({
                          type: 'tool-invocation',
                          toolInvocation: {
                            toolCallId: toolResult.toolCallId,
                            toolName: toolResult.toolName,
                            state: 'result',
                            result: toolResult.result,
                            args: toolResult.args,
                          },
                        });
                      }
                    }
                  }
                }
              }

              if (parts.length > 0) {
                assistantMessagesToSave.push({
                  id: generateUUID(),
                  role: 'assistant',
                  parts: parts,
                  attachments: [],
                  createdAt: new Date(),
                  chatId: id,
                });
              }
            }

            // 1.7.4: Save all messages
            if (assistantMessagesToSave.length > 0) {
              try {
                // Log the structure before saving
                console.log(
                  '[onFinish] Messages to Save:',
                  JSON.stringify(assistantMessagesToSave, null, 2),
                );

                // Save the constructed messages
                await saveMessages({ messages: assistantMessagesToSave });
                console.log(
                  '[onFinish] Successfully saved assistant messages.',
                );
              } catch (error) {
                console.error(
                  '[onFinish] Failed to save assistant messages:',
                  error,
                );
              }
            } else {
              console.error('[onFinish] No valid messages to save.');
            }
          },
          onError: (error) => {
            console.error('Error in chat API route:', error);
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
