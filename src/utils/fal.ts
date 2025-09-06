// This file exports constants and helpers for interacting with the fal.ai API

// Model ID for the HiDream image generation model
export const HIDREAM_MODEL_ID = 'fal-ai/hidream-i1-dev';

// API key for fal.ai - should be set in .env.local
// Use NEXT_PUBLIC_ version for client components and regular version for server components
export const FAL_KEY = process.env.FAL_KEY || process.env.NEXT_PUBLIC_FAL_KEY;
