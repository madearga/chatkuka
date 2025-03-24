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
  `Update the existing Mermaid diagram based on the user's description. Current diagram:\n${currentContent}\nEnsure the output is valid Mermaid syntax and builds upon the existing structure when possible. DO NOT include the word 'mermaid' at the beginning. Start directly with 'graph TD' or another valid diagram type.`;

// Define the diagram document handler
export const diagramDocumentHandler = createDocumentHandler<"diagram">({
  kind: "diagram",
  onCreateDocument: async ({ title, dataStream }) => {
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
        dataStream.writeData({ type: "content-update", content: draftContent });
      }
    }
    
    // Normalize content before returning
    return normalizeMermaidContent(draftContent);
  },
  onUpdateDocument: async ({ document, description, dataStream }) => {
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
        dataStream.writeData({ type: "content-update", content: draftContent });
      }
    }
    
    // Normalize content before returning
    return normalizeMermaidContent(draftContent);
  },
}); 