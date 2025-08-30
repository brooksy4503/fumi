import { NextResponse } from 'next/server';
import { FAL_KEY } from '@/utils/fal';
import { fal } from '@fal-ai/client';
import { getModel, modelExists, getDefaultParams, validateInput, getAvailableModelIds } from '@/registry/model-registry';
import {
  ModelMetadata,
  ModelInput,
  ModelOutput,
  ImageGenerationInput,
  VideoGenerationInput,
  TextToSpeechInput,
  SpeechToTextInput,
  AudioGenerationInput,
  ImageEditingInput,
  FalRequest,
  FalResponse
} from '@/types/fal-models';

// Define types for the FAL API response
interface FalImage {
  url: string;
  [key: string]: any; // For other potential properties
}

interface FalApiResponse {
  data?: {
    images?: FalImage[];
    videos?: any[];
    video?: any;
    audio?: any;
    text?: string;
    transcription?: string;
    [key: string]: any;
  };
  requestId?: string;
  [key: string]: any; // For other potential properties
}

/**
 * Validates the response from FAL API based on model category
 */
function validateResponse(category: string, response: FalApiResponse): string | null {
  if (!response) {
    return 'No response received from model';
  }

  switch (category) {
    case 'image-generation':
      if (!response.data?.images || response.data.images.length === 0) {
        return 'No images returned in response';
      }
      break;

    case 'video-generation':
      if (!response.data?.videos && !response.data?.video) {
        return 'No video content returned in response';
      }
      break;

    case 'text-to-speech':
    case 'audio-generation':
      if (!response.data?.audio) {
        return 'No audio content returned in response';
      }
      break;

    case 'speech-to-text':
      if (!response.data?.text && !response.data?.transcription) {
        return 'No text content returned in response';
      }
      break;

    default:
      // For other categories, just check if there's any data
      if (!response.data) {
        return 'No data returned in response';
      }
  }

  return null; // Validation passed
}

export async function POST(request: Request) {
  const startTime = Date.now();

  try {
    console.log('Starting dynamic model generation process');

    const body = await request.json();
    const { model: modelId, ...inputParams } = body;

    // Validate required parameters
    if (!modelId) {
      console.error('Missing model ID in request');
      return NextResponse.json({ error: 'Model ID is required' }, { status: 400 });
    }

    // Handle common model ID aliases/mismatches
    const modelAliases: { [key: string]: string } = {
      'flux-pro': 'fal-ai/flux-pro',
      'flux-schnell': 'fal-ai/flux-schnell',
      'flux-dev': 'fal-ai/flux-dev',
      'fast-sdxl': 'fal-ai/fast-sdxl',
      'stable-video': 'fal-ai/stable-video',
      'stable-video-diffusion': 'fal-ai/stable-video-diffusion',
      'metavoice': 'fal-ai/metavoice-v1',
    };

    // Map alias to actual model ID if needed
    const actualModelId = modelAliases[modelId] || modelId;

    console.log('Requested model:', modelId);
    if (actualModelId !== modelId) {
      console.log('Mapped to model ID:', actualModelId);
    }
    console.log('Input parameters:', JSON.stringify(inputParams, null, 2));
    console.log('DEBUG: Model ID format analysis:');
    console.log('  - Raw modelId:', modelId);
    console.log('  - Contains slash:', modelId.includes('/'));
    console.log('  - Split parts:', modelId.split('/'));
    console.log('  - Length:', modelId.split('/').length);

    // Check if model exists in registry
    console.log('DEBUG: Checking if model exists in registry...');
    const modelExistsResult = await modelExists(actualModelId);
    console.log('DEBUG: modelExists function result:', modelExistsResult);
    if (!modelExistsResult) {
      console.error('Model not found in registry:', actualModelId);
      const availableIds = await getAvailableModelIds();
      console.log('Available models in registry:', availableIds);

      // Try to find similar model IDs for better error messages
      const suggestions = availableIds.filter(id =>
        id.includes(actualModelId) || actualModelId.includes(id.split('/').pop() || '')
      );

      return NextResponse.json({
        error: `Model '${actualModelId}' not found in registry`,
        availableModels: availableIds,
        ...(suggestions.length > 0 && { suggestions: suggestions })
      }, { status: 400 });
    }

    // Get model metadata
    const model = await getModel(actualModelId);
    if (!model) {
      console.error('Failed to retrieve model metadata:', actualModelId);
      return NextResponse.json({ error: 'Failed to retrieve model metadata' }, { status: 500 });
    }

    console.log('Model metadata retrieved:', {
      name: model.name,
      category: model.category,
      provider: model.provider,
      version: model.version
    });

    if (!FAL_KEY) {
      console.error('FAL_KEY environment variable not found');
      return NextResponse.json(
        { error: 'FAL_KEY is not configured' },
        { status: 500 }
      );
    }

    // Validate input parameters against model requirements
    const validation = await validateInput(actualModelId, inputParams as ModelInput);
    if (!validation.valid) {
      console.error('Input validation failed:', validation.errors);
      return NextResponse.json({
        error: 'Input validation failed',
        details: validation.errors
      }, { status: 400 });
    }

    console.log('Input validation passed');

    // Get default parameters and merge with provided input
    const defaultParams = await getDefaultParams(actualModelId);

    // Normalize all parameters to snake_case for FAL API consistency
    const normalizeParams = (params: any) => {
      const normalized: any = {};
      Object.entries(params).forEach(([key, value]) => {
        // Convert camelCase to snake_case
        const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        normalized[snakeKey] = value;
      });
      return normalized;
    };

    const normalizedDefaults = normalizeParams(defaultParams);
    const normalizedInputs = normalizeParams(inputParams);

    let baseInput = {
      ...normalizedDefaults,
      ...normalizedInputs,
      // Ensure required fields are present based on model category
      ...(model.category === 'image-generation' && !normalizedInputs.prompt && { prompt: 'default image prompt' }),
      // For video models that require an image, do not inject a prompt
      ...(model.category === 'video-generation' && (model as any).supportedInputs?.textPrompt && !normalizedInputs.prompt && { prompt: 'default video prompt' }),
      ...(model.category === 'text-to-speech' && !normalizedInputs.text && { text: 'default text to speech' }),
      ...(model.category === 'audio-generation' && !normalizedInputs.prompt && { prompt: 'default audio prompt' })
    };

    let finalInput: any = {};

    // Model-specific parameter handling
    if (actualModelId.startsWith('fal-ai/flux')) {
      // Start with only the required parameters for Flux models
      finalInput.prompt = baseInput.prompt;

      // Handle image size - some models use image_size, others use width/height
      if (actualModelId === 'fal-ai/flux-schnell') {
        // Schnell uses image_size parameter
        if (baseInput.aspect_ratio || (baseInput.width && baseInput.height)) {
          const aspectRatioMap: { [key: string]: string } = {
            '1:1': 'square_hd',
            '16:9': 'landscape_16_9',
            '9:16': 'portrait_9_16',
            '4:3': 'landscape_4_3',
            '3:4': 'portrait_4_3'
          };

          if (baseInput.aspect_ratio) {
            finalInput.image_size = aspectRatioMap[baseInput.aspect_ratio] || 'square_hd';
          } else if (baseInput.width && baseInput.height) {
            // Determine aspect ratio from dimensions
            const ratio = baseInput.width / baseInput.height;
            if (Math.abs(ratio - 1) < 0.1) {
              finalInput.image_size = 'square_hd';
            } else if (ratio > 1.5) {
              finalInput.image_size = 'landscape_16_9';
            } else if (ratio < 0.7) {
              finalInput.image_size = 'portrait_9_16';
            } else {
              finalInput.image_size = 'square_hd';
            }
          } else {
            finalInput.image_size = 'square_hd';
          }
        } else {
          finalInput.image_size = 'square_hd';
        }

        // Schnell-specific optimized parameters
        finalInput.num_inference_steps = normalizedInputs.num_inference_steps || 4;
        finalInput.guidance_scale = normalizedInputs.guidance_scale || 3.5;
      } else {
        // Other flux models use width/height
        finalInput.width = normalizedInputs.width || 1024;
        finalInput.height = normalizedInputs.height || 1024;

        // Standard parameters
        if (normalizedInputs.guidance_scale) finalInput.guidance_scale = normalizedInputs.guidance_scale;
        if (normalizedInputs.num_inference_steps) finalInput.num_inference_steps = normalizedInputs.num_inference_steps;
      }

      // Optional parameters only if provided by user (not from defaults)
      if (normalizedInputs.num_images) finalInput.num_images = normalizedInputs.num_images;
      if (normalizedInputs.seed) finalInput.seed = normalizedInputs.seed;
    } else {
      // For other models, use the base input but clean up any conflicting parameters
      finalInput = { ...baseInput };

      // Remove any parameters that might conflict based on model type
      if (model.category === 'image-generation') {
        // Keep only valid image generation parameters
        const validParams = ['prompt', 'width', 'height', 'num_images', 'guidance_scale', 'num_inference_steps', 'seed', 'quality', 'format'];
        const cleanInput: any = {};
        validParams.forEach(param => {
          if (finalInput[param] !== undefined) {
            cleanInput[param] = finalInput[param];
          }
        });
        finalInput = cleanInput;
      }
      if (model.category === 'video-generation') {
        // Model-specific shaping for Stable Video variants
        if (actualModelId === 'fal-ai/stable-video' || actualModelId === 'fal-ai/stable-video-diffusion') {
          const cleanInput: any = {};
          if (finalInput.image_url) cleanInput.image_url = finalInput.image_url;
          if (finalInput.fps) cleanInput.fps = Number(finalInput.fps);
          // Map duration to frames if provided (Stable Video often uses num_frames)
          if (finalInput.duration) {
            const fps = cleanInput.fps || 10;
            const seconds = Number(finalInput.duration);
            const frames = Math.max(14, Math.min(75, Math.round(fps * seconds)));
            cleanInput.num_frames = frames;
          }
          if (finalInput.loop !== undefined) cleanInput.loop = !!finalInput.loop;
          if (finalInput.seed !== undefined) cleanInput.seed = Number(finalInput.seed);
          finalInput = cleanInput;
        } else {
          // Generic video param whitelist
          const validParams = ['prompt', 'duration', 'width', 'height', 'fps', 'seed', 'loop', 'aspect_ratio', 'image_url', 'video_url'];
          const cleanInput: any = {};
          validParams.forEach(param => {
            if (finalInput[param] !== undefined) {
              cleanInput[param] = finalInput[param];
            }
          });
          finalInput = cleanInput;
        }
      }
    }
    console.log('Final input parameters:', JSON.stringify(finalInput, null, 2));

    // Configure FAL client
    console.log('Configuring FAL client with API key');
    fal.config({
      credentials: FAL_KEY
    });

    // Route to appropriate FAL endpoint based on model category
    console.log('Sending request to FAL API with model:', actualModelId);
    console.log('DEBUG: Final parameters being sent to FAL:', JSON.stringify(finalInput, null, 2));

    const result = await fal.subscribe(actualModelId, {
      input: finalInput,
      logs: true,
    });

    const processingTime = Date.now() - startTime;
    console.log('FAL API response received in', processingTime, 'ms');
    console.log('FAL API response:', JSON.stringify(result, null, 2));

    // Type assertion to work with the response
    const typedResult = result as FalApiResponse;

    // Validate response based on model category
    const validationError = validateResponse(model.category, typedResult);
    if (validationError) {
      console.error('Response validation failed:', validationError);
      return NextResponse.json({
        error: 'Invalid response from model',
        details: validationError,
        raw_response: typedResult
      }, { status: 500 });
    }

    // Return successful response with metadata
    const response = {
      ...typedResult,
      metadata: {
        model: actualModelId,
        modelName: model.name,
        category: model.category,
        provider: model.provider,
        processingTime,
        timestamp: new Date().toISOString()
      }
    };

    console.log('Returning successful response');
    return NextResponse.json(response);

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('Error in model generation:', error);

    // Enhanced error handling with more context
    let errorMessage = 'Failed to generate content';
    let errorDetails: any = {
      processingTime,
      timestamp: new Date().toISOString()
    };
    let statusCode = 500;

    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails.name = error.name;

      // Handle FAL API specific errors
      if (error.name === 'ValidationError' && (error as any).status) {
        statusCode = (error as any).status;
        errorDetails.falApiError = true;

        // Try to extract FAL API validation details
        if ((error as any).body) {
          console.error('FAL API error body:', (error as any).body);
          errorDetails.validationDetails = (error as any).body;

          // If it's a 422 validation error, provide more helpful context
          if (statusCode === 422) {
            errorMessage = 'Invalid parameters sent to model';
            errorDetails.suggestion = 'Check that all parameters are valid for the selected model';
          }
        }
      } else {
        // Regular error handling
        errorDetails.stack = error.stack;

        // Determine if it's a client error (4xx) or server error (5xx)
        if (error.message.includes('validation') || error.message.includes('required')) {
          statusCode = 400;
        } else if (error.message.includes('not found') || error.message.includes('unauthorized')) {
          statusCode = 404;
        }
      }
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: errorDetails
      },
      { status: statusCode }
    );
  }
}
