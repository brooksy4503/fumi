"use client";

import React, { useState, useCallback } from 'react';
import Image from 'next/image';
import { ModelMetadata } from '@/types/fal-models';
import { FormData } from '@/types/form-fields';
import { getAllModels, getModel } from '@/registry/model-registry';
import { modelToFormConfig } from '@/utils/model-to-form';
import { validateFormData, getFormDefaults, formDataToModelInput } from '@/utils/form-validation';
import { useHistory } from '@/contexts/HistoryContext';
import DynamicForm from './DynamicForm';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import ShadcnDynamicForm from './ShadcnDynamicForm';
import ImageModal from './ImageModal';

interface UnifiedFalInterfaceProps {
  className?: string;
  onImageClick?: (image: any) => void;
  loadHistoryItem?: any;
  onHistoryItemLoaded?: () => void;
}

interface GenerationResult {
  data: any;
  metadata: {
    model: string;
    modelName: string;
    category: string;
    provider: string;
    processingTime: number;
    timestamp: string;
  };
}

export default function UnifiedFalInterface({ className = "", onImageClick, loadHistoryItem, onHistoryItemLoaded }: UnifiedFalInterfaceProps) {
  const { addToHistory } = useHistory();
  const [selectedModelId, setSelectedModelId] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationResult, setGenerationResult] = useState<GenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<any>(null);
  const [isLoadingModels, setIsLoadingModels] = useState(true);
  const [availableModels, setAvailableModels] = useState<ModelMetadata[]>([]);
  const [selectedModel, setSelectedModel] = useState<ModelMetadata | null>(null);
  const [formConfig, setFormConfig] = useState<any>(null);
  const [defaultValues, setDefaultValues] = useState<FormData>({});
  const [modalImage, setModalImage] = useState<{
    url: string;
    alt: string;
    metadata?: any;
  } | null>(null);

  // Load available models on mount
  React.useEffect(() => {
    let isMounted = true;

    const loadModels = async () => {
      try {
        const models = await getAllModels();
        if (isMounted) {
          setAvailableModels(models);
          setIsLoadingModels(false);
        }
      } catch (error) {
        console.error('Failed to load models:', error);
        if (isMounted) {
          setError('Failed to load available models');
          setIsLoadingModels(false);
        }
      }
    };

    loadModels();

    return () => {
      isMounted = false;
    };
  }, []);

  // Load selected model when model ID changes
  React.useEffect(() => {
    if (!selectedModelId) {
      setSelectedModel(null);
      return;
    }

    const loadSelectedModel = async () => {
      try {
        const model = await getModel(selectedModelId);
        setSelectedModel(model || null);
      } catch (error) {
        console.error('Failed to load model:', error);
        setError(`Failed to load model: ${selectedModelId}`);
        setSelectedModel(null);
      }
    };

    loadSelectedModel();
  }, [selectedModelId]);

  // Load form configuration when selected model changes
  React.useEffect(() => {
    if (!selectedModel) {
      setFormConfig(null);
      setDefaultValues({});
      return;
    }

    const loadFormConfig = async () => {
      try {
        const config = modelToFormConfig(selectedModel);
        setFormConfig(config);

        const defaults = await getFormDefaults(selectedModel);
        setDefaultValues(defaults);
      } catch (error) {
        console.error('Failed to load form configuration:', error);
        setError(`Failed to load form for model: ${selectedModel.name}`);
        setFormConfig(null);
        setDefaultValues({});
      }
    };

    loadFormConfig();
  }, [selectedModel]);

  // Handle loading history items
  React.useEffect(() => {
    if (loadHistoryItem) {
      console.log('Loading history item:', loadHistoryItem);
      
      // Set the model
      if (loadHistoryItem.modelId) {
        setSelectedModelId(loadHistoryItem.modelId);
      }
      
      // Set the form data as default values
      if (loadHistoryItem.inputParams) {
        setDefaultValues(loadHistoryItem.inputParams);
      }
      
      // Clear any current generation result
      setGenerationResult(null);
      setError(null);
      setErrorDetails(null);
      
      // Notify parent that the item has been loaded
      if (onHistoryItemLoaded) {
        onHistoryItemLoaded();
      }
    }
  }, [loadHistoryItem, onHistoryItemLoaded]);

  const handleModelChange = useCallback((modelId: string) => {
    setSelectedModelId(modelId);
    setGenerationResult(null);
    setError(null);
    setErrorDetails(null);
  }, []);

  const handleFormSubmit = async (formData: FormData) => {
    if (!selectedModel) {
      setError('Please select a model first');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setErrorDetails(null);
    setGenerationResult(null);

    try {
      console.log('Submitting form with data:', formData);

      const validation = await validateFormData(formData, selectedModel);
      if (!validation.isValid) {
        console.error('Form validation failed:', validation.errors);
        setError('Form validation failed. Please check your inputs.');
        setErrorDetails(validation.errors);
        return;
      }

      const modelInput = formDataToModelInput(formData, selectedModel);
      console.log('Converted model input:', modelInput);

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: selectedModelId,
          ...modelInput
        }),
      });

      const data = await response.json();
      console.log('API response received:', data);

      if (!response.ok) {
        setErrorDetails(data.details || data.raw_response || null);
        throw new Error(data.error || 'Failed to generate content');
      }

      setGenerationResult(data);

      // Save to history
      try {
        addToHistory({
          modelId: selectedModelId,
          modelName: selectedModel.name,
          category: selectedModel.category,
          provider: selectedModel.provider,
          prompt: formData.prompt || 'No prompt provided',
          inputParams: formData,
          result: data.data || data,
          metadata: {
            processingTime: data.metadata.processingTime,
            version: selectedModel.version,
          }
        });
      } catch (historyError) {
        console.error('Failed to save to history:', historyError);
        // Don't fail the generation if history saving fails
      }

    } catch (err) {
      console.error('Generation error:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleImageClick = (image: any, index: number) => {
    const imageData = {
      url: image.url,
      alt: `Generated image ${index + 1}`,
      width: image.width,
      height: image.height,
      fileSize: image.fileSize,
      contentType: image.contentType
    };
    
    if (onImageClick) {
      onImageClick(imageData);
    } else {
      setModalImage({
        ...imageData,
        metadata: {
          width: image.width,
          height: image.height,
          fileSize: image.fileSize,
          contentType: image.contentType
        }
      });
    }
  };

  const closeModal = () => {
    setModalImage(null);
  };

  return (
    <div className={`w-full max-w-4xl mx-auto p-4 ${className}`}>
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Fal Model Interface</h2>
        <div className="space-y-2">
          <label htmlFor="model-select" className="block text-sm font-medium text-muted-foreground">
            Select Model
          </label>
          {isLoadingModels ? (
            <Skeleton className="w-full h-10" />
          ) : (
            <Select value={selectedModelId} onValueChange={handleModelChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a model..." />
              </SelectTrigger>
              <SelectContent>
                {availableModels.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    {model.name} - {model.category.replace('-', ' ')} ({model.provider})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {selectedModel && (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-xl">{selectedModel.name}</CardTitle>
              <p className="text-muted-foreground text-sm">{selectedModel.description}</p>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">
                  {selectedModel.category.replace('-', ' ')}
                </Badge>
                <Badge variant="outline">
                  {selectedModel.provider}
                </Badge>
                <Badge variant="outline">
                  v{selectedModel.version}
                </Badge>
                {selectedModel.limits?.costPerRequest && (
                  <Badge variant="outline">
                    ${selectedModel.limits.costPerRequest} per request
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {selectedModel && formConfig && (
        <div className="mb-8">
          <ShadcnDynamicForm
            config={formConfig}
            onSubmit={handleFormSubmit}
            initialData={defaultValues}
            disabled={isGenerating}
          />
        </div>
      )}

      {isGenerating && (
        <div className="flex justify-center items-center py-8">
          <Button disabled>
            <span className="mr-2 h-4 w-4 animate-spin">⏳</span>
            Generating content...
          </Button>
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error}
            {errorDetails && (
              <div className="mt-2">
                <details className="text-sm">
                  <summary className="cursor-pointer font-medium">View error details</summary>
                  <pre className="mt-2 p-2 rounded overflow-auto text-xs max-h-48 border border-destructive/30 bg-destructive/10 text-destructive">
                    {JSON.stringify(errorDetails, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {generationResult && (
        <div className="mt-8 space-y-6">
          <Alert>
            <AlertTitle>Generation Successful</AlertTitle>
            <AlertDescription>
              <div className="mt-2 text-sm">
                <p>Model: {generationResult.metadata.modelName} ({generationResult.metadata.provider})</p>
                <p>Category: {generationResult.metadata.category.replace('-', ' ')}</p>
                <p>Processing time: {generationResult.metadata.processingTime}ms</p>
              </div>
            </AlertDescription>
          </Alert>

          {/* Display images if they exist in the response */}
          {(generationResult.data?.images && generationResult.data.images.length > 0) || 
           (generationResult.data?.data?.images && generationResult.data.data.images.length > 0) ? (
            <div className="space-y-4">
              <h4 className="font-medium">Generated Images</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Handle both response structures */}
                {generationResult.data?.images && generationResult.data.images.length > 0 
                  ? generationResult.data.images.map((image: any, index: number) => (
                      <div 
                        key={index} 
                        className="relative aspect-square w-full overflow-hidden rounded-lg shadow-lg cursor-pointer hover:shadow-xl transition-shadow duration-200"
                        onClick={() => handleImageClick(image, index)}
                      >
                        <Image
                          src={image.url}
                          alt={`Generated image ${index + 1}`}
                          fill
                          className="object-contain hover:scale-105 transition-transform duration-200"
                          sizes="(max-width: 768px) 100vw, 50vw"
                        />
                        <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors duration-200 flex items-center justify-center">
                          <div className="opacity-0 hover:opacity-100 transition-opacity duration-200 bg-white/90 text-black px-3 py-1 rounded-full text-sm font-medium">
                            Click to expand
                          </div>
                        </div>
                      </div>
                    ))
                  : generationResult.data?.data?.images.map((image: any, index: number) => (
                      <div 
                        key={index} 
                        className="relative aspect-square w-full overflow-hidden rounded-lg shadow-lg cursor-pointer hover:shadow-xl transition-shadow duration-200"
                        onClick={() => handleImageClick(image, index)}
                      >
                        <Image
                          src={image.url}
                          alt={`Generated image ${index + 1}`}
                          fill
                          className="object-contain hover:scale-105 transition-transform duration-200"
                          sizes="(max-width: 768px) 100vw, 50vw"
                        />
                        <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors duration-200 flex items-center justify-center">
                          <div className="opacity-0 hover:opacity-100 transition-opacity duration-200 bg-white/90 text-black px-3 py-1 rounded-full text-sm font-medium">
                            Click to expand
                          </div>
                        </div>
                      </div>
                    ))
                }
              </div>
              {/* Display description if it exists */}
              {generationResult.data?.description && (
                <div className="p-4 rounded-lg border bg-card text-card-foreground">
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-muted-foreground">{generationResult.data.description}</p>
                </div>
              )}
              {generationResult.data?.data?.description && (
                <div className="p-4 rounded-lg border bg-card text-card-foreground">
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-muted-foreground">{generationResult.data.data.description}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 rounded-lg border bg-card text-card-foreground">
              <h4 className="font-medium mb-2">Generated Content</h4>
              <pre className="text-sm text-muted-foreground overflow-auto max-h-96">
                {JSON.stringify(generationResult.data, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Image Modal */}
      {modalImage && (
        <ImageModal
          isOpen={!!modalImage}
          onClose={closeModal}
          imageUrl={modalImage.url}
          alt={modalImage.alt}
          title="Generated Image"
          metadata={modalImage.metadata}
        />
      )}
    </div>
  );
}