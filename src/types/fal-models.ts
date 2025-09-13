// Comprehensive TypeScript type definitions for Fal model categories
// Supports image generation, video generation, text-to-speech, and other model types

// ============================================================================
// COMMON TYPES AND INTERFACES
// ============================================================================

/**
 * Base model metadata structure shared across all model types
 */
export interface BaseModelMetadata {
    /** Unique identifier for the model */
    id: string;
    /** Human-readable name of the model */
    name: string;
    /** Brief description of what the model does */
    description: string;
    /** Model category classification */
    category: ModelCategory;
    /** Version of the model */
    version: string;
    /** Provider or creator of the model */
    provider: string;
    /** Model capabilities and features */
    capabilities: string[];
    /** Usage limits and constraints */
    limits?: ModelLimits;
    /** Whether the model requires authentication */
    requiresAuth: boolean;
    /** Model availability status */
    status: ModelStatus;
}

/**
 * Model usage limits and constraints
 */
export interface ModelLimits {
    /** Maximum input size (e.g., "1024x1024" for images, character count for text) */
    maxInputSize?: string;
    /** Maximum output size */
    maxOutputSize?: string;
    /** Rate limiting information */
    rateLimit?: {
        requestsPerMinute: number;
        requestsPerHour: number;
    };
    /** Cost information per request */
    costPerRequest?: number;
}

/**
 * Model availability status
 */
export type ModelStatus = 'active' | 'deprecated' | 'maintenance' | 'disabled';

/**
 * Supported model categories
 */
export type ModelCategory =
    | 'image-generation'
    | 'video-generation'
    | 'text-to-speech'
    | 'speech-to-text'
    | 'text-generation'
    | 'audio-generation'
    | 'image-editing'
    | 'video-editing'
    | 'training'
    | 'other';

/**
 * Common response wrapper for all model outputs
 */
export interface ModelResponse<T = any> {
    /** Unique request identifier */
    requestId: string;
    /** Model that was used */
    model: string;
    /** Timestamp of when the request was processed */
    timestamp: string;
    /** Processing duration in milliseconds */
    duration: number;
    /** Actual model output */
    data: T;
    /** Usage statistics */
    usage?: {
        tokens?: number;
        credits?: number;
        computeTime?: number;
    };
}

// ============================================================================
// IMAGE GENERATION TYPES
// ============================================================================

/**
 * Input parameters for image generation models
 */
export interface ImageGenerationInput {
    /** Text prompt describing the desired image */
    prompt: string;
    /** Negative prompt to avoid certain elements */
    negativePrompt?: string;
    /** Image dimensions */
    width?: number;
    height?: number;
    /** Number of images to generate */
    numImages?: number;
    /** Random seed for reproducible results */
    seed?: number;
    /** Guidance scale for prompt adherence */
    guidanceScale?: number;
    /** Number of inference steps */
    numInferenceSteps?: number;
    /** Style preset or reference */
    style?: string;
    /** Aspect ratio (alternative to width/height) */
    aspectRatio?: string;
    /** Quality settings */
    quality?: 'standard' | 'high' | 'ultra';
    /** Format of the output image */
    format?: 'png' | 'jpg' | 'webp';
    /** Strength for image-to-image generation */
    strength?: number;
    /** Reference image URL for image-to-image */
    imageUrl?: string;
    /** ControlNet or conditioning inputs */
    conditioning?: {
        type: string;
        image: string;
        strength: number;
    }[];
}

/**
 * Output format for image generation models
 */
export interface ImageGenerationOutput {
    /** Array of generated image URLs */
    images: ImageResult[];
    /** Whether the generation was successful */
    success: boolean;
    /** Any warnings or notes */
    warnings?: string[];
}

/**
 * Individual image result
 */
export interface ImageResult {
    /** URL to access the generated image */
    url: string;
    /** Image dimensions */
    width: number;
    height: number;
    /** Content type */
    contentType: string;
    /** File size in bytes */
    fileSize?: number;
    /** Generation seed used */
    seed?: number;
}

/**
 * Image generation model metadata
 */
export interface ImageGenerationModel extends BaseModelMetadata {
    category: 'image-generation';
    /** Supported input formats */
    supportedInputs: {
        textPrompt: boolean;
        imagePrompt: boolean;
        negativePrompt: boolean;
        dimensions: boolean;
        aspectRatios: string[];
        styles: string[];
        controlNet: boolean;
    };
    /** Supported output formats */
    supportedOutputs: {
        formats: ('png' | 'jpg' | 'webp')[];
        maxResolution: string;
        batchSize: number;
    };
}

// ============================================================================
// VIDEO GENERATION TYPES
// ============================================================================

/**
 * Input parameters for video generation models
 */
export interface VideoGenerationInput {
    /** Text prompt describing the desired video */
    prompt: string;
    /** Negative prompt to avoid certain elements */
    negativePrompt?: string;
    /** Duration of the video in seconds */
    duration?: number;
    /** Video dimensions */
    width?: number;
    height?: number;
    /** Frame rate */
    fps?: number;
    /** Number of videos to generate */
    numVideos?: number;
    /** Random seed */
    seed?: number;
    /** Guidance scale */
    guidanceScale?: number;
    /** Number of inference steps */
    numInferenceSteps?: number;
    /** Aspect ratio */
    aspectRatio?: string;
    /** Quality settings */
    quality?: 'standard' | 'high' | 'ultra';
    /** Reference video URL for video-to-video */
    videoUrl?: string;
    /** Reference image URL for image-to-video */
    imageUrl?: string;
    /** Loop video output */
    loop?: boolean;
    /** Motion settings */
    motionSettings?: {
        speed: number;
        smoothness: number;
        cameraMovement?: 'static' | 'pan' | 'zoom' | 'rotate';
    };
}

/**
 * Output format for video generation models
 */
export interface VideoGenerationOutput {
    /** Array of generated video URLs */
    videos: VideoResult[];
    /** Whether the generation was successful */
    success: boolean;
    /** Any warnings or notes */
    warnings?: string[];
}

/**
 * Individual video result
 */
export interface VideoResult {
    /** URL to access the generated video */
    url: string;
    /** Video dimensions */
    width: number;
    height: number;
    /** Duration in seconds */
    duration: number;
    /** Frame rate */
    fps: number;
    /** Content type */
    contentType: string;
    /** File size in bytes */
    fileSize?: number;
    /** Generation seed used */
    seed?: number;
    /** Thumbnail image URL */
    thumbnailUrl?: string;
}

/**
 * Video generation model metadata
 */
export interface VideoGenerationModel extends BaseModelMetadata {
    category: 'video-generation';
    /** Supported input formats */
    supportedInputs: {
        textPrompt: boolean;
        videoPrompt: boolean;
        imagePrompt: boolean;
        negativePrompt: boolean;
        durations: (number | string)[];
        dimensions: boolean;
        aspectRatios: string[];
        fps: number[];
    };
    /** Supported output formats */
    supportedOutputs: {
        formats: ('mp4' | 'webm' | 'gif')[];
        maxResolution: string;
        maxDuration: number;
        batchSize: number;
    };
    /** Custom input schema for models with specific parameter requirements */
    customInputSchema?: Record<string, {
        type: 'string' | 'number' | 'boolean' | 'array';
        required: boolean;
        default?: any;
        enum?: any[];
        description: string;
    }>;
}

// ============================================================================
// TEXT-TO-SPEECH TYPES
// ============================================================================

/**
 * Input parameters for text-to-speech models
 */
export interface TextToSpeechInput {
    /** Text to convert to speech */
    text: string;
    /** Voice identifier or settings */
    voice: string | VoiceSettings;
    /** Speech speed/rate */
    speed?: number;
    /** Speech pitch */
    pitch?: number;
    /** Speech volume */
    volume?: number;
    /** Output format */
    format?: 'mp3' | 'wav' | 'flac' | 'ogg';
    /** Language code */
    language?: string;
    /** Emotion or style settings */
    emotion?: string;
    /** Speaker settings for multi-speaker models */
    speakers?: {
        speakerId: string;
        text: string;
    }[];
}

/**
 * Voice settings for TTS
 */
export interface VoiceSettings {
    /** Voice identifier */
    id: string;
    /** Voice name */
    name: string;
    /** Voice gender */
    gender?: 'male' | 'female' | 'neutral';
    /** Voice age category */
    age?: 'child' | 'young' | 'adult' | 'senior';
    /** Accent or locale */
    accent?: string;
    /** Voice quality */
    quality?: 'standard' | 'premium' | 'ultra';
}

/**
 * Output format for text-to-speech models
 */
export interface TextToSpeechOutput {
    /** URL to access the generated audio */
    audioUrl: string;
    /** Audio duration in seconds */
    duration: number;
    /** Content type */
    contentType: string;
    /** File size in bytes */
    fileSize?: number;
    /** Whether the generation was successful */
    success: boolean;
    /** Any warnings or notes */
    warnings?: string[];
}

/**
 * Text-to-speech model metadata
 */
export interface TextToSpeechModel extends BaseModelMetadata {
    category: 'text-to-speech';
    /** Supported voices */
    voices: VoiceSettings[];
    /** Supported languages */
    languages: string[];
    /** Supported output formats */
    supportedFormats: ('mp3' | 'wav' | 'flac' | 'ogg')[];
    /** Maximum text length */
    maxTextLength: number;
    /** Supported speed range */
    speedRange: {
        min: number;
        max: number;
    };
    /** Supported features */
    features: {
        emotions: boolean;
        multiSpeaker: boolean;
        customVoices: boolean;
        voiceCloning: boolean;
    };
    /** Whether the model requires an audio URL for voice cloning */
    requiresAudioUrl?: boolean;
    /** Minimum audio duration in seconds for conditioning audio */
    minAudioDuration?: number;
    /** Whether the model requires a script format instead of plain text */
    requiresScript?: boolean;
    /** Maximum number of speakers supported */
    maxSpeakers?: number;
}

// ============================================================================
// SPEECH-TO-TEXT TYPES
// ============================================================================

/**
 * Input parameters for speech-to-text models
 */
export interface SpeechToTextInput {
    /** Audio file URL or base64 encoded audio */
    audio: string;
    /** Audio format */
    format?: 'mp3' | 'wav' | 'flac' | 'ogg' | 'm4a';
    /** Language code for transcription */
    language?: string;
    /** Whether to include timestamps */
    includeTimestamps?: boolean;
    /** Whether to include speaker diarization */
    diarize?: boolean;
    /** Number of speakers (for diarization) */
    numSpeakers?: number;
    /** Model size or quality */
    model?: 'tiny' | 'base' | 'small' | 'medium' | 'large';
    /** Temperature for randomness in transcription */
    temperature?: number;
}

/**
 * Output format for speech-to-text models
 */
export interface SpeechToTextOutput {
    /** Transcribed text */
    text: string;
    /** Confidence score */
    confidence: number;
    /** Language detected */
    language?: string;
    /** Duration of audio */
    duration: number;
    /** Segments with timestamps */
    segments?: TranscriptionSegment[];
    /** Speaker information (if diarization enabled) */
    speakers?: SpeakerInfo[];
    /** Whether the transcription was successful */
    success: boolean;
    /** Any warnings or notes */
    warnings?: string[];
}

/**
 * Transcription segment with timing
 */
export interface TranscriptionSegment {
    /** Start time in seconds */
    start: number;
    /** End time in seconds */
    end: number;
    /** Text content */
    text: string;
    /** Confidence score */
    confidence: number;
    /** Speaker ID (if diarization enabled) */
    speaker?: string;
}

/**
 * Speaker information for diarization
 */
export interface SpeakerInfo {
    /** Speaker identifier */
    speaker: string;
    /** Speaker label or name */
    label?: string;
    /** Segments spoken by this speaker */
    segments: number[];
}

/**
 * Speech-to-text model metadata
 */
export interface SpeechToTextModel extends BaseModelMetadata {
    category: 'speech-to-text';
    /** Supported input formats */
    supportedFormats: ('mp3' | 'wav' | 'flac' | 'ogg' | 'm4a')[];
    /** Supported languages */
    languages: string[];
    /** Maximum audio duration in seconds */
    maxDuration: number;
    /** Supported features */
    features: {
        timestamps: boolean;
        diarization: boolean;
        multipleLanguages: boolean;
        customVocabulary: boolean;
    };
    /** Available model sizes */
    modelSizes: ('tiny' | 'base' | 'small' | 'medium' | 'large')[];
}

// ============================================================================
// AUDIO GENERATION TYPES
// ============================================================================

/**
 * Input parameters for audio generation models
 */
export interface AudioGenerationInput {
    /** Text prompt for audio generation */
    prompt: string;
    /** Duration in seconds */
    duration?: number;
    /** Audio format */
    format?: 'mp3' | 'wav' | 'flac';
    /** Sample rate */
    sampleRate?: number;
    /** Number of channels */
    channels?: 1 | 2;
    /** Genre or style */
    genre?: string;
    /** Mood or emotion */
    mood?: string;
    /** Instrumentation */
    instruments?: string[];
    /** BPM for rhythmic audio */
    bpm?: number;
}

/**
 * Output format for audio generation models
 */
export interface AudioGenerationOutput {
    /** URL to access the generated audio */
    audioUrl: string;
    /** Audio duration in seconds */
    duration: number;
    /** Content type */
    contentType: string;
    /** File size in bytes */
    fileSize?: number;
    /** Whether the generation was successful */
    success: boolean;
    /** Any warnings or notes */
    warnings?: string[];
}

/**
 * Audio generation model metadata
 */
export interface AudioGenerationModel extends BaseModelMetadata {
    category: 'audio-generation';
    /** Supported output formats */
    supportedFormats: ('mp3' | 'wav' | 'flac')[];
    /** Supported sample rates */
    sampleRates: number[];
    /** Maximum duration in seconds */
    maxDuration: number;
    /** Supported genres */
    genres: string[];
    /** Supported features */
    features: {
        textToMusic: boolean;
        genreControl: boolean;
        moodControl: boolean;
        instrumentControl: boolean;
        bpmControl: boolean;
    };
}

// ============================================================================
// IMAGE EDITING TYPES
// ============================================================================

/**
 * Input parameters for image editing models
 */
export interface ImageEditingInput {
    /** Source image URL */
    imageUrl: string;
    /** Editing instruction or prompt */
    prompt: string;
    /** Mask image URL (for inpainting) */
    maskUrl?: string;
    /** Editing strength */
    strength?: number;
    /** Denoising strength */
    denoisingStrength?: number;
    /** Output format */
    format?: 'png' | 'jpg' | 'webp';
    /** Editing mode */
    mode?: 'inpaint' | 'outpaint' | 'super-resolution' | 'colorize' | 'restore';
}

/**
 * Output format for image editing models
 */
export interface ImageEditingOutput {
    /** URL to access the edited image */
    imageUrl: string;
    /** Image dimensions */
    width: number;
    height: number;
    /** Content type */
    contentType: string;
    /** File size in bytes */
    fileSize?: number;
    /** Whether the editing was successful */
    success: boolean;
    /** Any warnings or notes */
    warnings?: string[];
}

/**
 * Image editing model metadata
 */
export interface ImageEditingModel extends BaseModelMetadata {
    category: 'image-editing';
    /** Supported editing modes */
    supportedModes: ('inpaint' | 'outpaint' | 'super-resolution' | 'colorize' | 'restore')[];
    /** Maximum input resolution */
    maxResolution: string;
    /** Supported input formats */
    supportedInputs: ('png' | 'jpg' | 'webp')[];
    /** Supported output formats */
    supportedOutputs: ('png' | 'jpg' | 'webp')[];
    /** Custom input schema for models with specific parameter requirements */
    customInputSchema?: Record<string, {
        type: 'string' | 'number' | 'boolean' | 'array';
        required: boolean;
        default?: any;
        enum?: any[];
        minimum?: number;
        maximum?: number;
        description: string;
    }>;
}

// ============================================================================
// TRAINING TYPES
// ============================================================================

/**
 * Input parameters for training models
 */
export interface TrainingInput {
    /** Images for training */
    images: string[];
    /** Training prompt or description */
    prompt?: string;
    /** Number of training steps */
    steps?: number;
    /** Learning rate */
    learningRate?: number;
    /** Training type */
    trainingType?: 'lora' | 'dreambooth' | 'textual-inversion';
    /** Trigger word for the trained model */
    triggerWord?: string;
    /** Base model to fine-tune */
    baseModel?: string;
}

/**
 * Output format for training models
 */
export interface TrainingOutput {
    /** URL to the trained model file */
    modelUrl: string;
    /** Model format */
    format: string;
    /** Training metadata */
    metadata: {
        steps: number;
        learningRate: number;
        triggerWord?: string;
        trainingTime: number;
    };
    /** Whether the training was successful */
    success: boolean;
    /** Any warnings or notes */
    warnings?: string[];
}

/**
 * Training model metadata
 */
export interface TrainingModel extends BaseModelMetadata {
    category: 'training';
    /** Supported training types */
    supportedTrainingTypes: ('lora' | 'dreambooth' | 'textual-inversion')[];
    /** Maximum number of training images */
    maxImages: number;
    /** Supported input formats for training images */
    supportedInputs: {
        textPrompt: boolean;
        imagePrompt: boolean;
        negativePrompt: boolean;
        dimensions: boolean;
        aspectRatios: string[];
        styles: string[];
        controlNet: boolean;
    };
    /** Supported output formats */
    supportedOutputs: {
        formats: ('safetensors' | 'ckpt' | 'bin')[];
        maxResolution: string;
        batchSize: number;
    };
}

// ============================================================================
// UNIFIED MODEL TYPE
// ============================================================================

/**
 * Union type for all model metadata
 */
export type ModelMetadata =
    | ImageGenerationModel
    | VideoGenerationModel
    | TextToSpeechModel
    | SpeechToTextModel
    | AudioGenerationModel
    | ImageEditingModel
    | TrainingModel;

/**
 * Union type for all input parameters
 */
export type ModelInput =
    | ImageGenerationInput
    | VideoGenerationInput
    | TextToSpeechInput
    | SpeechToTextInput
    | AudioGenerationInput
    | ImageEditingInput
    | TrainingInput;

/**
 * Union type for all output formats
 */
export type ModelOutput =
    | ImageGenerationOutput
    | VideoGenerationOutput
    | TextToSpeechOutput
    | SpeechToTextOutput
    | AudioGenerationOutput
    | ImageEditingOutput
    | TrainingOutput;

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

/**
 * Generic API request wrapper
 */
export interface FalRequest<T extends ModelInput = ModelInput> {
    /** Model identifier */
    model: string;
    /** Model-specific input parameters */
    input: T;
    /** Request options */
    options?: {
        /** Webhook URL for async processing */
        webhookUrl?: string;
        /** Whether to process asynchronously */
        async?: boolean;
        /** Priority level */
        priority?: 'low' | 'normal' | 'high';
        /** Custom metadata */
        metadata?: Record<string, any>;
    };
}

/**
 * Generic API response wrapper
 */
export interface FalResponse<T extends ModelOutput = ModelOutput> {
    /** Request identifier */
    requestId: string;
    /** Processing status */
    status: 'success' | 'failure' | 'pending';
    /** Model output data */
    data?: T;
    /** Error information (if status is failure) */
    error?: {
        code: string;
        message: string;
        details?: any;
    };
    /** Processing logs */
    logs?: string[];
}