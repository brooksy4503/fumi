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

    case 'image-editing':
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
    const { model: modelId, ...inputParamsRaw } = body;
    // Support both flat inputs and { input: {...} } payloads
    const inputParams = (inputParamsRaw && typeof inputParamsRaw.input === 'object')
      ? { ...inputParamsRaw, ...inputParamsRaw.input }
      : inputParamsRaw;

    // Validate required parameters
    if (!modelId) {
      console.error('Missing model ID in request');
      return NextResponse.json({ error: 'Model ID is required' }, { status: 400 });
    }

    // Normalize model ID if a full Fal model URL was provided
    let normalizedModelId = modelId;
    if (typeof modelId === 'string' && modelId.startsWith('http') && modelId.includes('/models/')) {
      try {
        const match = modelId.match(/\/models\/([^?#]+)/);
        if (match && match[1]) {
          normalizedModelId = decodeURIComponent(match[1]);
          if (normalizedModelId.endsWith('/api')) {
            normalizedModelId = normalizedModelId.replace(/\/api$/, '');
          }
        }
      } catch { }
    }

    // Handle common model ID aliases/mismatches
    const modelAliases: { [key: string]: string } = {
      // New FLUX models (short aliases mapping)
      'flux-pro/kontext': 'fal-ai/flux-pro/kontext',
      'flux-pro/kontext/api': 'fal-ai/flux-pro/kontext',
      'flux-pro/v1.1-ultra': 'fal-ai/flux-pro/v1.1-ultra',
      'flux-pro/v1.1-ultra/api': 'fal-ai/flux-pro/v1.1-ultra',
      'flux/dev': 'fal-ai/flux/dev',
      'flux/dev/api': 'fal-ai/flux/dev',
      // Full path variants extracted from Fal URLs
      'fal-ai/flux-pro/kontext/api': 'fal-ai/flux-pro/kontext',
      'fal-ai/flux-pro/v1.1-ultra/api': 'fal-ai/flux-pro/v1.1-ultra',
      'fal-ai/flux/dev/api': 'fal-ai/flux/dev',
      // Other models
      'fast-sdxl': 'fal-ai/fast-sdxl',
      'stable-video': 'fal-ai/stable-video',
      'stable-video-diffusion': 'fal-ai/stable-video-diffusion',
      'vibevoice': 'fal-ai/vibevoice',
      'xtts': 'fal-ai/xtts',
      // Seedream v4 Edit variants
      'fal-ai/bytedance/seedream/v4/edit/api': 'fal-ai/bytedance/seedream/v4/edit',
    };

    // Map alias to actual model ID if needed
    const actualModelId = modelAliases[normalizedModelId] || normalizedModelId;

    console.log('Requested model:', modelId);
    if (normalizedModelId !== modelId) {
      console.log('Normalized URL model to:', normalizedModelId);
    }
    if (actualModelId !== normalizedModelId) {
      console.log('Mapped to model ID:', actualModelId);
    }
    console.log('Input parameters (flattened if nested under input):', JSON.stringify(inputParams, null, 2));
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

    // Special handling for Veo 3 Fast - it already uses correct field names
    const isVeo3Fast = actualModelId === 'fal-ai/veo3/fast/image-to-video';

    const normalizedDefaults = isVeo3Fast ? defaultParams : normalizeParams(defaultParams);
    const normalizedInputs = isVeo3Fast ? inputParams : normalizeParams(inputParams);

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
    if (actualModelId === 'fal-ai/veo3/fast/image-to-video') {
      // Veo 3 Fast: use the input parameters directly as they're already in the correct format
      finalInput = { ...baseInput };

      // Ensure required fields have default values if not provided
      if (!finalInput.duration) finalInput.duration = '8s';
      if (finalInput.generate_audio === undefined) finalInput.generate_audio = true;
      if (!finalInput.resolution) finalInput.resolution = '720p';
    } else if (actualModelId === 'fal-ai/gemini-25-flash-image/edit') {
      // Gemini editing model: expects image_urls array and prompt
      finalInput = {
        prompt: baseInput.prompt,
        image_urls: normalizedInputs.image_urls || [],
        num_images: normalizedInputs.num_images || 1,
        output_format: normalizedInputs.output_format || 'jpeg'
      };
    } else if (actualModelId === 'fal-ai/bytedance/seedream/v4/edit') {
      // Seedream v4 edit: expects image_urls array, prompt, and optional image_size (enum) or custom { width, height }
      finalInput = {
        prompt: baseInput.prompt,
        image_urls: normalizedInputs.image_urls || [],
      };

      // Prefer explicit image_size enum; otherwise, build object from width/height if provided together
      if (normalizedInputs.image_size) {
        finalInput.image_size = normalizedInputs.image_size;
      } else if (normalizedInputs.width && normalizedInputs.height) {
        finalInput.image_size = {
          width: normalizedInputs.width,
          height: normalizedInputs.height,
        };
      }

      // Forward supported optional parameters
      if (normalizedInputs.num_images !== undefined) finalInput.num_images = normalizedInputs.num_images;
      if (normalizedInputs.max_images !== undefined) finalInput.max_images = normalizedInputs.max_images;
      if (normalizedInputs.seed !== undefined) finalInput.seed = normalizedInputs.seed;
      if (normalizedInputs.sync_mode !== undefined) finalInput.sync_mode = normalizedInputs.sync_mode;
      if (normalizedInputs.enable_safety_checker !== undefined) finalInput.enable_safety_checker = normalizedInputs.enable_safety_checker;
    } else if (actualModelId.startsWith('fal-ai/flux')) {
      // FLUX models: start with required parameters
      finalInput.prompt = baseInput.prompt;

      // Default to width/height for current FLUX endpoints
      finalInput.width = normalizedInputs.width || 1024;
      finalInput.height = normalizedInputs.height || 1024;

      // Standard optional parameters
      if (normalizedInputs.guidance_scale) finalInput.guidance_scale = normalizedInputs.guidance_scale;
      if (normalizedInputs.num_inference_steps) finalInput.num_inference_steps = normalizedInputs.num_inference_steps;
      if (normalizedInputs.num_images) finalInput.num_images = normalizedInputs.num_images;
      if (normalizedInputs.seed) finalInput.seed = normalizedInputs.seed;
      // Forward image input if provided (enables img2img variants)
      if (normalizedInputs.image_url) finalInput.image_url = normalizedInputs.image_url;

      // Note: Some FLUX endpoints may require image_url (e.g., Kontext).
      // We forward image_url when provided and rely on FAL to validate.
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

    let result: any;
    try {
      result = await fal.subscribe(actualModelId, {
        input: finalInput,
        logs: true,
      });
    } catch (firstError: any) {
      // Retry strategy for Stable Video endpoints: send conservative defaults
      const isStableVideo = actualModelId === 'fal-ai/stable-video' || actualModelId === 'fal-ai/stable-video-diffusion';
      if (isStableVideo && finalInput?.image_url) {
        console.warn('Stable Video request failed, retrying with conservative defaults');
        const retryInput: any = {
          image_url: finalInput.image_url,
          fps: 10,
          num_frames: 48,
        };
        try {
          result = await fal.subscribe(actualModelId, {
            input: retryInput,
            logs: true,
          });
        } catch (secondError) {
          // Second attempt: use frame_rate alias instead of fps
          const retryInput2: any = {
            image_url: finalInput.image_url,
            frame_rate: 10,
            num_frames: 48,
          };
          try {
            result = await fal.subscribe(actualModelId, {
              input: retryInput2,
              logs: true,
            });
          } catch (thirdError) {
            // Final attempt: only image_url
            const retryInput3: any = {
              image_url: finalInput.image_url,
            };
            try {
              result = await fal.subscribe(actualModelId, {
                input: retryInput3,
                logs: true,
              });
            } catch {
              throw firstError;
            }
          }
        }
      } else {
        throw firstError;
      }
    }

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
      if ((error as any).status) {
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
