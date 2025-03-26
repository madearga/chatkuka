// This file will contain the server-side logic for the Diagram artifact
import { createDocumentHandler } from "@/lib/artifacts/server";
import { streamText, smoothStream } from "ai";
import { myProvider } from "@/lib/ai/models";

// Helper function to validate and normalize Mermaid content
const normalizeMermaidContent = (content: string): string => {
  // Step 1: Remove any markdown code fences and mermaid markers
  let cleaned = content.replace(/```(?:mermaid)?\s*\n?/g, '');
  cleaned = cleaned.replace(/^\s*mermaid\s*\n/i, '');
  
  // Step 2: Handle duplicate graph declarations, keeping only the first one
  const graphMatch = cleaned.match(/^\s*(graph|flowchart)\s+(TD|TB|BT|RL|LR)/i);
  if (graphMatch) {
    const prefix = graphMatch[0];
    // Remove any subsequent graph declarations
    cleaned = prefix + cleaned.substring(prefix.length).replace(/(graph|flowchart)\s+(TD|TB|BT|RL|LR)/gi, '');
  }
  
  // Step 3: Ensure there's exactly one valid declaration at the start
  if (!cleaned.match(/^\s*(graph|flowchart|sequenceDiagram|classDiagram|stateDiagram|erDiagram|gantt|pie|gitGraph)/i)) {
    cleaned = "graph TD\n" + cleaned;
  }
  
  // Step 4: Clean up whitespace
  cleaned = cleaned.trim();
  
  return cleaned;
};

// System prompts for diagram generation
const createSystemPrompt = "Generate a Mermaid diagram based on the given title. Use flowchart syntax by default (e.g., 'graph TD; A-->B;'). Ensure the output is valid Mermaid syntax. DO NOT include the word 'mermaid' at the beginning. Start directly with 'graph TD' or another valid diagram type.";

// System prompt for updating diagrams
const updateSystemPrompt = (currentContent: string) =>
  `Update the existing Mermaid diagram based on the user's description. 

Current diagram:
${currentContent}

Guidelines for updating:
1. Preserve the existing structure when appropriate, but feel free to enhance or reorganize if needed
2. Add more nodes and connections to make the diagram more comprehensive
3. Use clear and descriptive node labels
4. Maintain the same diagram type (flowchart, sequence, etc.) as the original
5. Use appropriate styling for clarity

Ensure the output is valid Mermaid syntax. DO NOT include the word 'mermaid' at the beginning. Start directly with the diagram type declaration (e.g., 'graph TD').`;

// Define the diagram document handler
export const diagramDocumentHandler = createDocumentHandler<"diagram">({
  kind: "diagram",
  onCreateDocument: async ({ title, dataStream }) => {
    // Log the start of document creation for debugging
    console.log(`Creating diagram for title: ${title}`);
    
    const { fullStream } = streamText({
      model: myProvider.languageModel("artifact-model"),
      system: createSystemPrompt,
      prompt: title,
      experimental_transform: smoothStream({ chunking: "word" }),
    });
    
    let draftContent = "";
    for await (const delta of fullStream) {
      if (delta.type === "text-delta") {
        draftContent += delta.textDelta;
        
        // Stream the delta to the client
        dataStream.writeData({ 
          type: "text-delta", 
          content: delta.textDelta 
        });
        
        // Log every few deltas for debugging
        if (draftContent.length % 50 === 0) {
          console.log(`Streaming diagram creation, current length: ${draftContent.length}`);
        }
      }
    }
    
    console.log(`Diagram creation complete, final length: ${draftContent.length}`);
    
    // Normalize content before returning
    return normalizeMermaidContent(draftContent);
  },
  onUpdateDocument: async ({ document, description, dataStream }) => {
    // Log the start of document update for debugging
    console.log(`Updating diagram with description: ${description}`);
    console.log(`Current content (${(document.content as string).length} chars)`);
    
    const { fullStream } = streamText({
      model: myProvider.languageModel("artifact-model"),
      system: updateSystemPrompt(document.content as string),
      prompt: description,
      experimental_transform: smoothStream({ chunking: "word" }),
      experimental_providerMetadata: {
        openai: {
          prediction: {
            type: "content",
            content: document.content,
          },
        },
      },
    });
    
    let draftContent = "";
    for await (const delta of fullStream) {
      if (delta.type === "text-delta") {
        draftContent += delta.textDelta;
        
        // Stream the delta to the client
        dataStream.writeData({ 
          type: "text-delta", 
          content: delta.textDelta 
        });
        
        // Log every few deltas for debugging
        if (draftContent.length % 50 === 0) {
          console.log(`Streaming diagram update, current length: ${draftContent.length}`);
        }
      }
    }
    
    console.log(`Diagram update complete, final length: ${draftContent.length}`);
    
    // Normalize content before returning
    return normalizeMermaidContent(draftContent);
  },
}); 