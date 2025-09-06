export interface HistoryItem {
    id: string;
    timestamp: string;
    modelId: string;
    modelName: string;
    category: string;
    provider: string;
    prompt: string;
    inputParams: Record<string, any>;
    result: {
        images?: Array<{
            url: string;
            width?: number;
            height?: number;
            fileSize?: number;
            contentType?: string;
        }>;
        videos?: Array<{
            url: string;
            width?: number;
            height?: number;
            duration?: number;
            fileSize?: number;
            contentType?: string;
        }>;
        audio?: {
            url: string;
            duration?: number;
            fileSize?: number;
            contentType?: string;
        };
        text?: string;
        description?: string;
        [key: string]: any;
    };
    metadata: {
        processingTime: number;
        version: string;
        [key: string]: any;
    };
}

export interface HistoryContextType {
    history: HistoryItem[];
    isLoading: boolean;
    addToHistory: (item: Omit<HistoryItem, 'id' | 'timestamp'>) => void;
    removeFromHistory: (id: string) => void;
    clearHistory: () => void;
    searchHistory: (query: string) => HistoryItem[];
    filterByModel: (modelId: string) => HistoryItem[];
    filterByCategory: (category: string) => HistoryItem[];
    exportHistory: () => string;
    importHistory: (data: string) => boolean;
}

export interface HistoryFilter {
    search: string;
    modelId: string;
    category: string;
    dateRange: {
        start: Date | null;
        end: Date | null;
    };
}
