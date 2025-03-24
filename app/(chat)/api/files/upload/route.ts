import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { auth } from '@/app/(auth)/auth';
import { saveDocument } from '@/lib/db/queries';
import { ArtifactKind } from '@/components/artifact';

// Use Blob instead of File since File is not available in Node.js environment
const FileSchema = z.object({
  file: z
    .instanceof(Blob)
    .refine((file) => file.size <= 5 * 1024 * 1024, {
      message: 'File size should be less than 5MB',
    })
    // Update the file type based on the kind of files you want to accept
    .refine((file) => ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type), {
      message: 'File type should be JPEG, PNG, GIF, or WEBP',
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
    
    // Check for required fields
    if (!file || !id || !kind) {
      return NextResponse.json({ 
        error: 'Missing required fields (file, id, kind)' 
      }, { status: 400 });
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
    const base64Content = Buffer.from(fileBuffer).toString('base64');
    
    // Get filename from formData
    const filename = (formData.get('file') as File).name;
    
    try {
      // Save the file as a document
      await saveDocument({
        id,
        title: filename || 'Uploaded Image',
        content: base64Content,
        kind,
        userId: session.user.id,
      });
      
      // Also upload to Vercel Blob for redundancy
      const blobResponse = await put(`${id}-${filename}`, fileBuffer, {
        access: 'public',
      });

      return NextResponse.json({ 
        success: true, 
        documentId: id,
        url: blobResponse.url,
        pathname: filename,
        contentType: file.type,
        message: 'File uploaded and saved successfully' 
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
