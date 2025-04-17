import { LoaderIcon, UploadIcon, CopyIcon } from './icons';
import cn from 'classnames';
import { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { generateUUID } from '@/lib/utils';

interface ImageEditorProps {
  title: string;
  content: string;
  isCurrentVersion: boolean;
  currentVersionIndex: number;
  status: string;
  isInline: boolean;
  onSaveContent?: (content: string, debounce: boolean) => void;
  documentId?: string;
}

export function ImageEditor({
  title,
  content,
  status,
  isInline,
  onSaveContent,
  documentId,
}: ImageEditorProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [lastUploadedId, setLastUploadedId] = useState<string>('');

  // Check for lastUploadedImageId in localStorage on mount
  useEffect(() => {
    const savedId = localStorage.getItem('lastUploadedImageId');
    if (savedId) {
      setLastUploadedId(savedId);
    }
  }, []);

  // Handle file upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    try {
      const loadingToast = toast.loading('Uploading image...');

      // Convert the file to base64
      const base64 = await readFileAsBase64(file);

      // Create form data for server upload
      const formData = new FormData();
      const docId = generateUUID();
      formData.append('file', file);
      formData.append('id', docId);
      formData.append('kind', 'image');

      // Upload the image to server
      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
      });

      toast.dismiss(loadingToast);

      // Parse response once
      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to upload image');
      }

      // Use the already parsed response data
      const uploadedDocId = responseData.documentId || docId;

      // Store the document ID in local storage
      localStorage.setItem('lastUploadedImageId', uploadedDocId);
      setLastUploadedId(uploadedDocId);

      // Save the content
      if (onSaveContent) {
        onSaveContent(base64.split(',')[1], false);
      }

      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error(
        error instanceof Error ? error.message : 'Error uploading image',
      );
    }
  };

  // Convert file to base64
  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Handle drag events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    try {
      const loadingToast = toast.loading('Uploading image...');

      // Convert the file to base64
      const base64 = await readFileAsBase64(file);

      // Create form data for server upload
      const formData = new FormData();
      const docId = generateUUID();
      formData.append('file', file);
      formData.append('id', docId);
      formData.append('kind', 'image');

      // Upload the image to server
      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
      });

      toast.dismiss(loadingToast);

      // Parse response once
      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to upload image');
      }

      // Use the already parsed response data
      const uploadedDocId = responseData.documentId || docId;

      // Store the document ID in local storage
      localStorage.setItem('lastUploadedImageId', uploadedDocId);
      setLastUploadedId(uploadedDocId);

      // Save the content
      if (onSaveContent) {
        onSaveContent(base64.split(',')[1], false);
      }

      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error(
        error instanceof Error ? error.message : 'Error uploading image',
      );
    }
  };

  // Trigger file input click
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Copy ID to clipboard
  const copyIdToClipboard = (id: string) => {
    navigator.clipboard.writeText(id);
    toast.success('ID copied to clipboard');
  };

  // Get the effective document ID (from props or localStorage)
  const effectiveDocId = documentId || lastUploadedId;

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center w-full image-editor-container',
        {
          'h-[calc(100dvh-60px)]': !isInline,
          'h-[200px]': isInline,
        },
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {status === 'streaming' ? (
        <div className="flex flex-row gap-4 items-center">
          {!isInline && (
            <div className="animate-spin">
              <LoaderIcon />
            </div>
          )}
          <div>Generating Image...</div>
        </div>
      ) : content ? (
        <div className="relative w-full flex flex-col items-center">
          <picture>
            <img
              className={cn('w-full h-fit max-w-[800px]', {
                'p-0 md:p-20': !isInline,
              })}
              src={`data:image/png;base64,${content}`}
              alt={title}
            />
          </picture>

          {!isInline && (
            <>
              {effectiveDocId && (
                <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground doc-id-display">
                  <span>Image ID: {effectiveDocId}</span>
                  <button
                    onClick={() => copyIdToClipboard(effectiveDocId)}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                    title="Copy ID to clipboard"
                  >
                    <CopyIcon size={14} />
                  </button>
                </div>
              )}

              {onSaveContent && (
                <button
                  onClick={handleUploadClick}
                  className="mt-4 flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                >
                  <UploadIcon size={16} />
                  Upload New Image
                </button>
              )}
            </>
          )}
        </div>
      ) : (
        <div
          className={cn(
            'flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-10 transition-colors cursor-pointer',
            {
              'border-primary bg-primary/5': isDragging,
              'border-border hover:border-primary/50 hover:bg-primary/5':
                !isDragging,
            },
          )}
          onClick={handleUploadClick}
        >
          <UploadIcon size={24} className="mb-3 text-muted-foreground" />
          <p className="text-sm text-muted-foreground mb-1">
            Drag and drop an image here or click to browse
          </p>
          <p className="text-xs text-muted-foreground">
            Supports JPG, PNG, GIF, etc.
          </p>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
