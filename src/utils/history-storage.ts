import { HistoryItem } from '@/types/history';

const STORAGE_KEY = 'fumi-generation-history';
const MAX_HISTORY_ITEMS = 1000; // Limit to prevent localStorage from getting too large

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

        try {
            // Limit history size to prevent localStorage issues
            if (this.history.length > MAX_HISTORY_ITEMS) {
                this.history = this.history.slice(0, MAX_HISTORY_ITEMS);
            }
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.history));
        } catch (error) {
            console.error('Failed to save history to localStorage:', error);
            // If localStorage is full, try to clear old items
            if (error instanceof DOMException && error.code === 22) {
                this.history = this.history.slice(0, Math.floor(MAX_HISTORY_ITEMS / 2));
                try {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.history));
                } catch (retryError) {
                    console.error('Failed to save history even after reducing size:', retryError);
                }
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

    private generateId(): string {
        return `gen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}
