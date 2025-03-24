// This file will contain the client-side logic for the Diagram artifact
import { Artifact, ArtifactActionContext, ArtifactToolbarContext } from "@/components/create-artifact";
import { DataStreamDelta } from "@/components/data-stream-handler";
import { useState, useEffect } from "react";
import mermaid from "mermaid";
import { UIArtifact } from "@/components/artifact";

// Initialize Mermaid globally
mermaid.initialize({
  startOnLoad: false,
  theme: "default",
});

// MermaidRenderer component for rendering diagrams
const MermaidRenderer: React.FC<{ content: string }> = ({ content }) => {
  const [diagramSvg, setDiagramSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const renderDiagram = async () => {
      try {
        if (content.trim() === "") {
          setDiagramSvg(null);
          setError(null);
          return;
        }

        // Preprocess the content to handle common errors
        let processedContent = cleanMermaidSyntax(content);
        
        // Generate a unique ID for this render
        const id = "diagram-" + Math.random().toString(36).substring(7);
        
        const { svg } = await mermaid.render(id, processedContent);
        setDiagramSvg(svg);
        setError(null);
      } catch (e) {
        setError(`Error rendering diagram: ${(e as Error).message}`);
        setDiagramSvg(null);
        console.error("Mermaid error:", e);
        console.error("Problematic content:", content);
      }
    };
    renderDiagram();
  }, [content]);

  if (error) {
    return (
      <div>
        <div style={{ color: "red", marginBottom: "10px" }}>{error}</div>
        <div style={{ fontFamily: "monospace", whiteSpace: "pre-wrap", background: "#f5f5f5", padding: "10px", borderRadius: "4px" }}>
          {content}
        </div>
      </div>
    );
  }
  if (!diagramSvg) {
    return <div>No diagram content to render.</div>;
  }
  return <div dangerouslySetInnerHTML={{ __html: diagramSvg }} />;
};

// Clean Mermaid syntax to prepare it for rendering
const cleanMermaidSyntax = (content: string): string => {
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

// Normalize Mermaid content for saving
const normalizeMermaidContent = (content: string): string => {
  return cleanMermaidSyntax(content);
};

// Define metadata interface for diagram artifact
interface DiagramMetadata {}

// Define the diagram artifact
export const diagramArtifact = new Artifact<"diagram", DiagramMetadata>({
  kind: "diagram",
  description: "An artifact for creating and editing diagrams using Mermaid syntax.",
  
  initialize: ({ documentId, setMetadata }) => {
    // Initialize with empty metadata
    setMetadata({});
  },
  
  onStreamPart: ({ streamPart, setArtifact, setMetadata }) => {
    if (streamPart.type === "text-delta") {
      setArtifact((draft: UIArtifact) => ({
        ...draft,
        content: draft.content + (streamPart.content as string),
        status: "streaming",
      }));
    }
  },
  
  content: ({ content, status, onSaveContent }) => {
    const [editedContent, setEditedContent] = useState(content);
    
    useEffect(() => {
      setEditedContent(content);
    }, [content]);
    
    const isEditable = status !== "streaming";
    
    // Handle content generation
    if (content === "" && status === "streaming") {
      return <div>Generating diagram...</div>;
    }

    // Save content with validation
    const handleSave = () => {
      // Normalize content before saving
      const normalizedContent = normalizeMermaidContent(editedContent);
      onSaveContent(normalizedContent, true);
    };

    return (
      <div>
        <textarea
          value={editedContent}
          onChange={(e) => setEditedContent(e.target.value)}
          readOnly={!isEditable}
          style={{ width: "100%", height: "200px", fontFamily: "monospace" }}
          placeholder="Enter Mermaid syntax here (e.g., 'graph TD; A-->B;')"
        />
        <MermaidRenderer content={editedContent} />
        <button
          onClick={handleSave}
          disabled={!isEditable}
          style={{ marginTop: "10px" }}
        >
          Save
        </button>
      </div>
    );
  },
  
  actions: [
    {
      icon: <span>⟳</span>,
      description: "Request AI to update the diagram",
      onClick: (context: ArtifactActionContext<DiagramMetadata>) => {
        // Use the context to append a message
        const appendMessage = (context as any).appendMessage;
        if (appendMessage) {
          appendMessage({ 
            role: "user", 
            content: "Please update the diagram based on the current content." 
          });
        }
      },
    },
  ],
  
  toolbar: [
    {
      icon: <span>✎</span>,
      description: "Edit diagram",
      onClick: () => {
        const textarea = document.querySelector("textarea");
        if (textarea) textarea.focus();
      },
    },
  ],
}); 