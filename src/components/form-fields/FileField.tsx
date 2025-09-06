"use client";

import { useState, useRef } from 'react';
import { FileFieldConfig, FormFieldProps } from '@/types/form-fields';

interface FileFieldProps extends FormFieldProps {
  config: FileFieldConfig;
}

export default function FileField({ config, value, onChange, error, disabled }: FileFieldProps) {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const accept = config.accept || getAcceptString(config.type);
  const multiple = config.multiple || false;

  function getAcceptString(type: string): string {
    switch (type) {
      case 'image': return 'image/*';
      case 'audio': return 'audio/*';
      case 'video': return 'video/*';
      default: return '*/*';
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFiles(files);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFiles(files);
    }
  };

  const handleFiles = (files: File[]) => {
    if (config.maxSize) {
      const oversizedFiles = files.filter(file => file.size > config.maxSize!);
      if (oversizedFiles.length > 0) {
        // Handle error - files too large
        return;
      }
    }

    if (multiple) {
      const currentFiles = Array.isArray(value) ? value : [];
      onChange([...currentFiles, ...files]);
    } else {
      onChange(files[0]);
    }
  };

  const removeFile = (index: number) => {
    if (Array.isArray(value)) {
      const newFiles = value.filter((_, i) => i !== index);
      onChange(newFiles);
    } else {
      onChange(null);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const renderFilePreview = (file: File, index?: number) => {
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    const isAudio = file.type.startsWith('audio/');

    return (
      <div key={index} className="flex items-center justify-between p-2 rounded border bg-card text-card-foreground">
        <div className="flex items-center space-x-3">
          {isImage && (
            <img
              src={URL.createObjectURL(file)}
              alt={file.name}
              className="w-10 h-10 object-cover rounded"
              onLoad={(e) => URL.revokeObjectURL((e.target as HTMLImageElement).src)}
            />
          )}
          {isVideo && <div className="w-10 h-10 rounded flex items-center justify-center bg-secondary text-secondary-foreground">🎥</div>}
          {isAudio && <div className="w-10 h-10 rounded flex items-center justify-center bg-secondary text-secondary-foreground">🎵</div>}
          {!isImage && !isVideo && !isAudio && (
            <div className="w-10 h-10 rounded flex items-center justify-center bg-secondary text-secondary-foreground">📄</div>
          )}
          <div>
            <p className="text-sm font-medium">{file.name}</p>
            <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => removeFile(index !== undefined ? index : 0)}
          className="text-destructive hover:underline"
        >
          ✕
        </button>
      </div>
    );
  };

  const files = Array.isArray(value) ? value : value ? [value] : [];

  return (
    <div className="space-y-2">
      <label htmlFor={config.id} className="block text-sm font-medium">
        {config.label}
        {config.required && <span className="text-destructive ml-1">*</span>}
      </label>

      {config.description && (
        <p className="text-sm text-muted-foreground">{config.description}</p>
      )}

      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive
            ? 'border-primary/60 bg-accent/30'
            : error
            ? 'border-destructive/50 bg-destructive/10'
            : 'border-input hover:border-foreground/40'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          id={config.id}
          type="file"
          className="hidden"
          accept={accept}
          multiple={multiple}
          onChange={handleFileInput}
          disabled={disabled || config.disabled}
        />

        <div className="space-y-4">
          <div className="text-muted-foreground">
            <svg className="mx-auto h-12 w-12" stroke="currentColor" fill="none" viewBox="0 0 48 48">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          <div>
            <p className="text-lg font-medium">
              Drop files here, or{' '}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-primary hover:underline font-medium"
              >
                browse
              </button>
            </p>
            <p className="text-sm text-muted-foreground">
              {config.type === 'image' && 'PNG, JPG, GIF up to 10MB'}
              {config.type === 'video' && 'MP4, WebM up to 100MB'}
              {config.type === 'audio' && 'MP3, WAV up to 25MB'}
              {config.type === 'file' && 'Any file type'}
            </p>
          </div>
        </div>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">
            {files.length === 1 ? 'Selected file:' : 'Selected files:'}
          </p>
          {files.map((file, index) => renderFilePreview(file, multiple ? index : undefined))}
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}