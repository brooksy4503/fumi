"use client";

import React, { useState, useCallback, useImperativeHandle, forwardRef } from 'react';
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
import MediaModal from './MediaModal';

interface UnifiedFumiInterfaceProps {
  className?: string;
  onImageClick?: (image: any) => void;
  loadHistoryItem?: any;
  onHistoryItemLoaded?: () => void;
  onReset?: () => void;
}

export interface UnifiedFumiInterfaceRef {
  resetForm: () => void;
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

const UnifiedFumiInterface = forwardRef<UnifiedFumiInterfaceRef, UnifiedFumiInterfaceProps>(({ className = "", onImageClick, loadHistoryItem, onHistoryItemLoaded }, ref) => {
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
  const [modalMedia, setModalMedia] = useState<{
    url: string;
    mediaType: 'image' | 'audio' | 'video';
    alt: string;
    metadata?: any;
  } | null>(null);

  // Reset form function
  const resetForm = useCallback(() => {
    setSelectedModelId('');
    setSelectedModel(null);
    setFormConfig(null);
    setDefaultValues({});
    setGenerationResult(null);
    setError(null);
    setErrorDetails(null);
    setIsGenerating(false);
  }, []);

  // Expose resetForm function via ref
  useImperativeHandle(ref, () => ({
    resetForm
  }), [resetForm]);

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
        // Normalize the result data structure for consistent handling
        const normalizedResult = normalizeApiResponse(data.data || data);
        
        // Debug logging for video generation
        if (selectedModel.category === 'video-generation') {
          console.log('Video generation result:', {
            originalData: data,
            normalizedResult: normalizedResult,
            hasVideos: !!(normalizedResult.videos && normalizedResult.videos.length > 0),
            hasVideo: !!normalizedResult.video,
            videosArray: normalizedResult.videos
          });
        }
        
        addToHistory({
          modelId: selectedModelId,
          modelName: selectedModel.name,
          category: selectedModel.category,
          provider: selectedModel.provider,
          prompt: extractPromptForHistory(formData, selectedModel),
          inputParams: formData,
          result: normalizedResult,
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

  const closeMediaModal = () => {
    setModalMedia(null);
  };

  // Normalize API response to ensure consistent data structure
  const normalizeApiResponse = (data: any) => {
    if (!data) return data;
    
    const normalized = { ...data };
    
    // Handle video data normalization
    if (data.video && !data.videos) {
      // Convert single video object to videos array
      normalized.videos = [data.video];
      delete normalized.video;
    } else if (data.data?.video && !data.data?.videos) {
      // Handle nested video object
      normalized.data = { ...data.data };
      normalized.data.videos = [data.data.video];
      delete normalized.data.video;
    }
    
    // Handle image data normalization
    if (data.image && !data.images) {
      // Convert single image object to images array
      normalized.images = [data.image];
      delete normalized.image;
    } else if (data.data?.image && !data.data?.images) {
      // Handle nested image object
      normalized.data = { ...data.data };
      normalized.data.images = [data.data.image];
      delete normalized.data.image;
    }
    
    return normalized;
  };

  // Media detection functions
  const detectMediaType = (data: any): 'image' | 'audio' | 'video' | null => {
    // Check for audio
    if (data.audio?.url || data.data?.audio?.url) {
      return 'audio';
    }
    // Check for video
    if (data.video?.url || data.data?.video?.url || data.videos?.length > 0 || data.data?.videos?.length > 0) {
      return 'video';
    }
    // Check for images
    if (data.images?.length > 0 || data.data?.images?.length > 0) {
      return 'image';
    }
    return null;
  };

  const getMediaData = (data: any, mediaType: 'image' | 'audio' | 'video') => {
    switch (mediaType) {
      case 'audio':
        return data.audio || data.data?.audio;
      case 'video':
        return data.video || data.data?.video || (data.videos && data.videos[0]) || (data.data?.videos && data.data.videos[0]);
      case 'image':
        return data.images?.[0] || data.data?.images?.[0];
      default:
        return null;
    }
  };

  const handleMediaClick = (mediaData: any, mediaType: 'image' | 'audio' | 'video', index?: number) => {
    const mediaInfo = {
      url: mediaData.url,
      mediaType,
      alt: `Generated ${mediaType} ${index !== undefined ? index + 1 : ''}`,
      metadata: {
        width: mediaData.width,
        height: mediaData.height,
        fileSize: mediaData.file_size || mediaData.fileSize,
        contentType: mediaData.content_type || mediaData.contentType,
        duration: mediaData.duration,
        sampleRate: mediaData.sample_rate || mediaData.sampleRate
      }
    };
    
    if (onImageClick) {
      onImageClick(mediaInfo);
    } else {
      setModalMedia(mediaInfo);
    }
  };

  // Extract the appropriate prompt-like field for history display
  const extractPromptForHistory = (formData: FormData, model: ModelMetadata): string => {
    // For text-to-speech models that require script
    if (model.category === 'text-to-speech' && (model as any).requiresScript) {
      return formData.script || 'No script provided';
    }
    
    // For text-to-speech models that use text
    if (model.category === 'text-to-speech') {
      return formData.text || 'No text provided';
    }
    
    // For audio generation models
    if (model.category === 'audio-generation') {
      return formData.prompt || 'No prompt provided';
    }
    
    // For image and video generation models
    if (model.category === 'image-generation' || model.category === 'video-generation') {
      return formData.prompt || 'No prompt provided';
    }
    
    // Fallback: try common field names
    return formData.prompt || formData.text || formData.script || 'No input provided';
  };

  return (
    <div className={`w-full max-w-4xl mx-auto p-4 ${className}`}>
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Fumi Model Interface</h2>
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

          {/* Display media content based on detected type */}
          {(() => {
            const mediaType = detectMediaType(generationResult.data);
            
            if (mediaType === 'image') {
              const images = generationResult.data?.images || generationResult.data?.data?.images || [];
              return (
                <div className="space-y-4">
                  <h4 className="font-medium">Generated Images</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {images.map((image: any, index: number) => (
                      <div 
                        key={index} 
                        className="relative aspect-square w-full overflow-hidden rounded-lg shadow-lg cursor-pointer hover:shadow-xl transition-shadow duration-200"
                        onClick={() => handleMediaClick(image, 'image', index)}
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
                    ))}
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
              );
            } else if (mediaType === 'audio') {
              const audioData = getMediaData(generationResult.data, 'audio');
              return (
                <div className="space-y-4">
                  <h4 className="font-medium">Generated Audio</h4>
                  <div className="flex items-center justify-center p-8 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg border">
                    <div className="text-center space-y-4 max-w-md">
                      <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg mx-auto">
                        <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                        </svg>
                      </div>
                      <div className="space-y-2">
                        <h5 className="font-medium">Audio Generated Successfully</h5>
                        <p className="text-sm text-muted-foreground">
                          {audioData.duration && `Duration: ${Math.round(audioData.duration)}s`}
                          {audioData.file_size && ` • Size: ${(audioData.file_size / 1024 / 1024).toFixed(1)} MB`}
                        </p>
                      </div>
                      <Button 
                        onClick={() => handleMediaClick(audioData, 'audio')}
                        className="w-full"
                      >
                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                        Play Audio
                      </Button>
                    </div>
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
              );
            } else if (mediaType === 'video') {
              const videoData = getMediaData(generationResult.data, 'video');
              return (
                <div className="space-y-4">
                  <h4 className="font-medium">Generated Video</h4>
                  <div className="flex items-center justify-center p-8 bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 rounded-lg border">
                    <div className="text-center space-y-4 max-w-md">
                      <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg mx-auto">
                        <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
                        </svg>
                      </div>
                      <div className="space-y-2">
                        <h5 className="font-medium">Video Generated Successfully</h5>
                        <p className="text-sm text-muted-foreground">
                          {videoData.duration && `Duration: ${Math.round(videoData.duration)}s`}
                          {videoData.file_size && ` • Size: ${(videoData.file_size / 1024 / 1024).toFixed(1)} MB`}
                          {videoData.width && videoData.height && ` • ${videoData.width}×${videoData.height}`}
                        </p>
                      </div>
                      <Button 
                        onClick={() => handleMediaClick(videoData, 'video')}
                        className="w-full"
                      >
                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                        Play Video
                      </Button>
                    </div>
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
              );
            } else {
              // Fallback to JSON display for other content types
              return (
                <div className="p-4 rounded-lg border bg-card text-card-foreground">
                  <h4 className="font-medium mb-2">Generated Content</h4>
                  <pre className="text-sm text-muted-foreground overflow-auto max-h-96">
                    {JSON.stringify(generationResult.data, null, 2)}
                  </pre>
                </div>
              );
            }
          })()}
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

      {/* Media Modal */}
      {modalMedia && (
        <MediaModal
          isOpen={!!modalMedia}
          onClose={closeMediaModal}
          mediaUrl={modalMedia.url}
          mediaType={modalMedia.mediaType}
          alt={modalMedia.alt}
          title={`Generated ${modalMedia.mediaType.charAt(0).toUpperCase() + modalMedia.mediaType.slice(1)}`}
          metadata={modalMedia.metadata}
        />
      )}
    </div>
  );
});

UnifiedFumiInterface.displayName = 'UnifiedFumiInterface';

export default UnifiedFumiInterface;