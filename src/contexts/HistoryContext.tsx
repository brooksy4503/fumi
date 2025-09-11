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
        
        // Automatically clear old history items to prevent quota issues
        // Keep only last 7 days of history
        storage.clearOldHistory(7);
        const cleanedHistory = storage.getAllHistory();
        setHistory(cleanedHistory);
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

  const clearAllStorage = useCallback(() => {
    if (!storage) return;
    
    try {
      storage.clearAllStorage();
      setHistory([]);
    } catch (error) {
      console.error('Failed to clear all storage:', error);
    }
  }, [storage]);

  const emergencyClearStorage = useCallback(() => {
    if (!storage) return;
    
    try {
      storage.emergencyClearStorage();
      setHistory([]);
    } catch (error) {
      console.error('Failed to emergency clear storage:', error);
    }
  }, [storage]);

  const clearOldHistory = useCallback((daysToKeep: number = 7) => {
    if (!storage) return;
    
    try {
      storage.clearOldHistory(daysToKeep);
      const updatedHistory = storage.getAllHistory();
      setHistory(updatedHistory);
    } catch (error) {
      console.error('Failed to clear old history:', error);
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

  const getStorageInfo = useCallback(() => {
    if (!storage) return null;
    
    try {
      return storage.getStorageInfo();
    } catch (error) {
      console.error('Failed to get storage info:', error);
      return null;
    }
  }, [storage]);

  const value: HistoryContextType = {
    history,
    isLoading,
    addToHistory,
    removeFromHistory,
    clearHistory,
    clearAllStorage,
    emergencyClearStorage,
    clearOldHistory,
    searchHistory,
    filterByModel,
    filterByCategory,
    exportHistory,
    importHistory,
    getStorageInfo,
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
  const { history } = useHistory();
  const [filteredHistory, setFilteredHistory] = useState<HistoryItem[]>(history);

  useEffect(() => {
    let result = history;

    // Apply search filter
    if (filter.search.trim()) {
      const searchQuery = filter.search.toLowerCase();
      result = result.filter(item => 
        item.prompt?.toLowerCase().includes(searchQuery) ||
        item.modelId?.toLowerCase().includes(searchQuery) ||
        item.category?.toLowerCase().includes(searchQuery)
      );
    }

    // Apply model filter
    if (filter.modelId && filter.modelId !== 'all') {
      result = result.filter(item => item.modelId === filter.modelId);
    }

    // Apply category filter
    if (filter.category && filter.category !== 'all') {
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
  }, [history, filter]);

  return filteredHistory;
}
