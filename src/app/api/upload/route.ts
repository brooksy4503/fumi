import { NextRequest, NextResponse } from 'next/server';
import { fal } from '@fal-ai/client';
import { FAL_KEY } from '@/utils/fal';

// Configure FAL client with API key (server-side only)
if (FAL_KEY) {
    fal.config({
        credentials: FAL_KEY
    });
}

export async function POST(request: NextRequest) {
    try {
        if (!FAL_KEY) {
            console.error('FAL_KEY environment variable not found');
            return NextResponse.json(
                { error: 'FAL_KEY is not configured' },
                { status: 500 }
            );
        }

        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json(
                { error: 'No file provided' },
                { status: 400 }
            );
        }

        // Upload file to FAL storage
        const url = await fal.storage.upload(file);

        return NextResponse.json({
            url,
            metadata: {
                filename: file.name,
                size: file.size,
                contentType: file.type,
                uploadedAt: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('File upload error:', error);
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : 'Upload failed',
                details: error instanceof Error ? error.stack : undefined
            },
            { status: 500 }
        );
    }
}
