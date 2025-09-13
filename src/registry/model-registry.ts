import {
    ModelMetadata,
    ModelInput,
    ImageGenerationModel,
    VideoGenerationModel,
    TextToSpeechModel,
    SpeechToTextModel,
    AudioGenerationModel,
    ImageEditingModel,
    ModelLimits,
    ModelStatus,
} from '../types/fal-models';

// Import the model discovery service
import modelDiscoveryService from '../services/model-discovery';

/**
 * Model registry containing configurations for popular Fal models.
 * Uses only manually configured models from the static registry.
 */
const staticRegistry: Record<string, ModelMetadata> = {
    // ============================================================================
    // IMAGE GENERATION MODELS
    // ============================================================================

    // New FLUX models
    'fal-ai/flux-pro/kontext': {
        id: 'fal-ai/flux-pro/kontext',
        name: 'FLUX.1 Pro Kontext',
        description: 'Context-aware FLUX Pro variant for enhanced prompt following and detail',
        category: 'image-generation',
        version: '1.1',
        provider: 'Black Forest Labs',
        capabilities: ['text-to-image'],
        limits: {
            maxInputSize: '2048x2048',
            maxOutputSize: '2048x2048',
            rateLimit: {
                requestsPerMinute: 20,
                requestsPerHour: 200,
            },
            costPerRequest: 0.05,
        },
        requiresAuth: true,
        status: 'active',
        supportedInputs: {
            textPrompt: true,
            imagePrompt: true,
            negativePrompt: false,
            dimensions: true,
            aspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4'],
            styles: ['realistic', 'high-res', 'photorealistic'],
            controlNet: false,
        },
        supportedOutputs: {
            formats: ['png', 'jpg', 'webp'],
            maxResolution: '2048x2048',
            batchSize: 4,
        },
    } as ImageGenerationModel,

    'fal-ai/flux-pro/v1.1-ultra': {
        id: 'fal-ai/flux-pro/v1.1-ultra',
        name: 'FLUX.1 Pro v1.1 Ultra',
        description: 'Highest quality FLUX Pro 1.1 Ultra for photorealistic, detailed images',
        category: 'image-generation',
        version: '1.1',
        provider: 'Black Forest Labs',
        capabilities: ['text-to-image'],
        limits: {
            maxInputSize: '2048x2048',
            maxOutputSize: '2048x2048',
            rateLimit: {
                requestsPerMinute: 20,
                requestsPerHour: 200,
            },
            costPerRequest: 0.06,
        },
        requiresAuth: true,
        status: 'active',
        supportedInputs: {
            textPrompt: true,
            imagePrompt: true,
            negativePrompt: false,
            dimensions: true,
            aspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4'],
            styles: ['realistic', 'photorealistic', 'ultra'],
            controlNet: false,
        },
        supportedOutputs: {
            formats: ['png', 'jpg', 'webp'],
            maxResolution: '2048x2048',
            batchSize: 4,
        },
    } as ImageGenerationModel,

    'fal-ai/flux/dev': {
        id: 'fal-ai/flux/dev',
        name: 'FLUX.1 dev',
        description: 'Developer-friendly FLUX variant optimized for speed and iteration',
        category: 'image-generation',
        version: '1.0',
        provider: 'Black Forest Labs',
        capabilities: ['text-to-image'],
        limits: {
            maxInputSize: '1024x1024',
            maxOutputSize: '1024x1024',
            rateLimit: {
                requestsPerMinute: 30,
                requestsPerHour: 300,
            },
            costPerRequest: 0.025,
        },
        requiresAuth: true,
        status: 'active',
        supportedInputs: {
            textPrompt: true,
            imagePrompt: true,
            negativePrompt: false,
            dimensions: true,
            aspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4'],
            styles: ['realistic', 'artistic', 'photorealistic'],
            controlNet: false,
        },
        supportedOutputs: {
            formats: ['png', 'jpg', 'webp'],
            maxResolution: '1024x1024',
            batchSize: 1,
        },
    } as ImageGenerationModel,

    'fal-ai/fast-sdxl': {
        id: 'fal-ai/fast-sdxl',
        name: 'Fast SDXL',
        description: 'Fast Stable Diffusion XL model optimized for speed with good quality output',
        category: 'image-generation',
        version: '1.0',
        provider: 'Stability AI',
        capabilities: ['text-to-image'],
        limits: {
            maxInputSize: '1024x1024',
            maxOutputSize: '1024x1024',
            rateLimit: {
                requestsPerMinute: 40,
                requestsPerHour: 400,
            },
            costPerRequest: 0.02,
        },
        requiresAuth: true,
        status: 'active',
        supportedInputs: {
            textPrompt: true,
            imagePrompt: false,
            negativePrompt: true,
            dimensions: true,
            aspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4'],
            styles: ['realistic', 'artistic', 'photorealistic', 'anime'],
            controlNet: false,
        },
        supportedOutputs: {
            formats: ['png', 'jpg', 'webp'],
            maxResolution: '1024x1024',
            batchSize: 1,
        },
    } as ImageGenerationModel,

    'fal-ai/gemini-25-flash-image': {
        id: 'fal-ai/gemini-25-flash-image',
        name: 'Gemini 2.5 Flash Image',
        description: 'Google\'s state-of-the-art image generation model with high-quality outputs',
        category: 'image-generation',
        version: '2.5',
        provider: 'Google',
        capabilities: ['text-to-image'],
        limits: {
            maxInputSize: '2048x2048',
            maxOutputSize: '2048x2048',
            rateLimit: {
                requestsPerMinute: 30,
                requestsPerHour: 300,
            },
            costPerRequest: 0.03,
        },
        requiresAuth: true,
        status: 'active',
        supportedInputs: {
            textPrompt: true,
            imagePrompt: false,
            negativePrompt: false,
            dimensions: true,
            aspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4'],
            styles: ['realistic', 'artistic', 'photorealistic'],
            controlNet: false,
        },
        supportedOutputs: {
            formats: ['jpeg', 'png'],
            maxResolution: '2048x2048',
            batchSize: 10,
        },
    } as ImageGenerationModel,

    'fal-ai/bytedance/seedream/v4/text-to-image': {
        id: 'fal-ai/bytedance/seedream/v4/text-to-image',
        name: 'Seedream v4',
        description: 'Bytedance\'s advanced text-to-image generation model with high-quality outputs',
        category: 'image-generation',
        version: '4.0',
        provider: 'Bytedance',
        capabilities: ['text-to-image'],
        limits: {
            maxInputSize: '1024x1024',
            maxOutputSize: '1024x1024',
            rateLimit: {
                requestsPerMinute: 20,
                requestsPerHour: 200,
            },
            costPerRequest: 0.025,
        },
        requiresAuth: true,
        status: 'active',
        supportedInputs: {
            textPrompt: true,
            imagePrompt: false,
            negativePrompt: true,
            dimensions: true,
            aspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4'],
            styles: ['realistic', 'artistic', 'photorealistic'],
            controlNet: false,
        },
        supportedOutputs: {
            formats: ['png', 'jpg', 'webp'],
            maxResolution: '1024x1024',
            batchSize: 1,
        },
    } as ImageGenerationModel,

    // ============================================================================
    // IMAGE EDITING MODELS
    // ============================================================================

    'fal-ai/gemini-25-flash-image/edit': {
        id: 'fal-ai/gemini-25-flash-image/edit',
        name: 'Gemini 2.5 Flash Image Edit',
        description: 'Google\'s state-of-the-art image editing model for editing multiple images',
        category: 'image-editing',
        version: '2.5',
        provider: 'Google',
        capabilities: ['image-editing'],
        limits: {
            maxInputSize: '2048x2048',
            maxOutputSize: '2048x2048',
            rateLimit: {
                requestsPerMinute: 30,
                requestsPerHour: 300,
            },
            costPerRequest: 0.03,
        },
        requiresAuth: true,
        status: 'active',
        supportedModes: ['inpaint', 'outpaint', 'super-resolution', 'colorize', 'restore'],
        maxResolution: '2048x2048',
        supportedInputs: ['png', 'jpg', 'jpeg', 'webp'],
        supportedOutputs: ['png', 'jpg', 'jpeg', 'webp'],
    } as ImageEditingModel,

    'fal-ai/bytedance/seedream/v4/edit': {
        id: 'fal-ai/bytedance/seedream/v4/edit',
        name: 'Seedream v4 Image Edit',
        description: 'Bytedance\'s advanced image editing model based on Seedream v4 with high-quality outputs',
        category: 'image-editing',
        version: '4.0',
        provider: 'Bytedance',
        capabilities: ['image-editing'],
        limits: {
            maxInputSize: '4096x4096',
            maxOutputSize: '4096x4096',
            rateLimit: {
                requestsPerMinute: 20,
                requestsPerHour: 200,
            },
            costPerRequest: 0.025,
        },
        requiresAuth: true,
        status: 'active',
        supportedModes: ['inpaint', 'outpaint', 'super-resolution'],
        maxResolution: '4096x4096',
        supportedInputs: ['png', 'jpg', 'webp'],
        supportedOutputs: ['png', 'jpg', 'webp'],
        // Custom input schema for Seedream v4 Edit
        customInputSchema: {
            prompt: {
                type: 'string',
                required: true,
                description: 'The text prompt used to edit the image'
            },
            image_urls: {
                type: 'array',
                required: true,
                description: 'List of URLs of input images for editing (up to 10 images allowed)'
            },
            image_size: {
                type: 'string',
                required: false,
                default: 'square_hd',
                enum: ['square_hd', 'square', 'portrait_4_3', 'portrait_16_9', 'landscape_4_3', 'landscape_16_9'],
                description: 'The size of the generated image. Width and height must be between 1024 and 4096.'
            },
            // Support for custom dimensions
            width: {
                type: 'number',
                required: false,
                minimum: 1024,
                maximum: 4096,
                description: 'Custom width for the image (overrides image_size if provided)'
            },
            height: {
                type: 'number',
                required: false,
                minimum: 1024,
                maximum: 4096,
                description: 'Custom height for the image (overrides image_size if provided)'
            }
        }
    } as ImageEditingModel,

    // ============================================================================
    // VIDEO GENERATION MODELS
    // ============================================================================

    'fal-ai/stable-video': {
        id: 'fal-ai/stable-video',
        name: 'Stable Video',
        description: 'Image-to-video generation using Stable Video',
        category: 'video-generation',
        version: '1.0',
        provider: 'Stability AI',
        capabilities: ['image-to-video'],
        limits: {
            maxInputSize: '1024x576',
            maxOutputSize: '1024x576',
            rateLimit: {
                requestsPerMinute: 10,
                requestsPerHour: 100,
            },
            costPerRequest: 0.15,
        },
        requiresAuth: true,
        status: 'active',
        supportedInputs: {
            textPrompt: false,
            videoPrompt: false,
            imagePrompt: true,
            negativePrompt: false,
            durations: [],
            dimensions: true,
            aspectRatios: ['16:9'],
            fps: [10, 15],
        },
        supportedOutputs: {
            formats: ['mp4'],
            maxResolution: '1024x576',
            maxDuration: 8,
            batchSize: 1,
        },
    } as VideoGenerationModel,

    'fal-ai/stable-video-diffusion': {
        id: 'fal-ai/stable-video-diffusion',
        name: 'Stable Video Diffusion',
        description: 'Generate videos from images using Stable Video Diffusion',
        category: 'video-generation',
        version: '1.0',
        provider: 'Stability AI',
        capabilities: ['image-to-video'],
        limits: {
            maxInputSize: '1024x576',
            maxOutputSize: '1024x576',
            rateLimit: {
                requestsPerMinute: 10,
                requestsPerHour: 100,
            },
            costPerRequest: 0.15,
        },
        requiresAuth: true,
        status: 'active',
        supportedInputs: {
            textPrompt: false,
            videoPrompt: false,
            imagePrompt: true,
            negativePrompt: false,
            durations: [],
            dimensions: true,
            aspectRatios: ['16:9'],
            fps: [10, 15],
        },
        supportedOutputs: {
            formats: ['mp4'],
            maxResolution: '1024x576',
            maxDuration: 8,
            batchSize: 1,
        },
    } as VideoGenerationModel,

    'fal-ai/veo3/fast/image-to-video': {
        id: 'fal-ai/veo3/fast/image-to-video',
        name: 'Veo 3 Fast [Image to Video]',
        description: 'Generate videos from your image prompts using Veo 3 fast with 50% price drop',
        category: 'video-generation',
        version: '3.0',
        provider: 'Google',
        capabilities: ['image-to-video'],
        limits: {
            maxInputSize: '8MB',
            maxOutputSize: '1080p',
            rateLimit: {
                requestsPerMinute: 15,
                requestsPerHour: 150,
            },
            costPerRequest: 0.10, // $0.10 per second of video (audio off)
        },
        requiresAuth: true,
        status: 'active',
        supportedInputs: {
            textPrompt: true,
            videoPrompt: false,
            imagePrompt: true,
            negativePrompt: false,
            durations: ['8s'], // Only 8 seconds supported
            dimensions: false, // Fixed aspect ratio
            aspectRatios: ['16:9'], // Only 16:9 aspect ratio supported
            fps: [24], // Standard frame rate
        },
        supportedOutputs: {
            formats: ['mp4'],
            maxResolution: '1080p',
            maxDuration: 8,
            batchSize: 1,
        },
        // Custom input schema for Veo 3 Fast
        customInputSchema: {
            prompt: {
                type: 'string',
                required: true,
                description: 'Text prompt describing how the image should be animated'
            },
            image_url: {
                type: 'string',
                required: true,
                description: 'URL of the input image to animate (720p or higher, 16:9 aspect ratio)'
            },
            duration: {
                type: 'string',
                required: false,
                default: '8s',
                enum: ['8s'],
                description: 'Duration of the generated video'
            },
            generate_audio: {
                type: 'boolean',
                required: false,
                default: true,
                description: 'Whether to generate audio for the video'
            },
            resolution: {
                type: 'string',
                required: false,
                default: '720p',
                enum: ['720p', '1080p'],
                description: 'Resolution of the generated video'
            }
        }
    } as VideoGenerationModel,

    'decart/lucy-14b/image-to-video': {
        id: 'decart/lucy-14b/image-to-video',
        name: 'Lucy-14B Image to Video',
        description: 'Lucy-14B delivers lightning fast performance that redefines what\'s possible with image-to-video AI',
        category: 'video-generation',
        version: '14b',
        provider: 'Decart',
        capabilities: ['image-to-video'],
        limits: {
            maxInputSize: '8MB',
            maxOutputSize: '720p',
            rateLimit: {
                requestsPerMinute: 20,
                requestsPerHour: 200,
            },
            costPerRequest: 0.05, // Estimated cost based on similar models
        },
        requiresAuth: true,
        status: 'active',
        supportedInputs: {
            textPrompt: true,
            videoPrompt: false,
            imagePrompt: true,
            negativePrompt: false,
            durations: [],
            dimensions: false, // Fixed aspect ratio
            aspectRatios: ['16:9', '9:16'],
            fps: [24], // Standard frame rate
        },
        supportedOutputs: {
            formats: ['mp4'],
            maxResolution: '720p',
            maxDuration: 8,
            batchSize: 1,
        },
        // Custom input schema for Lucy-14B
        customInputSchema: {
            prompt: {
                type: 'string',
                required: true,
                description: 'Text description of the desired video content'
            },
            image_url: {
                type: 'string',
                required: true,
                description: 'URL of the image to use as the first frame'
            },
            resolution: {
                type: 'string',
                required: false,
                default: '720p',
                enum: ['720p'],
                description: 'Resolution of the generated video'
            },
            aspect_ratio: {
                type: 'string',
                required: false,
                default: '16:9',
                enum: ['9:16', '16:9'],
                description: 'Aspect ratio of the generated video'
            },
            sync_mode: {
                type: 'boolean',
                required: false,
                default: true,
                description: 'If set to true, the function will wait for the image to be generated and uploaded before returning the response'
            }
        }
    } as VideoGenerationModel,

    // ============================================================================
    // TEXT-TO-SPEECH MODELS
    // ============================================================================

    'fal-ai/vibevoice': {
        id: 'fal-ai/vibevoice',
        name: 'VibeVoice 1.5B',
        description: 'High-quality text-to-speech with emotional expression and multi-speaker support',
        category: 'text-to-speech',
        version: '1.5',
        provider: 'VibeVoice',
        capabilities: ['text-to-speech', 'multi-speaker'],
        limits: {
            maxInputSize: '2048 characters',
            rateLimit: {
                requestsPerMinute: 30,
                requestsPerHour: 300,
            },
            costPerRequest: 0.01,
        },
        requiresAuth: true,
        status: 'active',
        voices: [
            {
                id: 'frank-en',
                name: 'Frank [EN]',
                gender: 'male',
                age: 'adult',
                quality: 'premium',
            },
            {
                id: 'carter-en',
                name: 'Carter [EN]',
                gender: 'male',
                age: 'adult',
                quality: 'premium',
            },
            {
                id: 'sarah-en',
                name: 'Sarah [EN]',
                gender: 'female',
                age: 'adult',
                quality: 'premium',
            },
            {
                id: 'emma-en',
                name: 'Emma [EN]',
                gender: 'female',
                age: 'adult',
                quality: 'premium',
            },
        ],
        languages: ['en'],
        supportedFormats: ['mp3', 'wav'],
        maxTextLength: 2048,
        speedRange: {
            min: 0.5,
            max: 2.0,
        },
        features: {
            emotions: true,
            multiSpeaker: true,
            customVoices: false,
            voiceCloning: false,
        },
        requiresScript: true,
        maxSpeakers: 4,
    } as TextToSpeechModel
}
/**
 * Initialize the model discovery service with static registry only
 */
let isInitialized = false;
let discoveryPromise: Promise<void> | null = null;

async function initializeDiscovery() {
    if (isInitialized) return;

    try {
        if (!discoveryPromise) {
            discoveryPromise = modelDiscoveryService.initialize(staticRegistry);
        }
        await discoveryPromise;
        console.log('[ModelRegistry] Initialized successfully');
    } catch (error) {
        console.warn('[ModelRegistry] Failed to initialize discovery service, using static registry:', error);
    } finally {
        isInitialized = true;
    }
}

/**
 * Get a model by its ID from the static registry
 */
export async function getModel(id: string): Promise<ModelMetadata | null> {
    await initializeDiscovery();
    return modelDiscoveryService.getModel(id, staticRegistry);
}

/**
 * Get all models from the static registry
 */
export async function getAllModels(): Promise<ModelMetadata[]> {
    await initializeDiscovery();
    return Object.values(modelDiscoveryService.getAllModels(staticRegistry));
}

/**
 * Get models by category from the static registry
 */
export async function getModelsByCategory(category: ModelMetadata['category']): Promise<ModelMetadata[]> {
    await initializeDiscovery();
    return modelDiscoveryService.getModelsByCategory(category, staticRegistry);
}

/**
 * Check if a model exists in the static registry
 */
export async function modelExists(id: string): Promise<boolean> {
    await initializeDiscovery();
    return modelDiscoveryService.modelExists(id, staticRegistry);
}

/**
 * Get all available model IDs from the static registry
 */
export async function getAvailableModelIds(): Promise<string[]> {
    await initializeDiscovery();
    return modelDiscoveryService.getAllModelIds(staticRegistry);
}

/**
 * Get default parameters for a model from the static registry
 */
export async function getDefaultParams(id: string): Promise<Partial<ModelInput> | null> {
    await initializeDiscovery();

    // Try to get model from discovery service first, then fallback to static registry
    let model = modelDiscoveryService.getModel(id);
    if (!model) {
        model = staticRegistry[id];
    }

    if (!model) return null;

    switch (model.category) {
        case 'image-generation':
            return {
                width: 1024,
                height: 1024,
                numImages: 1,
                guidanceScale: 7.5,
                numInferenceSteps: 20,
                quality: 'standard',
                format: 'png',
            };
        case 'video-generation': {
            const videoModel = model as unknown as VideoGenerationModel;
            const defaultDuration = (videoModel.supportedInputs?.durations && videoModel.supportedInputs.durations.length > 0)
                ? (typeof videoModel.supportedInputs.durations[0] === 'string' ? 8 : videoModel.supportedInputs.durations[0])
                : 4;
            const defaultFps = (videoModel.supportedInputs?.fps && videoModel.supportedInputs.fps.length > 0)
                ? videoModel.supportedInputs.fps[0]
                : 10;
            return {
                duration: defaultDuration,
                width: 1024,
                height: 576,
                fps: defaultFps,
                numVideos: 1,
                quality: 'standard',
            };
        }
        case 'text-to-speech':
            return {
                speed: 1.0,
                pitch: 0,
                volume: 1.0,
                format: 'mp3',
            };
        case 'speech-to-text':
            return {
                includeTimestamps: false,
                diarize: false,
                model: 'large',
                temperature: 0,
            };
        case 'audio-generation':
            return {
                duration: 10,
                format: 'mp3',
                sampleRate: 44100,
            };
        case 'image-editing': {
            const editModel = model as ImageEditingModel;

            // Check if this model has a custom input schema
            if (editModel.customInputSchema) {
                // For custom schemas, return defaults from the schema
                const defaults: any = {};
                Object.entries(editModel.customInputSchema).forEach(([fieldId, fieldSchema]) => {
                    if (fieldSchema.default !== undefined) {
                        defaults[fieldId] = fieldSchema.default;
                    }
                });
                return defaults;
            } else {
                // Standard image editing defaults
                return {
                    strength: 0.75,
                    guidanceScale: 7.5,
                    numInferenceSteps: 20,
                };
            }
        }
        default:
            return {};
    }
}

/**
 * Validate input parameters for a model from the static registry
 */
export async function validateInput(id: string, input: ModelInput): Promise<{ valid: boolean; errors: string[] }> {
    await initializeDiscovery();

    // Try to get model from discovery service first, then fallback to static registry
    let model = modelDiscoveryService.getModel(id);
    if (!model) {
        model = staticRegistry[id];
    }

    if (!model) {
        return { valid: false, errors: [`Model ${id} not found`] };
    }

    const errors: string[] = [];

    // Category-specific validation
    switch (model.category) {
        case 'image-generation': {
            const imgInput = input as any;
            if (!imgInput.prompt) errors.push('Prompt is required');
            if (imgInput.width && imgInput.height) {
                const maxRes = model.supportedOutputs.maxResolution;
                const [maxW, maxH] = maxRes.split('x').map(Number);
                if (imgInput.width > maxW || imgInput.height > maxH) {
                    errors.push(`Dimensions exceed maximum resolution ${maxRes}`);
                }
            }
            break;
        }
        case 'video-generation': {
            const vidInput = input as any;
            const supports = (model as any).supportedInputs || {};

            // Require appropriate primary input based on model capabilities
            const needsPromptOnly = supports.textPrompt && !supports.imagePrompt && !supports.videoPrompt;
            const needsImageOnly = supports.imagePrompt && !supports.textPrompt && !supports.videoPrompt;
            const allowsAny = (supports.textPrompt || false) || (supports.imagePrompt || false) || (supports.videoPrompt || false);

            if (needsPromptOnly && !vidInput.prompt) {
                errors.push('Prompt is required');
            }

            if (needsImageOnly && !vidInput.imageUrl && !vidInput.image_url) {
                errors.push('Image URL is required');
            }

            if (!needsPromptOnly && !needsImageOnly && allowsAny) {
                if (!vidInput.prompt && !vidInput.imageUrl && !vidInput.image_url && !vidInput.videoUrl && !vidInput.video_url) {
                    errors.push('Provide one of: prompt, imageUrl, or videoUrl');
                }
            }

            if (vidInput.fps && Array.isArray(supports.fps) && supports.fps.length > 0 && !supports.fps.includes(Number(vidInput.fps))) {
                errors.push(`FPS not supported. Available: ${supports.fps.join(', ')}`);
            }

            if (vidInput.duration && Array.isArray(supports.durations) && supports.durations.length > 0 && !supports.durations.includes(vidInput.duration)) {
                errors.push(`Duration not supported. Available: ${supports.durations.join(', ')}`);
            }
            break;
        }
        case 'text-to-speech': {
            const ttsInput = input as any;
            const ttsModel = model as TextToSpeechModel;

            if (ttsModel.requiresScript) {
                if (!ttsInput.script) errors.push('Script is required');
                if (ttsInput.script && ttsInput.script.length > ttsModel.maxTextLength) {
                    errors.push(`Script exceeds maximum length of ${ttsModel.maxTextLength} characters`);
                }
                if (!ttsInput.speakers || ttsInput.speakers.length === 0) {
                    errors.push('At least one speaker voice must be selected');
                }
                // Note: Speaker count validation is handled by the API, not here
            } else {
                if (!ttsInput.text) errors.push('Text is required');
                if (ttsInput.text && ttsInput.text.length > ttsModel.maxTextLength) {
                    errors.push(`Text exceeds maximum length of ${ttsModel.maxTextLength} characters`);
                }
            }

            if (ttsModel.requiresAudioUrl && !ttsInput.audio_url) {
                errors.push('Audio URL is required for voice cloning models');
            }
            break;
        }
        case 'speech-to-text': {
            const sttInput = input as any;
            if (!sttInput.audio) errors.push('Audio is required');
            break;
        }
        case 'audio-generation': {
            const audioInput = input as any;
            if (!audioInput.prompt) errors.push('Prompt is required');
            break;
        }
        case 'image-editing': {
            const editInput = input as any;
            const editModel = model as ImageEditingModel;

            // Check if this model has a custom input schema
            if (editModel.customInputSchema) {
                // For custom schemas, validate based on the schema requirements
                Object.entries(editModel.customInputSchema).forEach(([fieldId, fieldSchema]) => {
                    if (fieldSchema.required) {
                        if (fieldSchema.type === 'array') {
                            // For array fields, check if it's a non-empty array
                            if (!editInput[fieldId] || !Array.isArray(editInput[fieldId]) || editInput[fieldId].length === 0) {
                                errors.push(`${fieldSchema.description} is required`);
                            }
                        } else {
                            // For other fields, check if they exist and are not empty
                            if (!editInput[fieldId] || editInput[fieldId] === '') {
                                const fieldName = fieldSchema.description.split('.')[0] || fieldId;
                                errors.push(`${fieldName} is required`);
                            }
                        }
                    }
                });
            } else {
                // Standard image editing validation
                if (!editInput.image_urls || !Array.isArray(editInput.image_urls) || editInput.image_urls.length === 0) {
                    errors.push('Image URLs are required');
                }
            }
            break;
        }
    }

    return { valid: errors.length === 0, errors };
}

export default staticRegistry;