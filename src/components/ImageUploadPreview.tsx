"use client";

import { useState, useRef, useCallback } from 'react';
import { falStorage, FalUploadResult, UploadProgress } from '@/services/fal-storage';

interface ImageUploadPreviewProps {
  /** Accepted image types */
  accept?: string;
  /** Maximum file size in bytes */
  maxSize?: number;
  /** Allow multiple images */
  multiple?: boolean;
  /** Whether to upload images to Fal storage */
  uploadToStorage?: boolean;
  /** Callback when images are selected/uploaded */
  onImagesChange: (images: File[] | string[] | File | string) => void;
  /** Callback for upload progress */
  onUploadProgress?: (progress: UploadProgress) => void;
  /** Custom className */
  className?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Maximum number of images */
  maxImages?: number;
}

interface ImagePreview {
  id: string;
  file?: File;
  url?: string;
  uploading?: boolean;
  error?: string;
}

export default function ImageUploadPreview({
  accept = 'image/*',
  maxSize = 10 * 1024 * 1024, // 10MB
  multiple = false,
  uploadToStorage = false,
  onImagesChange,
  onUploadProgress,
  className = '',
  disabled = false,
  maxImages = 5
}: ImageUploadPreviewProps) {
  const [previews, setPreviews] = useState<ImagePreview[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('image/')
    );
    
    if (files.length > 0) {
      handleFiles(files);
    }
  }, [disabled]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter(file => 
      file.type.startsWith('image/')
    );
    
    if (files.length > 0) {
      handleFiles(files);
    }
  }, []);

  const handleFiles = useCallback(async (files: File[]) => {
    if (disabled) return;

    // Check if adding these files would exceed the limit
    const currentCount = previews.length;
    const newCount = multiple ? files.length : 1;
    if (currentCount + newCount > maxImages) {
      return;
    }

    // Validate files
    const oversizedFiles = files.filter(file => file.size > maxSize);
    if (oversizedFiles.length > 0) {
      return;
    }

    if (!multiple && files.length > 1) {
      return;
    }

    // Create preview objects
    const newPreviews: ImagePreview[] = files.map(file => ({
      id: `${Date.now()}-${Math.random()}`,
      file,
      uploading: uploadToStorage
    }));

    setPreviews(prev => multiple ? [...prev, ...newPreviews] : newPreviews);

    // If uploadToStorage is enabled, upload files
    if (uploadToStorage) {
      try {
        const uploadOptions = {
          maxSize,
          allowedTypes: accept ? accept.split(',').map(type => type.trim()) : undefined,
          onProgress: (progress: UploadProgress) => {
            onUploadProgress?.(progress);
          }
        };

        const results = await falStorage.uploadFiles(files, uploadOptions);
        
        // Update previews with URLs
        setPreviews(prev => 
          prev.map((preview, index) => {
            if (newPreviews.some(np => np.id === preview.id)) {
              return {
                ...preview,
                url: results[index]?.url,
                uploading: false
              };
            }
            return preview;
          })
        );

        // Notify parent component
        const urls = results.map(result => result.url);
        onImagesChange(multiple ? urls : urls[0]);
      } catch (error) {
        // Update previews with error
        setPreviews(prev => 
          prev.map((preview, index) => {
            if (newPreviews.some(np => np.id === preview.id)) {
              return {
                ...preview,
                uploading: false,
                error: error instanceof Error ? error.message : 'Upload failed'
              };
            }
            return preview;
          })
        );
      }
    } else {
      // Direct file handling without upload
      onImagesChange(multiple ? files : files[0]);
    }
  }, [disabled, maxSize, multiple, uploadToStorage, accept, onImagesChange, onUploadProgress, previews.length, maxImages]);

  const removeImage = useCallback((id: string) => {
    setPreviews(prev => {
      const newPreviews = prev.filter(preview => preview.id !== id);
      
      // Notify parent component with remaining files/URLs
      const remainingFiles = newPreviews
        .filter(p => p.file)
        .map(p => p.file!);
      const remainingUrls = newPreviews
        .filter(p => p.url)
        .map(p => p.url!);
      
      if (uploadToStorage) {
        onImagesChange(multiple ? remainingUrls : remainingUrls[0]);
      } else {
        onImagesChange(multiple ? remainingFiles : remainingFiles[0]);
      }
      
      return newPreviews;
    });
  }, [multiple, uploadToStorage, onImagesChange]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 ${
          dragActive
            ? 'border-primary/60 bg-accent/30 scale-[1.02]'
            : disabled || previews.length >= maxImages
            ? 'border-muted bg-muted/30 cursor-not-allowed'
            : 'border-input hover:border-foreground/40 cursor-pointer'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !disabled && previews.length < maxImages && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept={accept}
          multiple={multiple}
          onChange={handleFileInput}
          disabled={disabled || previews.length >= maxImages}
        />

        <div className="space-y-3">
          <div className="text-muted-foreground">
            <svg className="mx-auto h-12 w-12" stroke="currentColor" fill="none" viewBox="0 0 48 48">
              <path 
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" 
                strokeWidth={2} 
                strokeLinecap="round" 
                strokeLinejoin="round" 
              />
            </svg>
          </div>

          <div>
            <p className="text-lg font-medium">
              {previews.length >= maxImages 
                ? 'Maximum images reached' 
                : 'Drop images here or click to browse'
              }
            </p>
            <p className="text-sm text-muted-foreground">
              Images (PNG, JPG, GIF, etc.) • Max size: {formatFileSize(maxSize)}
              {maxImages > 1 && ` • Max {maxImages} images`}
            </p>
          </div>
        </div>
      </div>

      {/* Image Previews */}
      {previews.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {previews.map((preview) => (
            <div key={preview.id} className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                {preview.file && !preview.url && (
                  <img
                    src={URL.createObjectURL(preview.file)}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onLoad={(e) => URL.revokeObjectURL((e.target as HTMLImageElement).src)}
                  />
                )}
                {preview.url && (
                  <img
                    src={preview.url}
                    alt="Uploaded"
                    className="w-full h-full object-cover"
                  />
                )}
                {preview.uploading && (
                  <div className="w-full h-full flex items-center justify-center bg-muted">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                )}
                {preview.error && (
                  <div className="w-full h-full flex items-center justify-center bg-destructive/10">
                    <div className="text-center p-2">
                      <p className="text-xs text-destructive">Error</p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Remove button */}
              <button
                type="button"
                onClick={() => removeImage(preview.id)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ×
              </button>

              {/* File info */}
              <div className="mt-2 text-xs text-muted-foreground">
                <p className="truncate">
                  {preview.file?.name || 'Uploaded image'}
                </p>
                {preview.file && (
                  <p>{formatFileSize(preview.file.size)}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
