"use client";

import { useState, useRef, useCallback, useEffect, DragEvent } from 'react';
import { falStorage, FalUploadResult, UploadProgress } from '@/services/fal-storage';

interface DragDropFileUploadProps {
  /** Accepted file types */
  accept?: string;
  /** Maximum file size in bytes */
  maxSize?: number;
  /** Allow multiple files */
  multiple?: boolean;
  /** Whether to upload files to Fal storage */
  uploadToStorage?: boolean;
  /** Callback when files are selected/uploaded */
  onFilesChange: (files: File[] | string[] | File | string | (File | string)[]) => void;
  /** Callback for upload progress */
  onUploadProgress?: (progress: UploadProgress) => void;
  /** Custom className */
  className?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Placeholder text */
  placeholder?: string;
  /** Current value (for controlled component) */
  value?: File[] | string[] | File | string | null;
}

export default function DragDropFileUpload({
  accept,
  maxSize,
  multiple = false,
  uploadToStorage = false,
  onFilesChange,
  onUploadProgress,
  className = '',
  disabled = false,
  placeholder = 'Drop files here or click to browse',
  value
}: DragDropFileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<(File | string)[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync uploadedFiles with value prop
  useEffect(() => {
    if (value !== undefined) {
      if (Array.isArray(value)) {
        setUploadedFiles(value);
      } else if (value !== null) {
        setUploadedFiles([value]);
      } else {
        setUploadedFiles([]);
      }
    }
  }, [value]);

  const handleDrag = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFiles(files);
    }
  }, [disabled]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFiles(files);
    }
  }, []);

  const handleFiles = useCallback(async (files: File[]) => {
    if (disabled) return;

    // Validate files
    if (maxSize) {
      const oversizedFiles = files.filter(file => file.size > maxSize);
      if (oversizedFiles.length > 0) {
        setUploadError(`File size exceeds maximum allowed size of ${formatFileSize(maxSize)}`);
        return;
      }
    }

    if (!multiple && files.length > 1) {
      setUploadError('Only one file is allowed');
      return;
    }

    setUploadError(null);

    // If uploadToStorage is enabled, upload files to Fal storage
    if (uploadToStorage) {
      setUploading(true);
      setUploadProgress(0);

      try {
        const uploadOptions = {
          maxSize,
          allowedTypes: accept ? accept.split(',').map(type => type.trim()) : undefined,
          onProgress: (progress: UploadProgress) => {
            setUploadProgress(progress.progress);
            onUploadProgress?.(progress);
          }
        };

        const results = await falStorage.uploadFiles(files, uploadOptions);
        const urls = results.map(result => result.url);
        
        // Update uploaded files state
        if (multiple) {
          setUploadedFiles(prev => [...prev, ...urls]);
        } else {
          setUploadedFiles([urls[0]]);
        }
        
        onFilesChange(multiple ? urls : urls[0]);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Upload failed';
        setUploadError(errorMessage);
        onUploadProgress?.({
          progress: 0,
          status: 'error',
          error: errorMessage
        });
      } finally {
        setUploading(false);
      }
    } else {
      // Direct file handling without upload
      if (multiple) {
        setUploadedFiles(prev => [...prev, ...files]);
      } else {
        setUploadedFiles([files[0]]);
      }
      onFilesChange(multiple ? files : files[0]);
    }
  }, [disabled, maxSize, multiple, uploadToStorage, accept, onFilesChange, onUploadProgress]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileTypeDescription = () => {
    if (!accept) return 'Any file type';
    
    const types = accept.split(',').map(type => type.trim());
    if (types.includes('image/*')) return 'Images (PNG, JPG, GIF, etc.)';
    if (types.includes('video/*')) return 'Videos (MP4, WebM, etc.)';
    if (types.includes('audio/*')) return 'Audio (MP3, WAV, etc.)';
    return `Files (${types.join(', ')})`;
  };

  const removeFile = (index: number) => {
    const newFiles = uploadedFiles.filter((_, i) => i !== index);
    setUploadedFiles(newFiles);
    if (multiple) {
      onFilesChange(newFiles);
    } else {
      onFilesChange(newFiles[0] || '');
    }
  };

  const renderFilePreview = (file: File | string, index: number) => {
    const isUrl = typeof file === 'string';
    const fileName = isUrl ? file.split('/').pop() || 'Unknown' : (file as File).name;
    const fileSize = isUrl ? 'Uploaded' : formatFileSize((file as File).size);
    const fileType = isUrl ? 'url' : (file as File).type;
    
    const isImage = fileType.startsWith('image/');
    const isVideo = fileType.startsWith('video/');
    const isAudio = fileType.startsWith('audio/');

    return (
      <div key={index} className="flex items-center justify-between p-3 rounded-lg border bg-card text-card-foreground">
        <div className="flex items-center space-x-3">
          {isImage && (
            <img
              src={isUrl ? file : URL.createObjectURL(file as File)}
              alt={fileName}
              className="w-12 h-12 object-cover rounded"
              onLoad={(e) => {
                if (!isUrl) {
                  URL.revokeObjectURL((e.target as HTMLImageElement).src);
                }
              }}
            />
          )}
          {isVideo && <div className="w-12 h-12 rounded flex items-center justify-center bg-secondary text-secondary-foreground text-lg">🎥</div>}
          {isAudio && <div className="w-12 h-12 rounded flex items-center justify-center bg-secondary text-secondary-foreground text-lg">🎵</div>}
          {!isImage && !isVideo && !isAudio && (
            <div className="w-12 h-12 rounded flex items-center justify-center bg-secondary text-secondary-foreground text-lg">📄</div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{fileName}</p>
            <p className="text-xs text-muted-foreground">{fileSize}</p>
            {isUrl && (
              <p className="text-xs text-muted-foreground truncate">URL: {file}</p>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => removeFile(index)}
          className="text-destructive hover:text-destructive/80 p-1 rounded hover:bg-destructive/10 transition-colors"
          title="Remove file"
        >
          ✕
        </button>
      </div>
    );
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
          dragActive
            ? 'border-primary/60 bg-accent/30 scale-[1.02]'
            : uploadError
            ? 'border-destructive/50 bg-destructive/10'
            : disabled
            ? 'border-muted bg-muted/30 cursor-not-allowed'
            : 'border-input hover:border-foreground/40 cursor-pointer'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !disabled && !uploading && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept={accept}
          multiple={multiple}
          onChange={handleFileInput}
          disabled={disabled || uploading}
        />

        <div className="space-y-4">
          <div className="text-muted-foreground">
            <svg 
              className={`mx-auto h-16 w-16 ${uploading ? 'animate-pulse' : ''}`} 
              stroke="currentColor" 
              fill="none" 
              viewBox="0 0 48 48"
            >
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
              {uploading ? 'Uploading...' : placeholder}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {getFileTypeDescription()}
              {maxSize && ` • Max size: ${formatFileSize(maxSize)}`}
            </p>
          </div>
        </div>
      </div>

      {/* Upload Progress */}
      {uploading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Uploading files...</span>
            <span>{Math.round(uploadProgress)}%</span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Upload Error */}
      {uploadError && (
        <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
          <p className="text-sm text-destructive">{uploadError}</p>
        </div>
      )}

      {/* Uploaded Files Preview */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Uploaded Files ({uploadedFiles.length})</h4>
            {!multiple && uploadedFiles.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setUploadedFiles([]);
                  onFilesChange(multiple ? [] : '');
                }}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Clear all
              </button>
            )}
          </div>
          <div className="space-y-2">
            {uploadedFiles.map((file, index) => renderFilePreview(file, index))}
          </div>
        </div>
      )}
    </div>
  );
}
