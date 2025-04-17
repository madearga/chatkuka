import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { auth } from '@/app/(auth)/auth';
import { saveDocument } from '@/lib/db/queries';
import { ArtifactKind } from '@/components/artifact';
import { MAX_FILE_SIZE_BYTES, ALLOWED_MIME_TYPES } from '@/lib/constants';

// Use Blob instead of File since File is not available in Node.js environment
const FileSchema = z.object({
  file: z
    .instanceof(Blob)
    .refine((file) => file.size <= MAX_FILE_SIZE_BYTES, {
      message: `File size should be less than ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB`,
    })
    .refine((file) => ALLOWED_MIME_TYPES.includes(file.type), {
      message: `File type should be one of the following: ${ALLOWED_MIME_TYPES.join(', ')}`,
    }),
});

export async function POST(request: Request) {
  const session = await auth();

  if (!session || !session.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (request.body === null) {
    return new Response('Request body is empty', { status: 400 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as Blob;
    const id = formData.get('id') as string;
    const kind = formData.get('kind') as ArtifactKind;
    const chatId = formData.get('chatId') as string; // Add chat ID for message attachment

    // Check for required fields
    if (!file) {
      return NextResponse.json(
        {
          error: 'Missing required field: file',
        },
        { status: 400 },
      );
    }

    // Only require id and kind if we're saving as a document
    if ((!id || !kind) && !chatId) {
      return NextResponse.json(
        {
          error:
            'Missing required fields: either (id and kind) or chatId must be provided',
        },
        { status: 400 },
      );
    }

    const validatedFile = FileSchema.safeParse({ file });

    if (!validatedFile.success) {
      const errorMessage = validatedFile.error.errors
        .map((error) => error.message)
        .join(', ');

      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    // Convert file to base64 for storage
    const fileBuffer = await file.arrayBuffer();

    // Get filename from formData
    const filename = (formData.get('file') as File).name;

    try {
      // Upload to Vercel Blob
      const blobId = id || `chat-${chatId}-${Date.now()}`;
      const blobResponse = await put(`${blobId}-${filename}`, fileBuffer, {
        access: 'public',
      });

      // If it's a document artifact, save to document storage
      if (id && kind) {
        const base64Content = Buffer.from(fileBuffer).toString('base64');

        // Save the file as a document
        await saveDocument({
          id,
          title: filename || 'Uploaded File',
          content: base64Content,
          kind,
          userId: session.user.id,
        });
      }

      return NextResponse.json({
        success: true,
        documentId: id,
        url: blobResponse.url,
        pathname: filename,
        contentType: file.type,
        message: 'File uploaded successfully',
      });
    } catch (error) {
      console.error('Upload error:', error);
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }
  } catch (error) {
    console.error('Request processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 },
    );
  }
}
