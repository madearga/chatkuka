import { smoothStream, streamText } from 'ai';
import { myProvider } from '@/lib/ai/models';
import { createDocumentHandler } from '@/lib/artifacts/server';
import { updateDocumentPrompt } from '@/lib/ai/prompts';

export const textDocumentHandler = createDocumentHandler<'text'>({
  kind: 'text',
  onCreateDocument: async ({ title, dataStream, selectedModel }) => {
    let draftContent = '';

    // Use the selected chat model if available, otherwise fall back to artifact-model
    const modelToUse = selectedModel || 'artifact-model';

    // Inform the user which model is being used
    dataStream.writeData({
      type: 'info',
      content: `Using ${modelToUse} to generate text`,
      message: `Using ${modelToUse} to generate text`,
    });

    try {
      const { fullStream } = streamText({
        model: myProvider.languageModel(modelToUse),
        system:
          'Write about the given topic. Markdown is supported. Use headings wherever appropriate.',
        prompt: title,
      });

      for await (const delta of fullStream) {
        const { type } = delta;

        if (type === 'text-delta') {
          const { textDelta } = delta;

          draftContent += textDelta;

          dataStream.writeData({
            type: 'text-delta',
            content: textDelta,
          });
        }
      }

    } catch (error) {
      console.error(`Error generating text with model ${modelToUse}:`, error);

      // If the selected model fails, try with the default artifact model
      if (modelToUse !== 'artifact-model') {
        console.log('Falling back to default artifact-model');
        try {
          const { fullStream } = streamText({
            model: myProvider.languageModel('artifact-model'),
            system:
              'Write about the given topic. Markdown is supported. Use headings wherever appropriate.',
            prompt: title,
          });

          for await (const delta of fullStream) {
            const { type } = delta;

            if (type === 'text-delta') {
              const { textDelta } = delta;

              draftContent += textDelta;

              dataStream.writeData({
                type: 'text-delta',
                content: textDelta,
              });
            }
          }
        } catch (fallbackError) {
          console.error('Error with fallback model:', fallbackError);
          dataStream.writeData({
            type: 'error',
            content: 'Failed to generate text. Please try again later.',
            message: 'Failed to generate text. Please try again later.',
          });
        }
      } else {
        // If we're already using the artifact-model and it fails, show error
        dataStream.writeData({
          type: 'error',
          content: 'Failed to generate text. Please try again later.',
          message: 'Failed to generate text. Please try again later.',
        });
      }
    }

    return draftContent;
  },
  onUpdateDocument: async ({ document, description, dataStream, selectedModel }) => {
    let draftContent = '';

    // Use the selected chat model if available, otherwise fall back to artifact-model
    const modelToUse = selectedModel || 'artifact-model';

    // Inform the user which model is being used
    dataStream.writeData({
      type: 'info',
      content: `Using ${modelToUse} to update text`,
      message: `Using ${modelToUse} to update text`,
    });

    try {
      const { fullStream } = streamText({
        model: myProvider.languageModel(modelToUse),
        system: updateDocumentPrompt(document.content, 'text'),
        prompt: description,
        providerOptions: {
          openai: {
            prediction: {
              type: 'content',
              content: document.content,
            },
          },
        },
      });

      for await (const delta of fullStream) {
        const { type } = delta;

        if (type === 'text-delta') {
          const { textDelta } = delta;

          draftContent += textDelta;
          dataStream.writeData({
            type: 'text-delta',
            content: textDelta,
          });
        }
      }

    } catch (error) {
      console.error(`Error updating text with model ${modelToUse}:`, error);

      // If the selected model fails, try with the default artifact model
      if (modelToUse !== 'artifact-model') {
        console.log('Falling back to default artifact-model for update');
        try {
          const { fullStream } = streamText({
            model: myProvider.languageModel('artifact-model'),
            system: updateDocumentPrompt(document.content, 'text'),
            prompt: description,
            providerOptions: {
              openai: {
                prediction: {
                  type: 'content',
                  content: document.content,
                },
              },
            },
          });

          for await (const delta of fullStream) {
            const { type } = delta;

            if (type === 'text-delta') {
              const { textDelta } = delta;

              draftContent += textDelta;
              dataStream.writeData({
                type: 'text-delta',
                content: textDelta,
              });
            }
          }
        } catch (fallbackError) {
          console.error('Error with fallback model for update:', fallbackError);
          dataStream.writeData({
            type: 'error',
            content: 'Failed to update text. Please try again later.',
            message: 'Failed to update text. Please try again later.',
          });
        }
      } else {
        // If we're already using the artifact-model and it fails, show error
        dataStream.writeData({
          type: 'error',
          content: 'Failed to update text. Please try again later.',
          message: 'Failed to update text. Please try again later.',
        });
      }
    }

    return draftContent;
  },
});
