# File Upload Quick Start Guide

This guide shows you how to use the file upload functionality in Fumi for models that require file inputs (like Flux.1 Pro Kontext).

## 🚀 Quick Start

### 1. Environment Setup

Add your Fal.ai API key to `.env.local`:

```env
FAL_KEY=your_fal_api_key_here
```

### 2. Access the Demo

Visit `/file-upload-demo` to see the file upload functionality in action.

### 3. Try with Flux.1 Pro Kontext

1. Go to the main interface
2. Select "Flux.1 Pro Kontext" from the model dropdown
3. You'll see a file upload field instead of a text input for the reference image
4. Upload an image - it will be automatically uploaded to Fal storage
5. The resulting URL will be used in your model request

## 🎯 Three Upload Approaches

### 1. Enhanced FileField (Integrated)
- **Best for**: Forms that need file uploads
- **Usage**: Automatically used in model forms
- **Features**: Drag-and-drop, progress tracking, validation

### 2. Drag & Drop Component
- **Best for**: Custom implementations
- **Usage**: `<DragDropFileUpload />`
- **Features**: Clean UI, highly customizable

### 3. Image Preview Component
- **Best for**: Image galleries and multiple uploads
- **Usage**: `<ImageUploadPreview />`
- **Features**: Live previews, grid layout

## 📝 Code Examples

### Basic File Upload

```tsx
import { FileField } from '@/components/form-fields/FileField';

const config = {
  id: 'image-upload',
  label: 'Upload Image',
  type: 'image',
  uploadToStorage: true,
  multiple: false,
  maxSize: 10 * 1024 * 1024 // 10MB
};

<FileField
  config={config}
  value={imageUrl}
  onChange={setImageUrl}
/>
```

### Drag & Drop Upload

```tsx
import { DragDropFileUpload } from '@/components/DragDropFileUpload';

<DragDropFileUpload
  accept="image/*"
  maxSize={10 * 1024 * 1024}
  uploadToStorage={true}
  onFilesChange={(files) => console.log('Uploaded:', files)}
  placeholder="Drop images here"
/>
```

### Image Gallery Upload

```tsx
import { ImageUploadPreview } from '@/components/ImageUploadPreview';

<ImageUploadPreview
  accept="image/*"
  maxSize={5 * 1024 * 1024}
  multiple={true}
  maxImages={6}
  uploadToStorage={true}
  onImagesChange={(images) => console.log('Images:', images)}
/>
```

## 🔧 Configuration Options

### FileFieldConfig

```typescript
interface FileFieldConfig {
  id: string;
  label: string;
  type: 'file' | 'image' | 'audio' | 'video';
  accept?: string;                    // File types to accept
  maxSize?: number;                   // Max file size in bytes
  multiple?: boolean;                 // Allow multiple files
  uploadToStorage?: boolean;          // Upload to Fal storage
  uploadOptions?: {
    onProgress?: (progress) => void;  // Progress callback
    filename?: string;                // Custom filename
  };
}
```

### Upload Progress

```typescript
interface UploadProgress {
  progress: number;                   // 0-100
  status: 'uploading' | 'completed' | 'error';
  error?: string;                     // Error message if failed
}
```

## 🎨 UI Features

- **Drag & Drop**: All components support drag-and-drop from computer/mobile
- **Progress Tracking**: Real-time upload progress with visual indicators
- **File Validation**: Size limits, type checking, and error handling
- **Preview Support**: Image previews, file type icons, and metadata
- **Mobile Friendly**: Touch-friendly interface for mobile devices
- **Error Handling**: Clear error messages and recovery options

## 🔗 Integration with Models

The file upload system automatically integrates with model forms:

1. **Model Detection**: Form generator detects when models need file inputs
2. **Component Selection**: Appropriate upload component is chosen based on field type
3. **Storage Upload**: Files are uploaded to Fal.ai storage service
4. **URL Conversion**: Hosted URLs are returned for model consumption
5. **Form Submission**: URLs are included in model requests

## 🐛 Troubleshooting

### Common Issues

1. **Upload fails**: Check your Fal.ai API key
2. **File too large**: Verify maxSize configuration
3. **Wrong file type**: Check accept configuration
4. **Progress not updating**: Ensure onProgress callback is provided

### Debug Mode

Enable debug logging:

```typescript
uploadOptions: {
  onProgress: (progress) => {
    console.log('Upload progress:', progress);
  }
}
```

## 📚 Further Reading

- [Complete Implementation Guide](./FILE_STORAGE_IMPLEMENTATION.md)
- [API Reference](./FILE_STORAGE_IMPLEMENTATION.md#api-reference)
- [Troubleshooting Guide](./FILE_STORAGE_IMPLEMENTATION.md#troubleshooting)

## 🎯 Next Steps

1. Try the live demo at `/file-upload-demo`
2. Test with different models that require file inputs
3. Customize the upload components for your needs
4. Integrate with your own models and workflows
