# Dynamic Form System for Fumi Models

A comprehensive React component library for creating dynamic forms that adapt to different AI model types. This system automatically generates appropriate input fields based on model requirements and capabilities.

## Overview

The dynamic form system consists of several key components:

- **Reusable Input Components**: Individual form field components for different input types
- **Dynamic Form Renderer**: Orchestrates form rendering and state management
- **Model-to-Form Converter**: Translates model metadata into form configurations
- **Form Validation**: Integrates with existing model validation logic
- **FumiModelForm**: Main component that ties everything together

## Components

### FumiModelForm

The main component for generating forms based on AI models.

```tsx
import { FumiModelForm } from '@/components/dynamic-forms';
import { getModel } from '@/registry/model-registry';

const model = getModel('stable-diffusion-xl-1.0');

function MyComponent() {
  const handleSubmit = async (modelInput) => {
    // Send to your API
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ modelId: model.id, input: modelInput })
    });
    const result = await response.json();
    console.log('Generated:', result);
  };

  return (
    <FumiModelForm
      model={model}
      onSubmit={handleSubmit}
      showModelInfo={true}
    />
  );
}
```

#### Props

- `model`: ModelMetadata - The model to generate a form for
- `onSubmit`: (modelInput: any) => void - Callback when form is submitted
- `onChange?`: (data: FormData, errors: FormErrors) => void - Optional change callback
- `disabled?`: boolean - Whether the form is disabled
- `className?`: string - Additional CSS classes
- `showModelInfo?`: boolean - Whether to show model information header

### DynamicForm

Lower-level component for rendering custom form configurations.

```tsx
import { DynamicForm } from '@/components/dynamic-forms';

const formConfig = {
  id: 'my-form',
  title: 'My Custom Form',
  sections: [
    {
      id: 'basic',
      title: 'Basic Information',
      fields: [
        {
          id: 'name',
          label: 'Name',
          type: 'text',
          required: true
        },
        {
          id: 'email',
          label: 'Email',
          type: 'text',
          validation: { pattern: '^[^@]+@[^@]+$' }
        }
      ]
    }
  ]
};

function MyComponent() {
  const handleSubmit = (formData) => {
    console.log('Form submitted:', formData);
  };

  return (
    <DynamicForm
      config={formConfig}
      onSubmit={handleSubmit}
    />
  );
}
```

## Supported Input Types

### Text Inputs
- `text`: Single-line text input
- `textarea`: Multi-line text input

```tsx
{
  id: 'prompt',
  label: 'Prompt',
  type: 'textarea',
  required: true,
  placeholder: 'Describe what you want to generate...',
  validation: { maxLength: 1000 }
}
```

### Number Inputs
- `number`: Standard number input
- `slider`: Range slider input

```tsx
{
  id: 'width',
  label: 'Width',
  type: 'number',
  min: 256,
  max: 2048,
  step: 64,
  unit: 'px',
  defaultValue: 1024
}
```

### Selection Inputs
- `select`: Dropdown selection
- `multiselect`: Multiple selection with checkboxes

```tsx
{
  id: 'style',
  label: 'Style',
  type: 'select',
  options: [
    { value: 'realistic', label: 'Realistic' },
    { value: 'anime', label: 'Anime' },
    { value: 'artistic', label: 'Artistic' }
  ]
}
```

### File Inputs
- `file`: Generic file upload
- `image`: Image file upload
- `audio`: Audio file upload
- `video`: Video file upload

```tsx
{
  id: 'audio',
  label: 'Audio File',
  type: 'audio',
  required: true,
  accept: '.mp3,.wav,.flac',
  maxSize: 25 * 1024 * 1024 // 25MB
}
```

### Boolean Input
- `boolean`: Checkbox input

```tsx
{
  id: 'includeTimestamps',
  label: 'Include Timestamps',
  type: 'boolean',
  description: 'Include timestamps for each word'
}
```

## Form Configuration

### FormConfig Structure

```tsx
interface FormConfig {
  id: string;                    // Unique form identifier
  title?: string;               // Form title
  description?: string;         // Form description
  sections: FormSection[];      // Form sections
  validation?: {               // Form-level validation
    custom?: (values: Record<string, any>) => string | null;
  };
}
```

### FormSection Structure

```tsx
interface FormSection {
  id: string;                   // Unique section identifier
  title?: string;              // Section title
  description?: string;        // Section description
  fields: FieldConfig[];       // Fields in this section
  collapsible?: boolean;       // Whether section can be collapsed
  collapsed?: boolean;         // Whether section starts collapsed
}
```

### FieldConfig Structure

```tsx
interface BaseFieldConfig {
  id: string;                  // Unique field identifier
  label: string;               // Human-readable label
  type: FieldType;             // Input type
  description?: string;        // Help text
  required?: boolean;          // Whether field is required
  disabled?: boolean;          // Whether field is disabled
  placeholder?: string;        // Placeholder text
  defaultValue?: any;          // Default value
  validation?: {               // Validation rules
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    custom?: (value: any) => string | null;
  };
}
```

## Model Integration

The system automatically converts model metadata into form configurations:

### Image Generation Models
- Prompt and negative prompt textareas
- Dimension controls (width/height)
- Aspect ratio selection
- Style selection
- Output format selection
- Advanced settings (seed, number of images, etc.)

### Video Generation Models
- Text prompts
- Duration selection
- Video dimensions and FPS
- Aspect ratio controls
- Motion settings

### Text-to-Speech Models
- Text input
- Voice selection
- Speed controls
- Language selection

### Speech-to-Text Models
- Audio file upload
- Language selection
- Timestamps and diarization options

### Audio Generation Models
- Text description
- Duration controls
- Sample rate selection
- Genre selection

## Validation

The form system includes comprehensive validation:

### Field-level Validation
- Required field validation
- Type-specific validation (min/max, length, patterns)
- Custom validation functions
- File size validation

### Model-level Validation
- Integrates with existing model validation logic
- Converts form data to model input format
- Validates against model requirements and limits

### Form-level Validation
- Cross-field validation
- Custom form validation functions

## Utilities

### Model-to-Form Conversion

```tsx
import { modelToFormConfig } from '@/utils/model-to-form';

const model = getModel('stable-diffusion-xl-1.0');
const formConfig = modelToFormConfig(model);
```

### Form Validation

```tsx
import { validateFormData, getFormDefaults } from '@/utils/form-validation';

const validation = validateFormData(formData, model);
if (validation.isValid) {
  // Form is valid, proceed with submission
} else {
  console.log('Validation errors:', validation.errors);
}

const defaults = getFormDefaults(model);
// Use defaults to pre-populate form
```

### Form Data Conversion

```tsx
import { formDataToModelInput } from '@/utils/form-validation';

const modelInput = formDataToModelInput(formData, model);
// This converts form field names to model API format
// e.g., 'negativePrompt' -> 'negative_prompt'
```

## Styling

The components use Tailwind CSS classes for styling. You can customize the appearance by:

1. Passing custom `className` props
2. Overriding Tailwind classes in your CSS
3. Creating custom field components

## Error Handling

The system provides comprehensive error handling:

- Field-level validation errors
- Form submission errors
- File upload errors
- Model validation errors

Errors are displayed inline with form fields and in alert banners for form-level issues.

## Example Usage

Here's a complete example of using the dynamic form system:

```tsx
'use client';

import { useState } from 'react';
import { FumiModelForm } from '@/components/dynamic-forms';
import { getModel } from '@/registry/model-registry';

export default function ImageGenerator() {
  const [model] = useState(() => getModel('stable-diffusion-xl-1.0'));
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (modelInput) => {
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelId: model.id,
          input: modelInput
        })
      });

      if (!response.ok) {
        throw new Error('Generation failed');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">AI Image Generator</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <FumiModelForm
            model={model}
            onSubmit={handleSubmit}
            showModelInfo={true}
          />
        </div>

        <div>
          {error && (
            <div className="p-4 bg-red-50 border-l-4 border-red-500 mb-6">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {result && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Generated Images</h2>
              {result.data?.images?.map((image, index) => (
                <img
                  key={index}
                  src={image.url}
                  alt={`Generated image ${index + 1}`}
                  className="w-full rounded-lg shadow-lg mb-4"
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

## API Integration

The form system is designed to work seamlessly with your existing API endpoints. The `onSubmit` callback receives model input in the format expected by the API for the specific model type.

Form field names are automatically converted to the snake_case format expected by most models (e.g., `negativePrompt` → `negative_prompt`).

## Best Practices

1. **Model Selection**: Always validate that the model exists before creating forms
2. **Error Handling**: Implement proper error handling in your `onSubmit` callback
3. **Loading States**: Show loading indicators during form submission
4. **File Uploads**: Validate file sizes and types before submission
5. **Form Validation**: Use the built-in validation but also validate on your backend
6. **Accessibility**: The components include proper labels and ARIA attributes

## Migration from Static Forms

If you're migrating from static forms:

1. Replace your static form JSX with `FumiModelForm`
2. Remove manual state management for form fields
3. Update your submit handlers to work with the new `modelInput` format
4. Use the model registry functions instead of hardcoded model configurations

This dynamic form system provides a flexible, maintainable way to create forms for any AI model while ensuring consistency and reducing boilerplate code.