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
        description: 'Google\'s state-of-the-art image generation and editing model with high-quality outputs',
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
        case 'image-editing':
            return {
                strength: 0.75,
                guidanceScale: 7.5,
                numInferenceSteps: 20,
            };
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
            if (!editInput.imageUrl) errors.push('Image URL is required');
            break;
        }
    }

    return { valid: errors.length === 0, errors };
}

export default staticRegistry;