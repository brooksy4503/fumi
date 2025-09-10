"use client";

import React, { useState, useMemo } from 'react';
import { useHistory, useFilteredHistory } from '@/contexts/HistoryContext';
import { HistoryFilter } from '@/types/history';
import HistoryItem from './HistoryItem';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Filter, 
  Download, 
  Trash2, 
  Plus, 
  History as HistoryIcon,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface HistorySidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onNewChat: () => void;
  onImageClick?: (image: any) => void;
  onLoadItem?: (item: any) => void;
  onSelectItem?: (item: any) => void;
  selectedItem?: any;
  className?: string;
}

export default function HistorySidebar({ 
  isOpen, 
  onToggle, 
  onNewChat, 
  onImageClick,
  onLoadItem,
  onSelectItem,
  selectedItem,
  className = "" 
}: HistorySidebarProps) {
  const { history, clearHistory, exportHistory, importHistory } = useHistory();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModel, setSelectedModel] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const filter: HistoryFilter = useMemo(() => ({
    search: searchQuery,
    modelId: selectedModel,
    category: selectedCategory,
    dateRange: { start: null, end: null }
  }), [searchQuery, selectedModel, selectedCategory]);

  const filteredHistory = useFilteredHistory(filter);

  // Get unique models and categories for filter dropdowns
  const { models, categories } = useMemo(() => {
    const modelSet = new Set<string>();
    const categorySet = new Set<string>();
    
    history.forEach(item => {
      modelSet.add(item.modelId);
      categorySet.add(item.category);
    });

    return {
      models: Array.from(modelSet).sort(),
      categories: Array.from(categorySet).sort()
    };
  }, [history]);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const data = exportHistory();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fumi-history-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result as string;
        const success = importHistory(data);
        if (success) {
          // Reset filters to show imported data
          setSearchQuery('');
          setSelectedModel('all');
          setSelectedCategory('all');
        }
      } catch (error) {
        console.error('Import failed:', error);
      }
    };
    reader.readAsText(file);
  };

  const handleClearHistory = async () => {
    if (!confirm('Are you sure you want to clear all history? This action cannot be undone.')) {
      return;
    }

    setIsClearing(true);
    try {
      clearHistory();
    } catch (error) {
      console.error('Clear history failed:', error);
    } finally {
      setIsClearing(false);
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedModel('all');
    setSelectedCategory('all');
  };

  const hasActiveFilters = searchQuery || (selectedModel && selectedModel !== 'all') || (selectedCategory && selectedCategory !== 'all');

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-screen w-80 max-w-[50vw] sm:max-w-[60vw] bg-background border-r z-50 transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0 lg:z-auto lg:w-80 lg:max-w-none lg:flex-shrink-0 lg:h-[calc(100vh-140px)] lg:max-h-[calc(100vh-140px)] lg:block
        ${className}
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b flex-shrink-0">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <HistoryIcon className="w-5 h-5" />
                <h2 className="text-lg font-semibold">History</h2>
                <Badge variant="secondary" className="text-xs">
                  {filteredHistory.length}
                </Badge>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onNewChat}
                  className="text-primary"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  New
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggle}
                  className="lg:hidden"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Search */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search history..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filter Toggle */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="flex-1 mr-2"
              >
                <Filter className="w-4 h-4 mr-1" />
                Filters
                {hasActiveFilters && (
                  <Badge variant="destructive" className="ml-1 text-xs">
                    {[searchQuery, selectedModel !== 'all' ? selectedModel : '', selectedCategory !== 'all' ? selectedCategory : ''].filter(Boolean).length}
                  </Badge>
                )}
              </Button>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                >
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="p-4 border-b bg-muted/30 flex-shrink-0">
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">Model</label>
                  <Select value={selectedModel} onValueChange={setSelectedModel}>
                    <SelectTrigger>
                      <SelectValue placeholder="All models" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All models</SelectItem>
                      {models.map(modelId => (
                        <SelectItem key={modelId} value={modelId}>
                          {modelId.split('/').pop()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Category</label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All categories</SelectItem>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>
                          {category.replace('-', ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* History List */}
          <div className="flex-1 overflow-y-auto p-4">
            {filteredHistory.length === 0 ? (
              <div className="text-center py-8">
                <HistoryIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-2">
                  {hasActiveFilters ? 'No results found' : 'No history yet'}
                </p>
                {!hasActiveFilters && (
                  <p className="text-sm text-muted-foreground">
                    Generate some content to see it here
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredHistory.map((item) => (
                  <HistoryItem
                    key={item.id}
                    item={item}
                    onImageClick={onImageClick}
                    onLoadItem={onLoadItem}
                    onSelectItem={onSelectItem}
                    isSelected={selectedItem?.id === item.id}
                    compact={true}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t bg-muted/30 flex-shrink-0">
            <div className="space-y-2">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExport}
                  disabled={isExporting || history.length === 0}
                  className="flex-1"
                >
                  <Download className="w-4 h-4 mr-1" />
                  {isExporting ? 'Exporting...' : 'Export'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('import-file')?.click()}
                  className="flex-1"
                >
                  Import
                </Button>
              </div>
              <input
                id="import-file"
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
              {history.length > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleClearHistory}
                  disabled={isClearing}
                  className="w-full"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  {isClearing ? 'Clearing...' : 'Clear All'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
