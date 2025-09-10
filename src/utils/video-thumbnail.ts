/**
 * Utility functions for generating video thumbnails and previews
 */

/**
 * Generates a thumbnail URL from a video URL by creating a canvas element
 * and capturing the first frame of the video
 */
export async function generateVideoThumbnail(videoUrl: string): Promise<string | null> {
    return new Promise((resolve) => {
        try {
            const video = document.createElement('video');
            video.crossOrigin = 'anonymous';
            video.preload = 'metadata';

            video.onloadedmetadata = () => {
                // Seek to 1 second or 10% of duration, whichever is smaller
                const seekTime = Math.min(1, video.duration * 0.1);
                video.currentTime = seekTime;
            };

            video.onseeked = () => {
                try {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');

                    if (!ctx) {
                        resolve(null);
                        return;
                    }

                    // Set canvas dimensions to video dimensions
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;

                    // Draw the video frame to canvas
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

                    // Convert canvas to data URL
                    const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.8);
                    resolve(thumbnailUrl);
                } catch (error) {
                    console.error('Error generating video thumbnail:', error);
                    resolve(null);
                }
            };

            video.onerror = () => {
                console.error('Error loading video for thumbnail generation');
                resolve(null);
            };

            video.src = videoUrl;
        } catch (error) {
            console.error('Error creating video element for thumbnail:', error);
            resolve(null);
        }
    });
}

/**
 * Creates a video preview object with thumbnail URL
 */
export async function createVideoPreview(video: {
    url: string;
    width?: number;
    height?: number;
    duration?: number;
    fileSize?: number;
    contentType?: string;
}): Promise<{
    url: string;
    width?: number;
    height?: number;
    duration?: number;
    fileSize?: number;
    contentType?: string;
    thumbnailUrl?: string;
    type: 'video';
}> {
    const thumbnailUrl = await generateVideoThumbnail(video.url);

    return {
        ...video,
        thumbnailUrl: thumbnailUrl || undefined,
        type: 'video' as const
    };
}

/**
 * Fallback thumbnail URL for videos when thumbnail generation fails
 */
export function getVideoPlaceholderUrl(): string {
    // Return a data URL for a simple video icon placeholder
    return `data:image/svg+xml;base64,${btoa(`
    <svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="200" fill="#f3f4f6" stroke="#d1d5db" stroke-width="2"/>
      <polygon points="70,50 70,150 150,100" fill="#6b7280"/>
      <text x="100" y="180" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#6b7280">Video</text>
    </svg>
  `)}`;
}
