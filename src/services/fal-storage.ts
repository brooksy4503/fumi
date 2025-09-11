/**
 * File upload result from Fal storage
 */
export interface FalUploadResult {
    /** The uploaded file URL */
    url: string;
    /** File metadata */
    metadata: {
        filename: string;
        size: number;
        contentType: string;
        uploadedAt: string;
    };
}

/**
 * File upload progress information
 */
export interface UploadProgress {
    /** Upload progress percentage (0-100) */
    progress: number;
    /** Current status */
    status: 'uploading' | 'completed' | 'error';
    /** Error message if status is 'error' */
    error?: string;
}

/**
 * File upload options
 */
export interface UploadOptions {
    /** Callback for upload progress */
    onProgress?: (progress: UploadProgress) => void;
    /** Maximum file size in bytes */
    maxSize?: number;
    /** Allowed file types */
    allowedTypes?: string[];
    /** Custom filename */
    filename?: string;
}

/**
 * Fal storage service for handling file uploads
 */
export class FalStorageService {
    private static instance: FalStorageService;
    private uploadQueue: Map<string, AbortController> = new Map();

    private constructor() { }

    static getInstance(): FalStorageService {
        if (!FalStorageService.instance) {
            FalStorageService.instance = new FalStorageService();
        }
        return FalStorageService.instance;
    }

    /**
     * Upload a single file to Fal storage via API route
     */
    async uploadFile(
        file: File,
        options: UploadOptions = {}
    ): Promise<FalUploadResult> {
        const { onProgress, maxSize, allowedTypes, filename } = options;

        // Validate file
        this.validateFile(file, { maxSize, allowedTypes });

        // Create abort controller for this upload
        const uploadId = `${Date.now()}-${Math.random()}`;
        const abortController = new AbortController();
        this.uploadQueue.set(uploadId, abortController);

        try {
            // Report upload start
            onProgress?.({
                progress: 0,
                status: 'uploading'
            });

            // Create form data
            const formData = new FormData();
            formData.append('file', file);

            // Upload file via API route
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
                signal: abortController.signal
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Upload failed with status ${response.status}`);
            }

            const result = await response.json();

            // Report completion
            onProgress?.({
                progress: 100,
                status: 'completed'
            });

            // Clean up
            this.uploadQueue.delete(uploadId);

            return {
                url: result.url,
                metadata: {
                    filename: filename || result.metadata.filename,
                    size: result.metadata.size,
                    contentType: result.metadata.contentType,
                    uploadedAt: result.metadata.uploadedAt
                }
            };
        } catch (error) {
            // Report error
            onProgress?.({
                progress: 0,
                status: 'error',
                error: error instanceof Error ? error.message : 'Upload failed'
            });

            // Clean up
            this.uploadQueue.delete(uploadId);

            throw error;
        }
    }

    /**
     * Upload multiple files to Fal storage
     */
    async uploadFiles(
        files: File[],
        options: UploadOptions = {}
    ): Promise<FalUploadResult[]> {
        const results: FalUploadResult[] = [];
        const errors: Error[] = [];

        // Upload files in parallel
        const uploadPromises = files.map(async (file, index) => {
            try {
                const result = await this.uploadFile(file, {
                    ...options,
                    onProgress: (progress) => {
                        // Adjust progress for multiple files
                        const adjustedProgress = (progress.progress / files.length) + (index * 100 / files.length);
                        options.onProgress?.({
                            ...progress,
                            progress: Math.min(adjustedProgress, 100)
                        });
                    }
                });
                results.push(result);
                return result;
            } catch (error) {
                errors.push(error instanceof Error ? error : new Error('Upload failed'));
                return null;
            }
        });

        await Promise.all(uploadPromises);

        if (errors.length > 0 && results.length === 0) {
            throw new Error(`All uploads failed: ${errors.map(e => e.message).join(', ')}`);
        }

        return results;
    }

    /**
     * Cancel an ongoing upload
     */
    cancelUpload(uploadId: string): void {
        const controller = this.uploadQueue.get(uploadId);
        if (controller) {
            controller.abort();
            this.uploadQueue.delete(uploadId);
        }
    }

    /**
     * Cancel all ongoing uploads
     */
    cancelAllUploads(): void {
        this.uploadQueue.forEach(controller => controller.abort());
        this.uploadQueue.clear();
    }

    /**
     * Validate file before upload
     */
    private validateFile(
        file: File,
        options: { maxSize?: number; allowedTypes?: string[] } = {}
    ): void {
        const { maxSize, allowedTypes } = options;

        // Check file size
        if (maxSize && file.size > maxSize) {
            throw new Error(`File size exceeds maximum allowed size of ${this.formatFileSize(maxSize)}`);
        }

        // Check file type
        if (allowedTypes && allowedTypes.length > 0) {
            const fileType = file.type;
            const isAllowed = allowedTypes.some(type => {
                if (type.endsWith('/*')) {
                    return fileType.startsWith(type.slice(0, -1));
                }
                return fileType === type;
            });

            if (!isAllowed) {
                throw new Error(`File type ${fileType} is not allowed. Allowed types: ${allowedTypes.join(', ')}`);
            }
        }
    }

    /**
     * Format file size in human-readable format
     */
    private formatFileSize(bytes: number): string {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Get file type category from MIME type
     */
    getFileTypeCategory(mimeType: string): 'image' | 'video' | 'audio' | 'document' | 'other' {
        if (mimeType.startsWith('image/')) return 'image';
        if (mimeType.startsWith('video/')) return 'video';
        if (mimeType.startsWith('audio/')) return 'audio';
        if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text')) return 'document';
        return 'other';
    }

    /**
     * Check if file type is supported for preview
     */
    isPreviewable(mimeType: string): boolean {
        const category = this.getFileTypeCategory(mimeType);
        return ['image', 'video', 'audio'].includes(category);
    }
}

// Export singleton instance
export const falStorage = FalStorageService.getInstance();
