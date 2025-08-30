import { ModelMetadata, ImageGenerationModel, VideoGenerationModel, TextToSpeechModel, SpeechToTextModel, AudioGenerationModel } from '@/types/fal-models';
import { FormConfig, FieldConfig } from '@/types/form-fields';

/**
 * Converts a Fal model metadata into a dynamic form configuration
 */
export function modelToFormConfig(model: ModelMetadata): FormConfig {
    const config: FormConfig = {
        id: `form-${model.id}`,
        title: model.name,
        description: model.description,
        sections: []
    };

    // Add fields based on model category
    switch (model.category) {
        case 'image-generation':
            config.sections = buildImageGenerationSections(model as ImageGenerationModel);
            break;
        case 'video-generation':
            config.sections = buildVideoGenerationSections(model as VideoGenerationModel);
            break;
        case 'text-to-speech':
            config.sections = buildTextToSpeechSections(model as TextToSpeechModel);
            break;
        case 'speech-to-text':
            config.sections = buildSpeechToTextSections(model as SpeechToTextModel);
            break;
        case 'audio-generation':
            config.sections = buildAudioGenerationSections(model as AudioGenerationModel);
            break;
        default:
            config.sections = buildDefaultSections(model);
    }

    return config;
}

function buildImageGenerationSections(model: ImageGenerationModel): any[] {
    const sections = [];

    // Basic prompt section
    const basicFields: FieldConfig[] = [];

    if (model.supportedInputs.textPrompt) {
        basicFields.push({
            id: 'prompt',
            label: 'Prompt',
            type: 'textarea',
            description: 'Describe the image you want to generate',
            required: true,
            placeholder: 'A beautiful landscape with mountains and a lake...'
        });
    }

    if (model.supportedInputs.negativePrompt) {
        basicFields.push({
            id: 'negativePrompt',
            label: 'Negative Prompt',
            type: 'textarea',
            description: 'Describe what you want to avoid in the image',
            placeholder: 'blurry, low quality, distorted...'
        });
    }

    if (basicFields.length > 0) {
        sections.push({
            id: 'basic',
            title: 'Basic Settings',
            fields: basicFields
        });
    }

    // Dimensions section
    const dimensionFields: FieldConfig[] = [];

    if (model.supportedInputs.dimensions) {
        dimensionFields.push(
            {
                id: 'width',
                label: 'Width',
                type: 'number',
                description: 'Image width in pixels',
                min: 256,
                max: 2048,
                step: 64,
                unit: 'px',
                defaultValue: 1024
            },
            {
                id: 'height',
                label: 'Height',
                type: 'number',
                description: 'Image height in pixels',
                min: 256,
                max: 2048,
                step: 64,
                unit: 'px',
                defaultValue: 1024
            }
        );
    }

    if (model.supportedInputs.aspectRatios && model.supportedInputs.aspectRatios.length > 0) {
        dimensionFields.push({
            id: 'aspectRatio',
            label: 'Aspect Ratio',
            type: 'select',
            description: 'Choose the aspect ratio for your image',
            options: model.supportedInputs.aspectRatios.map(ratio => ({
                value: ratio,
                label: ratio
            })),
            defaultValue: '1:1'
        });
    }

    if (dimensionFields.length > 0) {
        sections.push({
            id: 'dimensions',
            title: 'Dimensions',
            fields: dimensionFields
        });
    }

    // Advanced settings
    const advancedFields: FieldConfig[] = [];

    if (model.supportedOutputs.formats.length > 1) {
        advancedFields.push({
            id: 'format',
            label: 'Output Format',
            type: 'select',
            options: model.supportedOutputs.formats.map(format => ({
                value: format,
                label: format.toUpperCase()
            })),
            defaultValue: 'png'
        });
    }

    if (model.supportedInputs.styles && model.supportedInputs.styles.length > 0) {
        advancedFields.push({
            id: 'style',
            label: 'Style',
            type: 'select',
            description: 'Choose the artistic style',
            options: model.supportedInputs.styles.map(style => ({
                value: style,
                label: style.charAt(0).toUpperCase() + style.slice(1)
            }))
        });
    }

    advancedFields.push(
        {
            id: 'numImages',
            label: 'Number of Images',
            type: 'number',
            description: 'How many images to generate',
            min: 1,
            max: model.supportedOutputs.batchSize,
            defaultValue: 1
        },
        {
            id: 'seed',
            label: 'Seed',
            type: 'number',
            description: 'Random seed for reproducible results',
            min: 0,
            max: 999999,
            placeholder: 'Leave empty for random'
        }
    );

    if (advancedFields.length > 0) {
        sections.push({
            id: 'advanced',
            title: 'Advanced Settings',
            collapsible: true,
            collapsed: true,
            fields: advancedFields
        });
    }

    return sections;
}

function buildVideoGenerationSections(model: VideoGenerationModel): any[] {
    const sections = [];

    // Basic settings
    const basicFields: FieldConfig[] = [];

    // Image-to-video input when required/supported
    if (model.supportedInputs.imagePrompt && !model.supportedInputs.textPrompt && !model.supportedInputs.videoPrompt) {
        basicFields.push({
            id: 'imageUrl',
            label: 'Image URL',
            type: 'text',
            description: 'Public URL of the source image for image-to-video',
            required: true,
            placeholder: 'https://example.com/your-image.jpg',
            validation: {
                pattern: '^https?://'
            }
        });
    }

    if (model.supportedInputs.textPrompt) {
        basicFields.push({
            id: 'prompt',
            label: 'Prompt',
            type: 'textarea',
            description: 'Describe the video you want to generate',
            required: true,
            placeholder: 'A beautiful sunset over the ocean...'
        });
    }

    if (model.supportedInputs.negativePrompt) {
        basicFields.push({
            id: 'negativePrompt',
            label: 'Negative Prompt',
            type: 'textarea',
            description: 'Describe what you want to avoid in the video',
            placeholder: 'blurry, low quality, distorted...'
        });
    }

    if (model.supportedInputs.durations && model.supportedInputs.durations.length > 0) {
        basicFields.push({
            id: 'duration',
            label: 'Duration',
            type: 'select',
            description: 'Video duration in seconds',
            options: model.supportedInputs.durations.map(duration => ({
                value: duration,
                label: `${duration} seconds`
            })),
            defaultValue: model.supportedInputs.durations[0]
        });
    } else {
        // Fallback numeric duration if model doesn't enumerate durations
        basicFields.push({
            id: 'duration',
            label: 'Duration (seconds)',
            type: 'number',
            description: 'Length in seconds; typical range 1-6',
            min: 1,
            max: 6,
            step: 1,
            defaultValue: 4
        });
    }

    if (basicFields.length > 0) {
        sections.push({
            id: 'basic',
            title: 'Basic Settings',
            fields: basicFields
        });
    }

    // Video settings
    const videoFields: FieldConfig[] = [];

    if (model.supportedInputs.dimensions) {
        videoFields.push(
            {
                id: 'width',
                label: 'Width',
                type: 'number',
                min: 256,
                max: 2048,
                step: 64,
                unit: 'px',
                defaultValue: 1024
            },
            {
                id: 'height',
                label: 'Height',
                type: 'number',
                min: 256,
                max: 2048,
                step: 64,
                unit: 'px',
                defaultValue: 576
            }
        );
    }

    if (model.supportedInputs.fps && model.supportedInputs.fps.length > 0) {
        videoFields.push({
            id: 'fps',
            label: 'Frame Rate',
            type: 'select',
            description: 'Frames per second',
            options: model.supportedInputs.fps.map(fps => ({
                value: fps,
                label: `${fps} FPS`
            })),
            defaultValue: model.supportedInputs.fps[0]
        });
    }

    if (videoFields.length > 0) {
        sections.push({
            id: 'video',
            title: 'Video Settings',
            fields: videoFields
        });
    }

    return sections;
}

function buildTextToSpeechSections(model: TextToSpeechModel): any[] {
    const sections = [];

    // Basic settings
    const basicFields: FieldConfig[] = [
        {
            id: 'text',
            label: 'Text to Speak',
            type: 'textarea',
            description: 'Enter the text you want to convert to speech',
            required: true,
            validation: {
                maxLength: model.maxTextLength
            }
        }
    ];

    if (model.voices.length > 0) {
        basicFields.push({
            id: 'voice',
            label: 'Voice',
            type: 'select',
            description: 'Choose a voice for the speech',
            options: model.voices.map(voice => ({
                value: voice.id,
                label: voice.name
            })),
            defaultValue: model.voices[0]?.id
        });
    }

    sections.push({
        id: 'basic',
        title: 'Basic Settings',
        fields: basicFields
    });

    // Advanced settings
    const advancedFields: FieldConfig[] = [];

    if (model.speedRange) {
        advancedFields.push({
            id: 'speed',
            label: 'Speed',
            type: 'slider',
            description: 'Speech speed',
            min: model.speedRange.min,
            max: model.speedRange.max,
            step: 0.1,
            defaultValue: 1.0
        });
    }

    if (model.languages.length > 1) {
        advancedFields.push({
            id: 'language',
            label: 'Language',
            type: 'select',
            options: model.languages.map(lang => ({
                value: lang,
                label: lang.toUpperCase()
            }))
        });
    }

    if (advancedFields.length > 0) {
        sections.push({
            id: 'advanced',
            title: 'Advanced Settings',
            collapsible: true,
            collapsed: true,
            fields: advancedFields
        });
    }

    return sections;
}

function buildSpeechToTextSections(model: SpeechToTextModel): any[] {
    const sections = [];

    // Audio input
    const audioFields: FieldConfig[] = [
        {
            id: 'audio',
            label: 'Audio File',
            type: 'audio',
            description: 'Upload an audio file for transcription',
            required: true,
            accept: model.supportedFormats.join(',')
        }
    ];

    if (model.languages.length > 1) {
        audioFields.push({
            id: 'language',
            label: 'Language',
            type: 'select',
            description: 'Select the language of the audio',
            options: model.languages.map(lang => ({
                value: lang,
                label: lang.toUpperCase()
            }))
        });
    }

    sections.push({
        id: 'audio',
        title: 'Audio Input',
        fields: audioFields
    });

    // Advanced settings
    const advancedFields: FieldConfig[] = [];

    if (model.features.timestamps) {
        advancedFields.push({
            id: 'includeTimestamps',
            label: 'Include Timestamps',
            type: 'boolean',
            description: 'Include timestamps for each word or segment'
        });
    }

    if (model.features.diarization) {
        advancedFields.push(
            {
                id: 'diarize',
                label: 'Speaker Diarization',
                type: 'boolean',
                description: 'Identify different speakers in the audio'
            },
            {
                id: 'numSpeakers',
                label: 'Number of Speakers',
                type: 'number',
                description: 'Expected number of speakers (optional)',
                min: 1,
                max: 10
            }
        );
    }

    if (advancedFields.length > 0) {
        sections.push({
            id: 'advanced',
            title: 'Advanced Settings',
            collapsible: true,
            collapsed: true,
            fields: advancedFields
        });
    }

    return sections;
}

function buildAudioGenerationSections(model: AudioGenerationModel): any[] {
    const sections = [];

    // Basic settings
    const basicFields: FieldConfig[] = [
        {
            id: 'prompt',
            label: 'Description',
            type: 'textarea',
            description: 'Describe the music or audio you want to generate',
            required: true,
            placeholder: 'A calm piano melody with soft strings...'
        }
    ];

    if (model.maxDuration) {
        basicFields.push({
            id: 'duration',
            label: 'Duration',
            type: 'number',
            description: 'Duration in seconds',
            min: 1,
            max: model.maxDuration,
            unit: 'seconds',
            defaultValue: 30
        });
    }

    sections.push({
        id: 'basic',
        title: 'Basic Settings',
        fields: basicFields
    });

    // Audio settings
    const audioFields: FieldConfig[] = [];

    if (model.sampleRates && model.sampleRates.length > 0) {
        audioFields.push({
            id: 'sampleRate',
            label: 'Sample Rate',
            type: 'select',
            description: 'Audio sample rate',
            options: model.sampleRates.map(rate => ({
                value: rate,
                label: `${rate} Hz`
            })),
            defaultValue: model.sampleRates[0]
        });
    }

    if (model.genres && model.genres.length > 0) {
        audioFields.push({
            id: 'genre',
            label: 'Genre',
            type: 'select',
            description: 'Music genre',
            options: model.genres.map(genre => ({
                value: genre,
                label: genre.charAt(0).toUpperCase() + genre.slice(1)
            }))
        });
    }

    if (audioFields.length > 0) {
        sections.push({
            id: 'audio',
            title: 'Audio Settings',
            fields: audioFields
        });
    }

    return sections;
}

function buildDefaultSections(model: ModelMetadata): any[] {
    // Fallback for unsupported model types
    return [
        {
            id: 'default',
            title: 'Input',
            fields: [
                {
                    id: 'input',
                    label: 'Input',
                    type: 'textarea',
                    description: 'Enter your input for this model',
                    required: true
                }
            ]
        }
    ];
}