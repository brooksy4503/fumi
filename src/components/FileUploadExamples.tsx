"use client";

import { useState } from 'react';
import FileField from './form-fields/FileField';
import DragDropFileUpload from './DragDropFileUpload';
import ImageUploadPreview from './ImageUploadPreview';
import { FileFieldConfig } from '@/types/form-fields';
import { UploadProgress } from '@/services/fal-storage';

export default function FileUploadExamples() {
  const [basicFiles, setBasicFiles] = useState<File[] | string[]>([]);
  const [dragDropFiles, setDragDropFiles] = useState<File[] | string[]>([]);
  const [imagePreviews, setImagePreviews] = useState<File[] | string[]>([]);

  // Example 1: Basic FileField with Fal storage
  const basicFileConfig: FileFieldConfig = {
    id: 'basic-file',
    label: 'Basic File Upload',
    type: 'file',
    description: 'Upload any file type with Fal storage integration',
    uploadToStorage: true,
    multiple: true,
    maxSize: 10 * 1024 * 1024, // 10MB
    uploadOptions: {
      onProgress: (progress: UploadProgress) => {
        console.log('Basic upload progress:', progress);
      }
    }
  };

  // Example 2: Image-specific FileField
  const imageFileConfig: FileFieldConfig = {
    id: 'image-file',
    label: 'Image Upload',
    type: 'image',
    description: 'Upload images with preview and Fal storage',
    uploadToStorage: true,
    multiple: true,
    accept: 'image/*',
    maxSize: 5 * 1024 * 1024, // 5MB
    uploadOptions: {
      onProgress: (progress: UploadProgress) => {
        console.log('Image upload progress:', progress);
      }
    }
  };

  // Example 3: Audio FileField
  const audioFileConfig: FileFieldConfig = {
    id: 'audio-file',
    label: 'Audio Upload',
    type: 'audio',
    description: 'Upload audio files for processing',
    uploadToStorage: true,
    accept: 'audio/*',
    maxSize: 25 * 1024 * 1024, // 25MB
    uploadOptions: {
      onProgress: (progress: UploadProgress) => {
        console.log('Audio upload progress:', progress);
      }
    }
  };

  const handleUploadProgress = (type: string) => (progress: UploadProgress) => {
    console.log(`${type} upload progress:`, progress);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">File Upload Examples</h1>
        <p className="text-muted-foreground">
          Three different approaches to file upload with Fal storage integration
        </p>
      </div>

      {/* Approach 1: Enhanced FileField Component */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Approach 1: Enhanced FileField Component</h2>
        <p className="text-muted-foreground">
          Uses the existing FileField component with added Fal storage integration.
          Supports drag-and-drop, file validation, and progress tracking.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <h3 className="font-medium">Basic Files</h3>
            <FileField
              config={basicFileConfig}
              value={basicFiles}
              onChange={setBasicFiles}
            />
          </div>
          
          <div className="space-y-2">
            <h3 className="font-medium">Images</h3>
            <FileField
              config={imageFileConfig}
              value={[]}
              onChange={() => {}}
            />
          </div>
          
          <div className="space-y-2">
            <h3 className="font-medium">Audio</h3>
            <FileField
              config={audioFileConfig}
              value={[]}
              onChange={() => {}}
            />
          </div>
        </div>
      </section>

      {/* Approach 2: Dedicated Drag & Drop Component */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Approach 2: Dedicated Drag & Drop Component</h2>
        <p className="text-muted-foreground">
          A specialized component focused on drag-and-drop functionality with Fal storage.
          More customizable and reusable across different contexts.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <h3 className="font-medium">Any File Type</h3>
            <DragDropFileUpload
              accept="*/*"
              maxSize={10 * 1024 * 1024}
              multiple={true}
              uploadToStorage={true}
              onFilesChange={setDragDropFiles}
              onUploadProgress={handleUploadProgress('Drag & Drop')}
              placeholder="Drop any files here or click to browse"
            />
          </div>
          
          <div className="space-y-2">
            <h3 className="font-medium">Images Only</h3>
            <DragDropFileUpload
              accept="image/*"
              maxSize={5 * 1024 * 1024}
              multiple={true}
              uploadToStorage={true}
              onFilesChange={() => {}}
              onUploadProgress={handleUploadProgress('Image Drag & Drop')}
              placeholder="Drop images here or click to browse"
            />
          </div>
        </div>
      </section>

      {/* Approach 3: Image Preview Component */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Approach 3: Image Preview Component</h2>
        <p className="text-muted-foreground">
          A specialized component for image uploads with live previews and grid layout.
          Perfect for image galleries, profile pictures, or any image-heavy interface.
        </p>
        
        <div className="space-y-2">
          <h3 className="font-medium">Image Gallery Upload</h3>
          <ImageUploadPreview
            accept="image/*"
            maxSize={5 * 1024 * 1024}
            multiple={true}
            maxImages={6}
            uploadToStorage={true}
            onImagesChange={setImagePreviews}
            onUploadProgress={handleUploadProgress('Image Preview')}
          />
        </div>
      </section>

      {/* Results Display */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Upload Results</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <h3 className="font-medium">Basic Files ({basicFiles.length})</h3>
            <div className="text-sm text-muted-foreground">
              {basicFiles.length > 0 ? (
                <ul className="space-y-1">
                  {basicFiles.map((file, index) => (
                    <li key={index} className="truncate">
                      {typeof file === 'string' ? `URL: ${file}` : file.name}
                    </li>
                  ))}
                </ul>
              ) : (
                'No files uploaded'
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-medium">Drag & Drop Files ({dragDropFiles.length})</h3>
            <div className="text-sm text-muted-foreground">
              {dragDropFiles.length > 0 ? (
                <ul className="space-y-1">
                  {dragDropFiles.map((file, index) => (
                    <li key={index} className="truncate">
                      {typeof file === 'string' ? `URL: ${file}` : file.name}
                    </li>
                  ))}
                </ul>
              ) : (
                'No files uploaded'
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-medium">Image Previews ({imagePreviews.length})</h3>
            <div className="text-sm text-muted-foreground">
              {imagePreviews.length > 0 ? (
                <ul className="space-y-1">
                  {imagePreviews.map((file, index) => (
                    <li key={index} className="truncate">
                      {typeof file === 'string' ? `URL: ${file}` : file.name}
                    </li>
                  ))}
                </ul>
              ) : (
                'No images uploaded'
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Implementation Notes */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Implementation Notes</h2>
        <div className="bg-muted/50 rounded-lg p-4 space-y-3">
          <div>
            <h3 className="font-medium">Approach 1: Enhanced FileField</h3>
            <p className="text-sm text-muted-foreground">
              • Integrates with existing form system<br/>
              • Minimal changes to current codebase<br/>
              • Good for forms that need file uploads
            </p>
          </div>
          
          <div>
            <h3 className="font-medium">Approach 2: Drag & Drop Component</h3>
            <p className="text-sm text-muted-foreground">
              • Focused on drag-and-drop experience<br/>
              • Highly customizable and reusable<br/>
              • Good for dedicated upload interfaces
            </p>
          </div>
          
          <div>
            <h3 className="font-medium">Approach 3: Image Preview Component</h3>
            <p className="text-sm text-muted-foreground">
              • Specialized for image uploads<br/>
              • Live previews and grid layout<br/>
              • Perfect for image galleries and media management
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
