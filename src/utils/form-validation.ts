import { ModelMetadata } from '@/types/fal-models';
import { validateInput, getDefaultParams } from '@/registry/model-registry';
import { FormData, FormErrors, FormValidationResult } from '@/types/form-fields';

/**
 * Validates form data against model requirements (async version)
 */
export async function validateFormData(
    formData: FormData,
    model: ModelMetadata
): Promise<FormValidationResult> {
    const errors: FormErrors = {};

    // Convert form data to model input format
    const modelInput = formDataToModelInput(formData, model);

    // Use existing model validation
    const modelValidation = await validateInput(model.id, modelInput);

    if (!modelValidation.valid) {
        // Map model validation errors back to form field errors
        Object.entries(modelValidation.errors).forEach(([field, error]) => {
            errors[field] = error;
        });
    }

    // Additional form-specific validations
    const formValidation = validateFormFields(formData, model);
    Object.assign(errors, formValidation.errors);

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
}

/**
 * Validates form data against model requirements (sync version that works with cached data)
 * Falls back to async version if cache is stale
 */
export function validateFormDataSync(
    formData: FormData,
    model: ModelMetadata
): FormValidationResult | Promise<FormValidationResult> {
    // For now, just use the async version
    // In a real implementation, this could check if the model data is cached locally
    return validateFormData(formData, model);
}

/**
 * Converts form data to model input format expected by the API
 */
export function formDataToModelInput(
    formData: FormData,
    model: ModelMetadata
): any {
    const input: any = {};

    // Map form fields to model input based on model category
    switch (model.category) {
        case 'image-generation':
            if (formData.prompt) input.prompt = formData.prompt;
            if (formData.negativePrompt) input.negative_prompt = formData.negativePrompt;
            if (formData.width) input.width = Number(formData.width);
            if (formData.height) input.height = Number(formData.height);
            if (formData.aspectRatio) input.aspect_ratio = formData.aspectRatio;
            if (formData.numImages) input.num_images = Number(formData.numImages);
            if (formData.seed !== undefined && formData.seed !== '') input.seed = Number(formData.seed);
            if (formData.style) input.style = formData.style;
            if (formData.format) input.format = formData.format;
            if (formData.guidanceScale) input.guidance_scale = Number(formData.guidanceScale);
            if (formData.numInferenceSteps) input.num_inference_steps = Number(formData.numInferenceSteps);
            if (formData.imageUrl) input.image_url = formData.imageUrl;
            break;

        case 'video-generation':
            if (formData.prompt) input.prompt = formData.prompt;
            if (formData.negativePrompt) input.negative_prompt = formData.negativePrompt;
            if (formData.duration) input.duration = Number(formData.duration);
            if (formData.width) input.width = Number(formData.width);
            if (formData.height) input.height = Number(formData.height);
            if (formData.aspectRatio) input.aspect_ratio = formData.aspectRatio;
            if (formData.fps) input.fps = Number(formData.fps);
            if (formData.seed !== undefined && formData.seed !== '') input.seed = Number(formData.seed);
            if (formData.loop !== undefined) input.loop = formData.loop;
            if (formData.imageUrl) input.image_url = formData.imageUrl;
            break;

        case 'text-to-speech':
            if (formData.text) input.text = formData.text;
            if (formData.voice) input.voice = formData.voice;
            if (formData.speed) input.speed = Number(formData.speed);
            if (formData.language) input.language = formData.language;
            if (formData.emotion) input.emotion = formData.emotion;
            break;

        case 'speech-to-text':
            if (formData.audio) input.audio = formData.audio;
            if (formData.language) input.language = formData.language;
            if (formData.includeTimestamps !== undefined) input.include_timestamps = formData.includeTimestamps;
            if (formData.diarize !== undefined) input.diarize = formData.diarize;
            if (formData.numSpeakers) input.num_speakers = Number(formData.numSpeakers);
            break;

        case 'audio-generation':
            if (formData.prompt) input.prompt = formData.prompt;
            if (formData.duration) input.duration = Number(formData.duration);
            if (formData.sampleRate) input.sample_rate = Number(formData.sampleRate);
            if (formData.genre) input.genre = formData.genre;
            break;

        default:
            // Generic mapping for unsupported model types
            Object.assign(input, formData);
    }

    return input;
}

/**
 * Additional form field validations not covered by model validation
 */
function validateFormFields(
    formData: FormData,
    model: ModelMetadata
): FormValidationResult {
    const errors: FormErrors = {};

    // File size validation for file uploads
    Object.entries(formData).forEach(([key, value]) => {
        if (value instanceof File) {
            const maxSize = getMaxFileSizeForField(key, model);
            if (maxSize && value.size > maxSize) {
                errors[key] = `File size must be less than ${formatFileSize(maxSize)}`;
            }
        } else if (Array.isArray(value) && value.length > 0 && value[0] instanceof File) {
            const maxSize = getMaxFileSizeForField(key, model);
            if (maxSize) {
                value.forEach((file, index) => {
                    if (file.size > maxSize) {
                        errors[`${key}_${index}`] = `File size must be less than ${formatFileSize(maxSize)}`;
                    }
                });
            }
        }
    });

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
}

/**
 * Gets maximum file size for a specific field based on model configuration
 */
function getMaxFileSizeForField(fieldId: string, model: ModelMetadata): number | null {
    // Check model limits for file size constraints
    if (model.limits?.maxInputSize) {
        // Convert size string to bytes (e.g., "25MB" -> 26214400)
        const sizeMatch = model.limits.maxInputSize.match(/^(\d+)([KMGT]?)B?$/i);
        if (sizeMatch) {
            const [, size, unit] = sizeMatch;
            const multiplier = { K: 1024, M: 1024 ** 2, G: 1024 ** 3, T: 1024 ** 4 }[unit.toUpperCase()] || 1;
            return Number(size) * multiplier;
        }
    }

    // Default limits based on field type
    switch (fieldId) {
        case 'audio':
            return 25 * 1024 * 1024; // 25MB for audio files
        case 'image':
            return 10 * 1024 * 1024; // 10MB for images
        case 'video':
            return 100 * 1024 * 1024; // 100MB for videos
        default:
            return null;
    }
}

/**
 * Formats file size in human readable format
 */
function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Gets default values for form fields from model configuration (async version)
 */
export async function getFormDefaults(model: ModelMetadata): Promise<FormData> {
    const defaults = await getDefaultParams(model.id) || {};

    // Convert model defaults to form format
    const formDefaults: FormData = {};

    Object.entries(defaults).forEach(([key, value]) => {
        // Convert snake_case to camelCase for form fields
        const formKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
        formDefaults[formKey] = value;
    });

    return formDefaults;
}

/**
 * Gets default values for form fields from model configuration (sync version that works with cached data)
 * Falls back to async version if cache is stale
 */
export function getFormDefaultsSync(model: ModelMetadata): FormData | Promise<FormData> {
    // For now, just use the async version
    return getFormDefaults(model);
}