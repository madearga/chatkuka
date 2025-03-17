import { createDocumentHandler } from '@/lib/artifacts/server';
import { experimental_generateImage } from 'ai';
import { myProvider } from '@/lib/ai/models';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Google Generative AI client
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || '');

/**
 * Image document handler for generating and editing images
 * Uses Google's Gemini API with fallback to experimental_generateImage
 */
export const imageDocumentHandler = createDocumentHandler<'image'>({
  kind: 'image',
  onCreateDocument: async ({ title, dataStream }) => {
    let draftContent = '';

    try {
      // First try with Gemini model for image generation
      try {
        // Skip Gemini if API key is not provided
        if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
          throw new Error("Google Generative AI API key not configured");
        }

        const model = genAI.getGenerativeModel({
          model: 'gemini-2.0-flash-exp-image-generation',
        });
      
        // Generate content using the prompt
        const response = await model.generateContent([
          { text: `Generate a high quality image of: ${title}. Make sure to include an image in your response. This is very important.` }
        ]);
        
        // Check if we have a valid response with candidates
        const candidates = response.response?.candidates;
        if (candidates && candidates.length > 0 && candidates[0].content) {
          const parts = candidates[0].content.parts;
          
          // Find the image part in the response
          for (const part of parts) {
            if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
              // Extract the base64 image data
              draftContent = part.inlineData.data;
              
              // Stream the image data to the client
              dataStream.writeData({
                type: 'image-delta',
                content: draftContent,
              });
              break;
            }
          }
        }
        
        // If no image was generated, fall back to the experimental_generateImage
        if (!draftContent) {
          throw new Error("No image generated in the Gemini response");
        }
      } catch (geminiError) {
        console.warn("Falling back to experimental_generateImage:", geminiError instanceof Error ? geminiError.message : String(geminiError));
        
        // Fall back to experimental_generateImage
        const { image } = await experimental_generateImage({
          model: myProvider.imageModel('small-model'),
          prompt: title,
          n: 1,
        });

        draftContent = image.base64;

        dataStream.writeData({
          type: 'image-delta',
          content: image.base64,
        });
      }
    } catch (error) {
      // Log the error and stream it to the client
      console.error("Error generating image:", error instanceof Error ? error.message : String(error));
      dataStream.writeData({
        type: 'error',
        message: error instanceof Error ? error.message : 'Unknown error occurred during image generation',
      });
    }

    return draftContent;
  },
  onUpdateDocument: async ({ description, dataStream, document }) => {
    let draftContent = '';
    
    try {
      // Get the current image content from the document
      const currentContent = document.content;
      
      // Validate inputs
      if (!description) {
        throw new Error("Editing prompt cannot be empty");
      }
      if (!currentContent) {
        throw new Error("No existing image to edit");
      }
      
      try {
        // Skip Gemini if API key is not provided
        if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
          throw new Error("Google Generative AI API key not configured");
        }

        // Use Gemini model for image editing
        const model = genAI.getGenerativeModel({
          model: 'gemini-2.0-flash-exp-image-generation',
        });
        
        // Generate content using the description as the prompt and the current image
        const response = await model.generateContent([
          { text: `Edit this image according to this description: ${description}. Make the edit subtle and maintain the same style and quality of the original image. Make sure to include the edited image in your response.` },
          { 
            inlineData: {
              mimeType: 'image/png',
              data: currentContent
            } 
          }
        ]);
        
        // Check if we have a valid response with candidates
        const candidates = response.response?.candidates;
        if (candidates && candidates.length > 0 && candidates[0].content) {
          const parts = candidates[0].content.parts;
          
          // Find the image part in the response
          for (const part of parts) {
            if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
              // Extract the base64 image data
              draftContent = part.inlineData.data;
              
              // Stream the image data to the client
              dataStream.writeData({
                type: 'image-delta',
                content: draftContent,
              });
              break;
            }
          }
        }
        
        // If no image was found in the response, throw an error to trigger fallback
        if (!draftContent) {
          throw new Error("No image generated in the Gemini response");
        }
      } catch (geminiError) {
        console.warn("Falling back to experimental_generateImage:", geminiError instanceof Error ? geminiError.message : String(geminiError));
        
        // Fall back to the experimental_generateImage
        const { image } = await experimental_generateImage({
          model: myProvider.imageModel('small-model'),
          prompt: description,
          n: 1,
        });

        draftContent = image.base64;

        dataStream.writeData({
          type: 'image-delta',
          content: image.base64,
        });
      }
    } catch (error) {
      console.error("Error editing image:", error instanceof Error ? error.message : String(error));
      
      // Log the error and stream it to the client
      dataStream.writeData({
        type: 'error',
        message: error instanceof Error ? error.message : 'Unknown error occurred during image editing',
      });
    }

    return draftContent;
  },
});
