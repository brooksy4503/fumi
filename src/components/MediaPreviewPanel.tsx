"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { HistoryItem } from '@/types/history';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  X, 
  Download, 
  ExternalLink, 
  ChevronLeft, 
  ChevronRight,
  Play,
  Pause,
  Volume2,
  Maximize2,
  Clock,
  Calendar,
  Cpu
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface MediaPreviewPanelProps {
  isOpen: boolean;
  onClose: () => void;
  historyItem: HistoryItem | null;
  onLoadItem?: (item: HistoryItem) => void;
  onImageClick?: (image: any) => void;
}

export default function MediaPreviewPanel({ 
  isOpen, 
  onClose, 
  historyItem, 
  onLoadItem,
  onImageClick 
}: MediaPreviewPanelProps) {
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  if (!isOpen || !historyItem) return null;

  const getMediaItems = () => {
    const items = [];
    if (historyItem.result.images) {
      items.push(...historyItem.result.images.map(img => ({ ...img, type: 'image' })));
    }
    if (historyItem.result.videos) {
      items.push(...historyItem.result.videos.map(vid => ({ ...vid, type: 'video' })));
    }
    if (historyItem.result.audio) {
      items.push({ ...historyItem.result.audio, type: 'audio' });
    }
    return items;
  };

  const mediaItems = getMediaItems();
  const currentMedia = mediaItems[currentMediaIndex];
  const hasMultipleMedia = mediaItems.length > 1;

  const handlePrevious = () => {
    setCurrentMediaIndex(prev => prev > 0 ? prev - 1 : mediaItems.length - 1);
  };

  const handleNext = () => {
    setCurrentMediaIndex(prev => prev < mediaItems.length - 1 ? prev + 1 : 0);
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

  const handleLoadItem = () => {
    if (onLoadItem) {
      onLoadItem(historyItem);
    }
  };

  const handleMediaClick = () => {
    if (currentMedia && onImageClick) {
      onImageClick(currentMedia);
    }
  };

  const getMediaFilename = () => {
    const timestamp = new Date(historyItem.timestamp).toISOString().split('T')[0];
    const mediaType = currentMedia?.type || 'media';
    const extension = mediaType === 'image' ? 'jpg' : mediaType === 'video' ? 'mp4' : 'mp3';
    return `generated-${historyItem.id}-${currentMediaIndex + 1}.${extension}`;
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      <div className={`
        fixed top-0 right-0 h-full w-80 max-w-[50vw] sm:max-w-[60vw] bg-background border-l z-40 transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        lg:relative lg:translate-x-0 lg:z-auto lg:w-80 lg:max-w-none lg:flex-shrink-0
      `}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">Preview</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="lg:hidden"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          {/* History Item Info */}
          <div className="space-y-2">
            <p className="text-sm font-medium truncate">
              {historyItem.prompt.length > 60 
                ? `${historyItem.prompt.substring(0, 60)}...` 
                : historyItem.prompt
              }
            </p>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {historyItem.modelName}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {historyItem.category.replace('-', ' ')}
              </Badge>
            </div>
          </div>
        </div>

        {/* Media Display */}
        <div className="flex-1 p-4">
          {currentMedia ? (
            <div className="space-y-4">
              {/* Media Container */}
              <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-muted">
                {currentMedia.type === 'image' ? (
                  <div 
                    className="relative w-full h-full cursor-pointer"
                    onClick={handleMediaClick}
                  >
                    <Image
                      src={currentMedia.url}
                      alt="Generated content"
                      fill
                      className="object-contain hover:scale-105 transition-transform"
                      sizes="300px"
                    />
                    <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center">
                      <div className="opacity-0 hover:opacity-100 transition-opacity bg-white/90 text-black px-2 py-1 rounded text-xs font-medium">
                        Click to expand
                      </div>
                    </div>
                  </div>
                ) : currentMedia.type === 'video' ? (
                  <div className="relative w-full h-full">
                    <video
                      src={currentMedia.url}
                      controls
                      className="w-full h-full object-contain"
                      onPlay={() => setIsVideoPlaying(true)}
                      onPause={() => setIsVideoPlaying(false)}
                    />
                  </div>
                ) : currentMedia.type === 'audio' ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center space-y-4">
                      <Volume2 className="w-16 h-16 mx-auto text-muted-foreground" />
                      <audio
                        src={currentMedia.url}
                        controls
                        className="w-full"
                        onPlay={() => setIsVideoPlaying(true)}
                        onPause={() => setIsVideoPlaying(false)}
                      />
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Media Navigation */}
              {hasMultipleMedia && (
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrevious}
                    disabled={mediaItems.length <= 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  
                  <span className="text-sm text-muted-foreground">
                    {currentMediaIndex + 1} of {mediaItems.length}
                  </span>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNext}
                    disabled={mediaItems.length <= 1}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}

              {/* Media Metadata */}
              <div className="space-y-2 text-xs text-muted-foreground">
                {currentMedia.width && currentMedia.height && (
                  <div className="flex justify-between">
                    <span>Dimensions:</span>
                    <span>{currentMedia.width} × {currentMedia.height}</span>
                  </div>
                )}
                {currentMedia.fileSize && (
                  <div className="flex justify-between">
                    <span>Size:</span>
                    <span>{(currentMedia.fileSize / 1024 / 1024).toFixed(1)} MB</span>
                  </div>
                )}
                {'duration' in currentMedia && typeof currentMedia.duration === 'number' && (
                  <div className="flex justify-between">
                    <span>Duration:</span>
                    <span>{Math.round(currentMedia.duration)}s</span>
                  </div>
                )}
                {currentMedia.contentType && (
                  <div className="flex justify-between">
                    <span>Type:</span>
                    <span>{currentMedia.contentType}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-lg flex items-center justify-center">
                  <ExternalLink className="w-8 h-8" />
                </div>
                <p className="text-sm">No media to preview</p>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="p-4 border-t space-y-3">
          <div className="flex gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={handleLoadItem}
              className="flex-1"
            >
              <ExternalLink className="w-3 h-3 mr-1" />
              Load Configuration
            </Button>
            {currentMedia && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownload(currentMedia.url, getMediaFilename())}
                className="flex-1"
              >
                <Download className="w-3 h-3 mr-1" />
                Download
              </Button>
            )}
          </div>

          {/* History Metadata */}
          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{formatDistanceToNow(new Date(historyItem.timestamp), { addSuffix: true })}</span>
            </div>
            <div className="flex items-center gap-1">
              <Cpu className="w-3 h-3" />
              <span>{historyItem.metadata.processingTime}ms</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>{new Date(historyItem.timestamp).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-1">
              <span>v{historyItem.metadata.version}</span>
            </div>
          </div>
        </div>
      </div>
      </div>
    </>
  );
}
