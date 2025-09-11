# File Storage Implementation with Fal.ai

This document outlines the implementation of file storage functionality using Fal.ai's storage service. The implementation provides three different approaches for file uploads, each suited for different use cases.

## Overview

The file storage system integrates with Fal.ai's storage service to handle file uploads, providing hosted URLs that can be used with Fal.ai models that require file inputs. The implementation includes drag-and-drop functionality, progress tracking, and file validation.

## Architecture

### Core Components

1. **FalStorageService** (`src/services/fal-storage.ts`)
   - Singleton service for handling file uploads to Fal storage
   - Supports single and multiple file uploads
   - Includes progress tracking and error handling
   - File validation and type checking

2. **Enhanced FileField** (`src/components/form-fields/FileField.tsx`)
   - Extended existing FileField component with Fal storage integration
   - Maintains backward compatibility
   - Supports both direct file handling and storage uploads

3. **DragDropFileUpload** (`src/components/DragDropFileUpload.tsx`)
   - Dedicated drag-and-drop component
   - Highly customizable and reusable
   - Focused on user experience

4. **ImageUploadPreview** (`src/components/ImageUploadPreview.tsx`)
   - Specialized for image uploads
   - Live previews with grid layout
   - Perfect for image galleries

## Implementation Approaches

### Approach 1: Enhanced FileField Component

**Best for:** Forms that need file uploads with minimal changes to existing code.

```tsx
const fileConfig: FileFieldConfig = {
  id: 'image-upload',
  label: 'Upload Image',
  type: 'image',
  uploadToStorage: true,
  multiple: true,
  maxSize: 5 * 1024 * 1024, // 5MB
  uploadOptions: {
    onProgress: (progress) => console.log('Upload progress:', progress)
  }
};

<FileField
  config={fileConfig}
  value={files}
  onChange={setFiles}
/>
```

**Features:**
- Integrates with existing form system
- Minimal changes to current codebase
- Supports all file types
- Drag-and-drop functionality
- Progress tracking

### Approach 2: Drag & Drop Component

**Best for:** Dedicated upload interfaces and custom implementations.

```tsx
<DragDropFileUpload
  accept="image/*"
  maxSize={5 * 1024 * 1024}
  multiple={true}
  uploadToStorage={true}
  onFilesChange={handleFiles}
  onUploadProgress={handleProgress}
  placeholder="Drop images here or click to browse"
/>
```

**Features:**
- Focused on drag-and-drop experience
- Highly customizable
- Reusable across different contexts
- Clean, modern UI
- File type validation

### Approach 3: Image Preview Component

**Best for:** Image galleries, profile pictures, and image-heavy interfaces.

```tsx
<ImageUploadPreview
  accept="image/*"
  maxSize={5 * 1024 * 1024}
  multiple={true}
  maxImages={6}
  uploadToStorage={true}
  onImagesChange={handleImages}
  onUploadProgress={handleProgress}
/>
```

**Features:**
- Live image previews
- Grid layout for multiple images
- Upload progress per image
- Error handling per image
- Maximum image limits

## Configuration

### Environment Setup

1. Add your Fal.ai API key to `.env.local`:
```env
FAL_KEY=your_fal_api_key_here
```

2. The Fal client is automatically configured in `src/utils/fal.ts`:
```typescript
import { fal } from '@fal-ai/client';

if (typeof window !== 'undefined' && FAL_KEY) {
  fal.config({
    credentials: FAL_KEY
  });
}
```

### File Field Configuration

```typescript
interface FileFieldConfig extends BaseFieldConfig {
  type: 'file' | 'image' | 'audio' | 'video';
  accept?: string;
  maxSize?: number;
  multiple?: boolean;
  uploadToStorage?: boolean;
  uploadOptions?: {
    onProgress?: (progress: UploadProgress) => void;
    filename?: string;
  };
}
```

## Usage Examples

### Basic File Upload

```tsx
import { FileField } from '@/components/form-fields/FileField';

const [files, setFiles] = useState<File[] | string[]>([]);

const config: FileFieldConfig = {
  id: 'file-upload',
  label: 'Upload Files',
  type: 'file',
  uploadToStorage: true,
  multiple: true,
  maxSize: 10 * 1024 * 1024
};

<FileField
  config={config}
  value={files}
  onChange={setFiles}
/>
```

### Image Gallery Upload

```tsx
import { ImageUploadPreview } from '@/components/ImageUploadPreview';

const [images, setImages] = useState<string[]>([]);

<ImageUploadPreview
  accept="image/*"
  maxSize={5 * 1024 * 1024}
  multiple={true}
  maxImages={10}
  uploadToStorage={true}
  onImagesChange={setImages}
  onUploadProgress={(progress) => {
    console.log('Upload progress:', progress.progress);
  }}
/>
```

### Custom Drag & Drop

```tsx
import { DragDropFileUpload } from '@/components/DragDropFileUpload';

const handleFiles = (files: File[] | string[]) => {
  console.log('Files uploaded:', files);
};

<DragDropFileUpload
  accept="audio/*"
  maxSize={25 * 1024 * 1024}
  multiple={false}
  uploadToStorage={true}
  onFilesChange={handleFiles}
  placeholder="Drop audio files here"
/>
```

## Integration with Model Forms

The file storage system is automatically integrated with the model-to-form utility. When a model requires file inputs (like image URLs for image-to-video models), the form generator will create file upload fields instead of text input fields.

### Example Model Integration

For a model that requires an image URL:

```typescript
// Before: Text input for URL
{
  id: 'imageUrl',
  label: 'Image URL',
  type: 'text',
  placeholder: 'https://example.com/image.jpg'
}

// After: File upload with Fal storage
{
  id: 'imageUrl',
  label: 'Reference Image',
  type: 'image',
  uploadToStorage: true,
  uploadOptions: {
    onProgress: (progress) => console.log('Upload progress:', progress)
  }
}
```

## Error Handling

The system includes comprehensive error handling:

- **File size validation**: Prevents uploads exceeding specified limits
- **File type validation**: Ensures only allowed file types are uploaded
- **Upload errors**: Displays user-friendly error messages
- **Network errors**: Handles connection issues gracefully
- **Progress tracking**: Shows upload progress and status

## Performance Considerations

- **Parallel uploads**: Multiple files are uploaded simultaneously
- **Progress tracking**: Real-time progress updates for better UX
- **File validation**: Client-side validation before upload
- **Memory management**: Proper cleanup of object URLs
- **Abort controllers**: Ability to cancel ongoing uploads

## Security

- **API key protection**: Fal API key is server-side only
- **File validation**: Client-side validation before upload
- **Type checking**: Ensures only allowed file types
- **Size limits**: Prevents oversized file uploads

## Future Enhancements

Potential improvements for the file storage system:

1. **Resumable uploads**: Support for resuming interrupted uploads
2. **Batch operations**: Upload multiple files in a single request
3. **File compression**: Automatic image compression before upload
4. **Cloud storage integration**: Support for other storage providers
5. **Advanced previews**: Video thumbnails, audio waveforms
6. **Drag reordering**: Reorder uploaded files
7. **File metadata**: Display additional file information

## Troubleshooting

### Common Issues

1. **Upload fails**: Check API key configuration
2. **File too large**: Verify maxSize configuration
3. **Wrong file type**: Check accept configuration
4. **Progress not updating**: Ensure onProgress callback is provided

### Debug Mode

Enable debug logging by adding console.log statements in the upload progress callbacks:

```typescript
uploadOptions: {
  onProgress: (progress) => {
    console.log('Upload progress:', progress);
  }
}
```

## API Reference

### FalStorageService

```typescript
class FalStorageService {
  async uploadFile(file: File, options?: UploadOptions): Promise<FalUploadResult>
  async uploadFiles(files: File[], options?: UploadOptions): Promise<FalUploadResult[]>
  cancelUpload(uploadId: string): void
  cancelAllUploads(): void
}
```

### UploadProgress

```typescript
interface UploadProgress {
  progress: number; // 0-100
  status: 'uploading' | 'completed' | 'error';
  error?: string;
}
```

### FalUploadResult

```typescript
interface FalUploadResult {
  url: string;
  metadata: {
    filename: string;
    size: number;
    contentType: string;
    uploadedAt: string;
  };
}
```
