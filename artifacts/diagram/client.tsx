// This file will contain the client-side logic for the Diagram artifact
import { Artifact, ArtifactActionContext, ArtifactToolbarContext } from "@/components/create-artifact";
import { DataStreamDelta } from "@/components/data-stream-handler";
import { useState, useEffect, useRef } from "react";
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
interface DiagramMetadata {
  textareaId?: string;
}

// Function to find and focus textarea in the document
const focusDiagramTextarea = () => {
  // Try different strategies to find the textarea
  
  // Strategy 1: Find by specific ID pattern
  const textareas = document.querySelectorAll('textarea[id^="diagram-textarea-"]');
  if (textareas.length > 0) {
    const textarea = textareas[0] as HTMLTextAreaElement;
    textarea.focus();
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
    console.log("Found and focused textarea by ID pattern");
    return true;
  }
  
  // Strategy 2: Find the first textarea in diagram artifact container
  const artifactContainers = document.querySelectorAll('[data-artifact-kind="diagram"]');
  for (const container of artifactContainers) {
    const textareas = container.querySelectorAll('textarea');
    if (textareas.length > 0) {
      const textarea = textareas[0] as HTMLTextAreaElement;
      textarea.focus();
      textarea.setSelectionRange(textarea.value.length, textarea.value.length);
      console.log("Found and focused textarea in diagram container");
      return true;
    }
  }
  
  // Strategy 3: Look for any textarea with mermaid-like content
  const allTextareas = document.querySelectorAll('textarea');
  for (const textareaElem of allTextareas) {
    const textarea = textareaElem as HTMLTextAreaElement;
    if (textarea.value.includes('graph') || 
        textarea.value.includes('flowchart') || 
        textarea.value.includes('sequenceDiagram')) {
      textarea.focus();
      textarea.setSelectionRange(textarea.value.length, textarea.value.length);
      console.log("Found and focused textarea with mermaid content");
      return true;
    }
  }
  
  console.log("Could not find diagram textarea");
  return false;
};

// Define the diagram artifact
export const diagramArtifact = new Artifact<"diagram", DiagramMetadata>({
  kind: "diagram",
  description: "An artifact for creating and editing diagrams using Mermaid syntax.",
  
  initialize: ({ documentId, setMetadata }) => {
    // Initialize with empty metadata and a unique ID for the textarea
    setMetadata({
      textareaId: `diagram-textarea-${documentId}`
    });
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
  
  content: ({ content, status, onSaveContent, metadata, setMetadata }) => {
    const [editedContent, setEditedContent] = useState(content);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    
    useEffect(() => {
      setEditedContent(content);
    }, [content]);
    
    // Generate a unique ID for the textarea if not already set in metadata
    useEffect(() => {
      if (!metadata.textareaId) {
        setMetadata(prev => ({
          ...prev,
          textareaId: `diagram-textarea-${Date.now()}`
        }));
      }
    }, [metadata.textareaId, setMetadata]);
    
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
      <div data-artifact-kind="diagram">
        <textarea
          id={metadata.textareaId}
          ref={textareaRef}
          value={editedContent}
          onChange={(e) => setEditedContent(e.target.value)}
          readOnly={!isEditable}
          style={{ width: "100%", height: "200px", fontFamily: "monospace" }}
          placeholder="Enter Mermaid syntax here (e.g., 'graph TD; A-->B;')"
          data-diagram-editor="true"
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
    // The "Request AI to update the diagram" action has been removed
  ],
  
  toolbar: [
    {
      icon: <span>✎</span>,
      description: "Edit diagram",
      onClick: ({ appendMessage }: ArtifactToolbarContext) => {
        // Try to find and focus the textarea using our helper function
        const found = focusDiagramTextarea();
        
        if (!found) {
          // If textarea not found, send a chat message to inform the user
          appendMessage({
            id: Date.now().toString(),
            role: "user",
            content: "I'd like to edit the diagram.",
            createdAt: new Date(),
          });
          console.log("Textarea element not found, sending chat message instead");
        }
      },
    },
    {
      icon: <span>⟳</span>,
      description: "Update diagram with AI",
      onClick: ({ appendMessage }: ArtifactToolbarContext) => {
        // Send a message to update the diagram using the chat interface
        appendMessage({
          id: Date.now().toString(),
          role: "user",
          content: "Please enhance and update this diagram to make it more comprehensive and visually clear.",
          createdAt: new Date(),
        });
        console.log("Diagram update requested via chat");
      },
    },
  ],
}); 