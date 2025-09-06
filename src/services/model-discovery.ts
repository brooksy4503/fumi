import {
   ModelMetadata,
   ModelCategory,
 } from '../types/fal-models';

/**
 * Configuration for the model discovery service
 */
interface DiscoveryConfig {
  /** Base URL for Fal.ai API */
  baseUrl: string;
  /** Cache TTL in milliseconds */
  cacheTtl: number;
  /** Automatic sync interval in milliseconds */
  syncInterval: number;
  /** Retry attempts for API failures */
  maxRetries: number;
}

/**
 * Cache entry for model data
 */
interface CacheEntry {
  models: Record<string, ModelMetadata>;
  timestamp: number;
  expiresAt: number;
}



/**
 * Model Discovery Service
 *
 * Automatically fetches and caches model metadata from Fal.ai API
 * Provides fallback to static registry on API failure
 */
class ModelDiscoveryService {
  private config: DiscoveryConfig;
   private cache: CacheEntry | null = null;

  constructor(config: Partial<DiscoveryConfig> = {}) {
    this.config = {
      baseUrl: 'https://fal.ai',
      cacheTtl: 1000 * 60 * 30, // 30 minutes
      syncInterval: 1000 * 60 * 60, // 1 hour
      maxRetries: 3,
      ...config,
    };
  }

  /**
    * Initialize the discovery service
    *
    * Uses only the static registry - no API discovery is performed.
    */
   async initialize(staticRegistry: Record<string, ModelMetadata> = {}): Promise<void> {
     console.log('[ModelDiscovery] 🔄 Initializing model discovery service...');
     console.log('[ModelDiscovery] 📚 Using static registry only (no API discovery)');

     // Set the static registry as the only source
     this.cache = {
       models: staticRegistry,
       timestamp: Date.now(),
       expiresAt: Date.now() + this.config.cacheTtl,
     };

     console.log('[ModelDiscovery] ✨ Initialized successfully!');
     console.log('[ModelDiscovery] 📋 Ready to serve models from static registry');
   }

  /**
   * Get all models from cache or fallback to static registry
   */
  getAllModels(staticRegistry: Record<string, ModelMetadata> = {}): Record<string, ModelMetadata> {
    if (this.isCacheValid()) {
      return { ...this.cache!.models };
    }

    // Return static registry as fallback
    console.warn('[ModelDiscovery] Cache expired or invalid, using static registry');
    return { ...staticRegistry };
  }

  /**
   * Get a specific model from cache or static registry
   */
  getModel(modelId: string, staticRegistry: Record<string, ModelMetadata> = {}): ModelMetadata | null {
    const models = this.getAllModels(staticRegistry);
    return models[modelId] || null;
  }

  /**
   * Check if model exists
   */
  modelExists(modelId: string, staticRegistry: Record<string, ModelMetadata> = {}): boolean {
    return !!this.getModel(modelId, staticRegistry);
  }

  /**
   * Get models by category
   */
  getModelsByCategory(category: ModelCategory, staticRegistry: Record<string, ModelMetadata> = {}): ModelMetadata[] {
    const models = this.getAllModels(staticRegistry);
    return Object.values(models).filter(model => model.category === category);
  }

  /**
   * Get all model IDs
   */
  getAllModelIds(staticRegistry: Record<string, ModelMetadata> = {}): string[] {
    const models = this.getAllModels(staticRegistry);
    return Object.keys(models);
  }

  /**
    * Force a sync of models from the API (disabled - using static registry only)
    */
   async forceSync(): Promise<void> {
     console.log('[ModelDiscovery] Sync disabled - using static registry only');
     // No-op - we don't sync from API
   }





  /**
   * Check if the cache is still valid
   */
  private isCacheValid(): boolean {
    if (!this.cache) return false;

    const now = Date.now();
    const isExpired = now > this.cache.expiresAt;

    if (isExpired) {
      console.log('[ModelDiscovery] Cache expired');
      return false;
    }

    return true;
  }

  /**
    * Clean up resources
    */
   public destroy(): void {
     this.cache = null;
   }
}

// Singleton instance
export const modelDiscoveryService = new ModelDiscoveryService();

// Export the service class for testing
export { ModelDiscoveryService };
export default modelDiscoveryService;