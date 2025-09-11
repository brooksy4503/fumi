// This file exports constants and helpers for interacting with the fal.ai API
import { fal } from '@fal-ai/client';

// Model ID for the HiDream image generation model
export const HIDREAM_MODEL_ID = 'fal-ai/hidream-i1-dev';

// API key for fal.ai - should be set in .env.local
// This is a server-side only key for security
export const FAL_KEY = process.env.FAL_KEY;

// Configure Fal client with API key (server-side only)
if (typeof window === 'undefined' && FAL_KEY) {
    fal.config({
        credentials: FAL_KEY
    });
}
