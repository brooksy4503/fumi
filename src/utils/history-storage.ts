import { HistoryItem } from '@/types/history';

const STORAGE_KEY = 'fumi-generation-history';
const MAX_HISTORY_ITEMS = 50; // Reduced limit to prevent localStorage issues
const MAX_STORAGE_SIZE = 4 * 1024 * 1024; // 4MB limit (most browsers have 5-10MB)

export class HistoryStorage {
    private static instance: HistoryStorage;
    private history: HistoryItem[] = [];

    private constructor() {
        this.loadFromStorage();
    }

    public static getInstance(): HistoryStorage {
        if (!HistoryStorage.instance) {
            HistoryStorage.instance = new HistoryStorage();
        }
        return HistoryStorage.instance;
    }

    private loadFromStorage(): void {
        // Check if we're in a browser environment
        if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
            this.history = [];
            return;
        }

        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                this.history = Array.isArray(parsed) ? parsed : [];
                // Sort by timestamp (newest first)
                this.history.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

                // Optimize loaded data to ensure it fits in storage
                this.optimizeHistoryForStorage();
            }
        } catch (error) {
            console.error('Failed to load history from localStorage:', error);
            this.history = [];
        }
    }

    private saveToStorage(): void {
        // Check if we're in a browser environment
        if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
            return;
        }

        // Pre-optimize data before attempting to save
        this.optimizeHistoryForStorage();

        try {
            // Check storage size before saving and reduce if necessary
            let dataToSave = JSON.stringify(this.history);
            let attempts = 0;
            const maxAttempts = 5;

            while (dataToSave.length > MAX_STORAGE_SIZE && attempts < maxAttempts) {
                const reductionFactor = Math.pow(0.5, attempts + 1);
                const newSize = Math.max(1, Math.floor(this.history.length * reductionFactor));
                this.history = this.history.slice(0, newSize);
                dataToSave = JSON.stringify(this.history);
                attempts++;
                console.warn(`Data too large (${dataToSave.length} bytes), reducing to ${newSize} items`);
            }

            localStorage.setItem(STORAGE_KEY, dataToSave);
        } catch (error) {
            console.error('Failed to save history to localStorage:', error);

            // Handle quota exceeded errors (code 22) and QuotaExceededError
            if (error instanceof DOMException && (error.code === 22 || error.name === 'QuotaExceededError')) {
                console.warn('localStorage quota exceeded, attempting to free space...');

                // Try progressively smaller sizes
                const attempts = [25, 10, 5, 2, 1];

                for (const size of attempts) {
                    try {
                        this.history = this.history.slice(0, size);
                        const reducedData = JSON.stringify(this.history);

                        // Clear localStorage and try again
                        localStorage.removeItem(STORAGE_KEY);
                        localStorage.setItem(STORAGE_KEY, reducedData);
                        console.log(`Successfully saved history with ${size} items`);
                        return;
                    } catch (retryError) {
                        console.warn(`Failed to save with ${size} items, trying smaller size...`);
                        continue;
                    }
                }

                // If all attempts fail, clear localStorage completely
                console.error('All attempts to save history failed, clearing localStorage');
                localStorage.removeItem(STORAGE_KEY);
                this.history = [];
            }
        }
    }

    public getAllHistory(): HistoryItem[] {
        return [...this.history];
    }

    public addItem(item: Omit<HistoryItem, 'id' | 'timestamp'>): string {
        const newItem: HistoryItem = {
            ...item,
            id: this.generateId(),
            timestamp: new Date().toISOString(),
        };

        // Add to beginning of array (newest first)
        this.history.unshift(newItem);

        this.saveToStorage();
        return newItem.id;
    }

    public removeItem(id: string): boolean {
        const initialLength = this.history.length;
        this.history = this.history.filter(item => item.id !== id);
        const removed = this.history.length < initialLength;
        if (removed) {
            this.saveToStorage();
        }
        return removed;
    }

    public clearHistory(): void {
        this.history = [];
        this.saveToStorage();
    }

    public clearAllStorage(): void {
        if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
            try {
                localStorage.removeItem(STORAGE_KEY);
                this.history = [];
                console.log('Cleared all history storage data');
            } catch (error) {
                console.error('Failed to clear storage:', error);
            }
        }
    }

    public emergencyClearStorage(): void {
        if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
            try {
                // Clear all localStorage data for this domain
                localStorage.clear();
                this.history = [];
                console.log('Emergency: Cleared all localStorage data');
            } catch (error) {
                console.error('Failed to emergency clear storage:', error);
            }
        }
    }

    public clearOldHistory(daysToKeep: number = 7): void {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

        const initialLength = this.history.length;
        this.history = this.history.filter(item =>
            new Date(item.timestamp) >= cutoffDate
        );

        if (this.history.length < initialLength) {
            console.log(`Cleared ${initialLength - this.history.length} old history items`);
            this.saveToStorage();
        }
    }

    public searchHistory(query: string): HistoryItem[] {
        if (!query.trim()) {
            return this.history;
        }

        const lowercaseQuery = query.toLowerCase();
        return this.history.filter(item =>
            item.prompt.toLowerCase().includes(lowercaseQuery) ||
            item.modelName.toLowerCase().includes(lowercaseQuery) ||
            item.category.toLowerCase().includes(lowercaseQuery) ||
            item.provider.toLowerCase().includes(lowercaseQuery)
        );
    }

    public filterByModel(modelId: string): HistoryItem[] {
        if (!modelId) {
            return this.history;
        }
        return this.history.filter(item => item.modelId === modelId);
    }

    public filterByCategory(category: string): HistoryItem[] {
        if (!category) {
            return this.history;
        }
        return this.history.filter(item => item.category === category);
    }

    public filterByDateRange(startDate: Date | null, endDate: Date | null): HistoryItem[] {
        if (!startDate && !endDate) {
            return this.history;
        }

        return this.history.filter(item => {
            const itemDate = new Date(item.timestamp);
            const afterStart = !startDate || itemDate >= startDate;
            const beforeEnd = !endDate || itemDate <= endDate;
            return afterStart && beforeEnd;
        });
    }

    public exportHistory(): string {
        return JSON.stringify(this.history, null, 2);
    }

    public importHistory(data: string): boolean {
        try {
            const parsed = JSON.parse(data);
            if (Array.isArray(parsed)) {
                // Validate that all items have required fields
                const validItems = parsed.filter(item =>
                    item.id &&
                    item.timestamp &&
                    item.modelId &&
                    item.modelName &&
                    item.category &&
                    item.prompt
                );

                if (validItems.length > 0) {
                    this.history = validItems;
                    this.saveToStorage();
                    return true;
                }
            }
            return false;
        } catch (error) {
            console.error('Failed to import history:', error);
            return false;
        }
    }

    public getStats(): {
        totalItems: number;
        byCategory: Record<string, number>;
        byModel: Record<string, number>;
        oldestItem?: string;
        newestItem?: string;
    } {
        const byCategory: Record<string, number> = {};
        const byModel: Record<string, number> = {};
        let oldestItem: string | undefined;
        let newestItem: string | undefined;

        this.history.forEach(item => {
            byCategory[item.category] = (byCategory[item.category] || 0) + 1;
            byModel[item.modelId] = (byModel[item.modelId] || 0) + 1;

            if (!oldestItem || new Date(item.timestamp) < new Date(oldestItem)) {
                oldestItem = item.timestamp;
            }
            if (!newestItem || new Date(item.timestamp) > new Date(newestItem)) {
                newestItem = item.timestamp;
            }
        });

        return {
            totalItems: this.history.length,
            byCategory,
            byModel,
            oldestItem,
            newestItem,
        };
    }

    public getStorageInfo(): {
        itemCount: number;
        estimatedSize: number;
        maxItems: number;
        maxSize: number;
        usagePercentage: number;
    } {
        const dataString = JSON.stringify(this.history);
        const estimatedSize = new Blob([dataString]).size;
        const maxSize = MAX_STORAGE_SIZE;
        const usagePercentage = (estimatedSize / maxSize) * 100;

        return {
            itemCount: this.history.length,
            estimatedSize,
            maxItems: MAX_HISTORY_ITEMS,
            maxSize,
            usagePercentage: Math.round(usagePercentage * 100) / 100,
        };
    }

    private generateId(): string {
        return `gen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    private optimizeHistoryForStorage(): void {
        // Keep only the most recent items and optimize their data
        if (this.history.length > MAX_HISTORY_ITEMS) {
            this.history = this.history.slice(0, MAX_HISTORY_ITEMS);
        }

        // Optimize each item to reduce storage size
        this.history = this.history.map(item => this.optimizeHistoryItem(item));
    }

    private optimizeHistoryItem(item: HistoryItem): HistoryItem {
        // Create a copy and remove large/unnecessary data
        const optimized: HistoryItem = {
            ...item,
            result: {
                // Keep only essential data for images/videos/audio
                images: item.result.images?.slice(0, 3).map(img => ({
                    url: img.url,
                    // Remove width, height, fileSize, contentType to save space
                })),
                videos: item.result.videos?.slice(0, 1).map(vid => ({
                    url: vid.url,
                    // Remove width, height, duration, fileSize, contentType to save space
                })),
                audio: item.result.audio ? {
                    url: item.result.audio.url,
                    // Remove duration, fileSize, contentType to save space
                } : undefined,
                // Keep text and description as they're usually small
                text: item.result.text,
                description: item.result.description,
                // Remove any other properties to save space
            },
            metadata: {
                processingTime: item.metadata.processingTime,
                version: item.metadata.version || '1.0.0',
                // Remove other metadata to save space
            }
        };

        return optimized;
    }
}
