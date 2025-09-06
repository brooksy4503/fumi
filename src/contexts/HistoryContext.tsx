"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { HistoryItem, HistoryContextType, HistoryFilter } from '@/types/history';
import { HistoryStorage } from '@/utils/history-storage';

const HistoryContext = createContext<HistoryContextType | undefined>(undefined);

interface HistoryProviderProps {
  children: React.ReactNode;
}

export function HistoryProvider({ children }: HistoryProviderProps) {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [storage] = useState(() => {
    // Only initialize storage on client side
    if (typeof window !== 'undefined') {
      return HistoryStorage.getInstance();
    }
    return null;
  });

  // Load history from storage on mount
  useEffect(() => {
    const loadHistory = () => {
      if (!storage) {
        setIsLoading(false);
        return;
      }

      try {
        const storedHistory = storage.getAllHistory();
        setHistory(storedHistory);
      } catch (error) {
        console.error('Failed to load history:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadHistory();
  }, [storage]);

  const addToHistory = useCallback((item: Omit<HistoryItem, 'id' | 'timestamp'>) => {
    if (!storage) return;
    
    try {
      const id = storage.addItem(item);
      const newItem: HistoryItem = {
        ...item,
        id,
        timestamp: new Date().toISOString(),
      };
      setHistory(prev => [newItem, ...prev]);
    } catch (error) {
      console.error('Failed to add item to history:', error);
    }
  }, [storage]);

  const removeFromHistory = useCallback((id: string) => {
    if (!storage) return;
    
    try {
      const removed = storage.removeItem(id);
      if (removed) {
        setHistory(prev => prev.filter(item => item.id !== id));
      }
    } catch (error) {
      console.error('Failed to remove item from history:', error);
    }
  }, [storage]);

  const clearHistory = useCallback(() => {
    if (!storage) return;
    
    try {
      storage.clearHistory();
      setHistory([]);
    } catch (error) {
      console.error('Failed to clear history:', error);
    }
  }, [storage]);

  const searchHistory = useCallback((query: string) => {
    if (!storage) return [];
    
    try {
      return storage.searchHistory(query);
    } catch (error) {
      console.error('Failed to search history:', error);
      return [];
    }
  }, [storage]);

  const filterByModel = useCallback((modelId: string) => {
    if (!storage) return [];
    
    try {
      return storage.filterByModel(modelId);
    } catch (error) {
      console.error('Failed to filter history by model:', error);
      return [];
    }
  }, [storage]);

  const filterByCategory = useCallback((category: string) => {
    if (!storage) return [];
    
    try {
      return storage.filterByCategory(category);
    } catch (error) {
      console.error('Failed to filter history by category:', error);
      return [];
    }
  }, [storage]);

  const exportHistory = useCallback(() => {
    if (!storage) return '[]';
    
    try {
      return storage.exportHistory();
    } catch (error) {
      console.error('Failed to export history:', error);
      return '[]';
    }
  }, [storage]);

  const importHistory = useCallback((data: string) => {
    if (!storage) return false;
    
    try {
      const success = storage.importHistory(data);
      if (success) {
        const updatedHistory = storage.getAllHistory();
        setHistory(updatedHistory);
      }
      return success;
    } catch (error) {
      console.error('Failed to import history:', error);
      return false;
    }
  }, [storage]);

  const value: HistoryContextType = {
    history,
    isLoading,
    addToHistory,
    removeFromHistory,
    clearHistory,
    searchHistory,
    filterByModel,
    filterByCategory,
    exportHistory,
    importHistory,
  };

  return (
    <HistoryContext.Provider value={value}>
      {children}
    </HistoryContext.Provider>
  );
}

export function useHistory() {
  const context = useContext(HistoryContext);
  if (context === undefined) {
    throw new Error('useHistory must be used within a HistoryProvider');
  }
  return context;
}

// Hook for filtered history with search and filters
export function useFilteredHistory(filter: HistoryFilter) {
  const { history, searchHistory, filterByModel, filterByCategory } = useHistory();
  const [filteredHistory, setFilteredHistory] = useState<HistoryItem[]>(history);

  useEffect(() => {
    let result = history;

    // Apply search filter
    if (filter.search.trim()) {
      result = searchHistory(filter.search);
    }

    // Apply model filter
    if (filter.modelId) {
      result = result.filter(item => item.modelId === filter.modelId);
    }

    // Apply category filter
    if (filter.category) {
      result = result.filter(item => item.category === filter.category);
    }

    // Apply date range filter
    if (filter.dateRange.start || filter.dateRange.end) {
      result = result.filter(item => {
        const itemDate = new Date(item.timestamp);
        const afterStart = !filter.dateRange.start || itemDate >= filter.dateRange.start;
        const beforeEnd = !filter.dateRange.end || itemDate <= filter.dateRange.end;
        return afterStart && beforeEnd;
      });
    }

    setFilteredHistory(result);
  }, [history, filter, searchHistory, filterByModel, filterByCategory]);

  return filteredHistory;
}
