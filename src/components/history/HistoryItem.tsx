"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { HistoryItem as HistoryItemType } from '@/types/history';
import { useHistory } from '@/contexts/HistoryContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Trash2, 
  Download, 
  ExternalLink, 
  Clock, 
  Cpu, 
  Calendar,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface HistoryItemProps {
  item: HistoryItemType;
  onImageClick?: (image: any) => void;
  onLoadItem?: (item: HistoryItemType) => void;
  onSelectItem?: (item: HistoryItemType) => void;
  isSelected?: boolean;
  compact?: boolean;
}

export default function HistoryItem({ item, onImageClick, onLoadItem, onSelectItem, isSelected = false, compact = false }: HistoryItemProps) {
  const { removeFromHistory } = useHistory();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (isDeleting) return;
    
    setIsDeleting(true);
    try {
      removeFromHistory(item.id);
    } catch (error) {
      console.error('Failed to delete history item:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const getThumbnail = () => {
    if (item.result.images && item.result.images.length > 0) {
      return item.result.images[0];
    }
    if (item.result.videos && item.result.videos.length > 0) {
      return item.result.videos[0];
    }
    return null;
  };

  const getMediaType = () => {
    if (item.result.images && item.result.images.length > 0) return 'image';
    if (item.result.videos && item.result.videos.length > 0) return 'video';
    if (item.result.audio) return 'audio';
    if (item.result.text) return 'text';
    return 'unknown';
  };

  const getMediaCount = () => {
    const imageCount = item.result.images?.length || 0;
    const videoCount = item.result.videos?.length || 0;
    return imageCount + videoCount;
  };

  const thumbnail = getThumbnail();
  const mediaType = getMediaType();
  const mediaCount = getMediaCount();

  const formatPrompt = (prompt: string, maxLength: number = 100) => {
    if (prompt.length <= maxLength) return prompt;
    return prompt.substring(0, maxLength) + '...';
  };

  const handleLoadItem = () => {
    if (onLoadItem) {
      onLoadItem(item);
    }
  };

  const handleSelectItem = () => {
    if (onSelectItem) {
      onSelectItem(item);
    }
  };

  if (compact) {
    return (
      <Card 
        className={`hover:shadow-md transition-shadow cursor-pointer group ${
          isSelected ? 'ring-2 ring-primary bg-primary/5' : ''
        }`} 
        onClick={handleSelectItem}
      >
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            {thumbnail && (
              <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                <Image
                  src={thumbnail.url}
                  alt="Generated content"
                  fill
                  className="object-cover"
                  sizes="48px"
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                {formatPrompt(item.prompt, 60)}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  {item.modelName}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {mediaCount > 1 && (
                <Badge variant="secondary" className="text-xs">
                  +{mediaCount - 1}
                </Badge>
              )}
              <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">
                {formatPrompt(item.prompt, 120)}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  {item.modelName}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {item.category.replace('-', ' ')}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {item.provider}
                </span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>

          {/* Thumbnail and Media Info */}
          {thumbnail && (
            <div className="space-y-2">
              <div 
                className="relative aspect-square w-full max-w-xs mx-auto rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => onImageClick?.(thumbnail)}
              >
                <Image
                  src={thumbnail.url}
                  alt="Generated content"
                  fill
                  className="object-cover hover:scale-105 transition-transform"
                  sizes="(max-width: 768px) 100vw, 300px"
                />
                <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center">
                  <div className="opacity-0 hover:opacity-100 transition-opacity bg-white/90 text-black px-2 py-1 rounded text-xs font-medium">
                    Click to expand
                  </div>
                </div>
              </div>
              
              {mediaCount > 1 && (
                <p className="text-xs text-center text-muted-foreground">
                  +{mediaCount - 1} more {mediaType}{mediaCount > 2 ? 's' : ''}
                </p>
              )}
            </div>
          )}

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}</span>
            </div>
            <div className="flex items-center gap-1">
              <Cpu className="w-3 h-3" />
              <span>{item.metadata.processingTime}ms</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>{new Date(item.timestamp).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-1">
              <span>v{item.metadata.version}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2 border-t">
            <Button
              variant="default"
              size="sm"
              onClick={handleLoadItem}
              className="flex-1"
            >
              <ExternalLink className="w-3 h-3 mr-1" />
              Load
            </Button>
            {thumbnail && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownload(thumbnail.url, `generated-${item.id}.${mediaType === 'image' ? 'jpg' : 'mp4'}`)}
                className="flex-1"
              >
                <Download className="w-3 h-3 mr-1" />
                Download
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex-1"
            >
              {isExpanded ? 'Show Less' : 'Show More'}
            </Button>
          </div>

          {/* Expanded Details */}
          {isExpanded && (
            <div className="space-y-3 pt-3 border-t">
              <div>
                <h4 className="text-sm font-medium mb-2">Full Prompt</h4>
                <p className="text-sm text-muted-foreground bg-muted p-2 rounded">
                  {item.prompt}
                </p>
              </div>
              
              {Object.keys(item.inputParams).length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Parameters</h4>
                  <div className="text-xs text-muted-foreground bg-muted p-2 rounded max-h-32 overflow-auto">
                    <pre>{JSON.stringify(item.inputParams, null, 2)}</pre>
                  </div>
                </div>
              )}

              {item.result.description && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground bg-muted p-2 rounded">
                    {item.result.description}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
