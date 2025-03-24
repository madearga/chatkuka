// This file will contain the server-side logic for the Diagram artifact
import { createDocumentHandler } from "@/lib/artifacts/server";
import { streamText, smoothStream } from "ai";
import { myProvider } from "@/lib/ai/models";

// System prompts for diagram generation
const createSystemPrompt = "Generate a Mermaid diagram based on the given title. Use flowchart syntax by default (e.g., 'graph TD; A-->B;'). Ensure the output is valid Mermaid syntax.";

// System prompt for updating diagrams
const updateSystemPrompt = (currentContent: string) =>
  `Update the existing Mermaid diagram based on the user's description. Current diagram:\n${currentContent}\nEnsure the output is valid Mermaid syntax and builds upon the existing structure when possible.`;

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
    return draftContent;
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
    return draftContent;
  },
}); 