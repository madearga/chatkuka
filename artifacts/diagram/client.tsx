// This file will contain the client-side logic for the Diagram artifact
import { Artifact } from "@/components/create-artifact";
import { useState, useEffect } from "react";
import mermaid from "mermaid";

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
        const { svg } = await mermaid.render("diagram-" + Math.random().toString(36).substring(7), content);
        setDiagramSvg(svg);
        setError(null);
      } catch (e) {
        setError(`Error rendering diagram: ${(e as Error).message}`);
        setDiagramSvg(null);
      }
    };
    renderDiagram();
  }, [content]);

  if (error) {
    return <div style={{ color: "red" }}>{error}</div>;
  }
  if (!diagramSvg) {
    return <div>No diagram content to render.</div>;
  }
  return <div dangerouslySetInnerHTML={{ __html: diagramSvg }} />;
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
  
  onStreamPart: ({ streamPart, setMetadata, setArtifact }) => {
    // Handle text delta updates
    if (streamPart.type === "text-delta") {
      setArtifact((draftArtifact) => ({
        ...draftArtifact,
        content: draftArtifact.content + streamPart.content,
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
    
    if (content === "" && status === "streaming") {
      return <div>Generating diagram...</div>;
    }
    
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
          onClick={() => onSaveContent(editedContent, true)}
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
      onClick: (context) => {
        // Use the context to append a message
        // This will be called with the proper context from the artifact component
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