import { Artifact } from '@/components/create-artifact';
import { CopyIcon, RedoIcon, UndoIcon, UploadIcon } from '@/components/icons';
import { ImageEditor } from '@/components/image-editor';
import { toast } from 'sonner';
import { generateUUID } from '@/lib/utils';

export const imageArtifact = new Artifact({
  kind: 'image',
  description: 'Useful for image generation and editing',
  onStreamPart: ({ streamPart, setArtifact }) => {
    if (streamPart.type === 'image-delta') {
      setArtifact((draftArtifact) => ({
        ...draftArtifact,
        content: streamPart.content as string,
        isVisible: true,
        status: 'streaming',
      }));
    } else if (streamPart.type === 'info') {
      toast.info(streamPart.message);
    } else if (streamPart.type === 'error') {
      toast.error(streamPart.message);
    }
  },
  content: ImageEditor,
  actions: [
    {
      icon: <UndoIcon size={18} />,
      description: 'View Previous version',
      onClick: ({ handleVersionChange }) => {
        handleVersionChange('prev');
      },
      isDisabled: ({ currentVersionIndex }) => {
        if (currentVersionIndex === 0) {
          return true;
        }

        return false;
      },
    },
    {
      icon: <RedoIcon size={18} />,
      description: 'View Next version',
      onClick: ({ handleVersionChange }) => {
        handleVersionChange('next');
      },
      isDisabled: ({ isCurrentVersion }) => {
        if (isCurrentVersion) {
          return true;
        }

        return false;
      },
    },
    {
      icon: <UploadIcon size={18} />,
      description: 'Upload new image',
      onClick: async ({ handleVersionChange }) => {
        try {
          // Create a file input element
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'image/*';

          // Handle file selection
          input.onchange = async (e: Event) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;

            // Check if file is an image
            if (!file.type.startsWith('image/')) {
              toast.error('Please upload an image file');
              return;
            }

            try {
              const loadingToast = toast.loading('Uploading image...');

              // First convert file to base64 to immediately update UI
              const reader = new FileReader();
              reader.onload = async (e: ProgressEvent<FileReader>) => {
                const base64String = (e.target?.result as string).split(',')[1];

                // Now handle the upload to server
                const formData = new FormData();
                const docId = generateUUID();
                formData.append('file', file);
                formData.append('id', docId);
                formData.append('kind', 'image');

                // Upload the image
                const response = await fetch('/api/files/upload', {
                  method: 'POST',
                  body: formData,
                });

                toast.dismiss(loadingToast);

                // Parse response once
                const responseData = await response.json();

                if (!response.ok) {
                  throw new Error(
                    responseData.error || 'Failed to upload image',
                  );
                }

                // Use already parsed response data
                const uploadedDocId = responseData.documentId || docId;

                // Display the ID for easy reference
                toast.success(
                  `Image uploaded successfully. ID: ${uploadedDocId}`,
                );

                // Update the UI immediately with base64 image
                // Create a new image element for temporary display
                const img = document.createElement('img');
                img.src = `data:image/png;base64,${base64String}`;
                img.alt = 'Uploaded image';
                img.className = 'w-full h-fit max-w-[800px] p-0 md:p-20';

                // Add the ID for reference below the image
                const docIdDisplay = document.createElement('div');
                docIdDisplay.textContent = `Image ID: ${uploadedDocId}`;
                docIdDisplay.className = 'text-sm text-muted-foreground mt-2';

                // Find the container and replace the current image
                const imgContainer = document.querySelector(
                  '.image-editor-container picture',
                );
                if (imgContainer) {
                  // Clear current content and add new image
                  imgContainer.innerHTML = '';
                  imgContainer.appendChild(img);

                  // Add the ID display after the picture container
                  const parentContainer = imgContainer.parentElement;
                  if (parentContainer) {
                    // Check if we already have an ID display
                    const existingIdDisplay =
                      parentContainer.querySelector('.doc-id-display');
                    if (existingIdDisplay) {
                      existingIdDisplay.textContent = `Image ID: ${uploadedDocId}`;
                    } else {
                      docIdDisplay.className += ' doc-id-display';
                      parentContainer.appendChild(docIdDisplay);
                    }
                  }
                }

                // Store the document ID in local storage for later use
                localStorage.setItem('lastUploadedImageId', uploadedDocId);

                // Reload the artifact in background to ensure proper sync
                setTimeout(() => {
                  handleVersionChange('latest');
                }, 500);
              };

              reader.onerror = () => {
                toast.error('Failed to read image file');
              };

              reader.readAsDataURL(file);
            } catch (error) {
              console.error('Error uploading image:', error);
              toast.error('Failed to upload image');
            }
          };

          // Trigger file selection
          input.click();
        } catch (error) {
          console.error('Error initiating upload:', error);
          toast.error('Failed to initiate upload');
        }
      },
    },
    {
      icon: <CopyIcon size={18} />,
      description: 'Copy image to clipboard',
      onClick: ({ content }) => {
        const img = new Image();
        img.src = `data:image/png;base64,${content}`;

        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0);
          canvas.toBlob((blob) => {
            if (blob) {
              navigator.clipboard.write([
                new ClipboardItem({ 'image/png': blob }),
              ]);
            }
          }, 'image/png');
        };

        toast.success('Copied image to clipboard!');
      },
    },
  ],
  toolbar: [],
});
