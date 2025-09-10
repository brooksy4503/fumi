"use client";

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { 
  X, 
  Download, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize2,
  SkipBack,
  SkipForward,
  Settings
} from 'lucide-react';

interface MediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaUrl: string;
  mediaType: 'image' | 'audio' | 'video';
  alt?: string;
  title?: string;
  metadata?: {
    width?: number;
    height?: number;
    fileSize?: number;
    contentType?: string;
    duration?: number;
    sampleRate?: number;
  };
}

export default function MediaModal({ 
  isOpen, 
  onClose, 
  mediaUrl, 
  mediaType,
  alt = "Generated content",
  title = "Generated Media",
  metadata 
}: MediaModalProps) {
  // Image-specific state
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [position, setPosition] = useState({ x: 0, y: 0 });

  // Audio/Video-specific state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showControls, setShowControls] = useState(true);

  const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setRotation(0);
      setPosition({ x: 0, y: 0 });
      setIsPlaying(false);
      setCurrentTime(0);
      setVolume(1);
      setIsMuted(false);
      setPlaybackRate(1);
      setShowControls(true);
      
      // Prevent body scrolling when modal is open
      document.body.classList.add('modal-open');
      
      // Focus the modal container to ensure it can receive keyboard events
      const modalElement = document.querySelector('[data-modal="true"]');
      if (modalElement instanceof HTMLElement) {
        modalElement.focus();
      }
    } else {
      // Re-enable body scrolling when modal is closed
      document.body.classList.remove('modal-open');
    }

    // Cleanup on unmount
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [isOpen]);

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      // Handle ESC key with higher priority
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
        return;
      }
      
      // Media controls
      if (mediaType === 'audio' || mediaType === 'video') {
        switch (e.key) {
          case ' ':
            e.preventDefault();
            togglePlayPause();
            break;
          case 'ArrowLeft':
            e.preventDefault();
            seek(-10);
            break;
          case 'ArrowRight':
            e.preventDefault();
            seek(10);
            break;
          case 'm':
          case 'M':
            e.preventDefault();
            toggleMute();
            break;
          case 'f':
          case 'F':
            if (mediaType === 'video') {
              e.preventDefault();
              toggleFullscreen();
            }
            break;
        }
      }
      
      // Image controls
      if (mediaType === 'image') {
        switch (e.key) {
          case '+':
          case '=':
            e.preventDefault();
            setZoom(prev => Math.min(prev + 0.25, 3));
            break;
          case '-':
            e.preventDefault();
            setZoom(prev => Math.max(prev - 0.25, 0.25));
            break;
          case '0':
            e.preventDefault();
            setZoom(1);
            setPosition({ x: 0, y: 0 });
            break;
          case 'r':
          case 'R':
            e.preventDefault();
            setRotation(prev => (prev + 90) % 360);
            break;
        }
      }
    };

    // Add event listener with capture to ensure it gets the event first
    document.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => document.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [isOpen, onClose, mediaType]);

  // Media event handlers
  const handleLoadedMetadata = () => {
    if (mediaRef.current) {
      setDuration(mediaRef.current.duration);
    }
  };

  const handleTimeUpdate = () => {
    if (mediaRef.current) {
      setCurrentTime(mediaRef.current.currentTime);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const togglePlayPause = () => {
    if (mediaRef.current) {
      if (isPlaying) {
        mediaRef.current.pause();
      } else {
        mediaRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const seek = (seconds: number) => {
    if (mediaRef.current) {
      const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
      mediaRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleProgressClick = (e: React.MouseEvent) => {
    if (mediaRef.current && progressRef.current) {
      const rect = progressRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const newTime = (clickX / rect.width) * duration;
      mediaRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const toggleMute = () => {
    if (mediaRef.current) {
      mediaRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (mediaRef.current) {
      mediaRef.current.volume = newVolume;
    }
  };

  const toggleFullscreen = () => {
    if (mediaRef.current && mediaType === 'video') {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        mediaRef.current.requestFullscreen();
      }
    }
  };

  // Image event handlers
  const handleWheel = (e: React.WheelEvent) => {
    if (mediaType === 'image') {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoom(prev => Math.max(0.25, Math.min(3, prev + delta)));
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (mediaType === 'image' && zoom > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && mediaType === 'image' && zoom > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Auto-hide controls for video
  const handleMouseMoveVideo = () => {
    if (mediaType === 'video') {
      setShowControls(true);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(mediaUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Determine file extension based on media type and content type
      let extension = 'bin';
      if (metadata?.contentType) {
        if (metadata.contentType.includes('image')) {
          extension = metadata.contentType.includes('png') ? 'png' : 'jpg';
        } else if (metadata.contentType.includes('audio')) {
          extension = metadata.contentType.includes('mp3') ? 'mp3' : 'wav';
        } else if (metadata.contentType.includes('video')) {
          extension = metadata.contentType.includes('mp4') ? 'mp4' : 'webm';
        }
      } else {
        extension = mediaType === 'image' ? 'jpg' : mediaType === 'audio' ? 'mp3' : 'mp4';
      }
      
      a.download = `generated-${mediaType}-${Date.now()}.${extension}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  const resetView = () => {
    setZoom(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/90 backdrop-blur-sm focus:outline-none"
      onClick={onClose}
      data-modal="true"
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
    >
      {/* Close button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="absolute top-4 right-4 z-[100] text-white hover:bg-red-500/80 bg-red-600/90 backdrop-blur-sm border-2 border-white/40 hover:border-white/80 transition-all duration-200 w-12 h-12 rounded-full shadow-lg hover:shadow-xl"
        aria-label="Close modal"
        title="Close modal (ESC)"
      >
        <X className="h-6 w-6 font-bold" />
      </Button>

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 pt-16 pr-20 bg-gradient-to-b from-black/50 to-transparent" onClick={(e) => e.stopPropagation()}>
        <div className="text-white">
          <h3 className="text-lg font-semibold">{title}</h3>
          {metadata && (
            <p className="text-sm text-gray-300">
              {metadata.width && metadata.height && `${metadata.width} × ${metadata.height}`}
              {metadata.fileSize && ` • ${(metadata.fileSize / 1024 / 1024).toFixed(1)} MB`}
              {metadata.duration && ` • ${formatTime(metadata.duration)}`}
              {metadata.sampleRate && ` • ${metadata.sampleRate}Hz`}
            </p>
          )}
        </div>
      </div>

      {/* Media Container */}
      <div 
        className={`relative max-w-[90vw] max-h-[90vh] overflow-hidden mt-16 mb-20 ${
          mediaType === 'image' ? 'cursor-grab active:cursor-grabbing' : ''
        }`}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={mediaType === 'video' ? handleMouseMoveVideo : handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={(e) => e.stopPropagation()}
      >
        {mediaType === 'image' ? (
          <div
            className="relative transition-transform duration-200 ease-out"
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg) translate(${position.x}px, ${position.y}px)`,
              transformOrigin: 'center center'
            }}
          >
            <Image
              src={mediaUrl}
              alt={alt}
              width={800}
              height={800}
              className="max-w-full max-h-full object-contain"
              priority
              unoptimized
            />
          </div>
        ) : mediaType === 'audio' ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[400px] space-y-8">
            <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-2xl">
              <Volume2 className="w-16 h-16 text-white" />
            </div>
            <div className="w-full max-w-md space-y-4">
              <audio
                ref={mediaRef as React.RefObject<HTMLAudioElement>}
                src={mediaUrl}
                onLoadedMetadata={handleLoadedMetadata}
                onTimeUpdate={handleTimeUpdate}
                onEnded={handleEnded}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                className="hidden"
              />
              
              {/* Progress Bar */}
              <div 
                ref={progressRef}
                className="w-full h-2 bg-gray-600 rounded-full cursor-pointer"
                onClick={handleProgressClick}
              >
                <div 
                  className="h-full bg-white rounded-full transition-all duration-100"
                  style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                />
              </div>
              
              {/* Time Display */}
              <div className="flex justify-between text-white text-sm">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
          </div>
        ) : mediaType === 'video' ? (
          <div className="relative">
            <video
              ref={mediaRef as React.RefObject<HTMLVideoElement>}
              src={mediaUrl}
              className="max-w-full max-h-full object-contain"
              onLoadedMetadata={handleLoadedMetadata}
              onTimeUpdate={handleTimeUpdate}
              onEnded={handleEnded}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onClick={togglePlayPause}
            />
            
            {/* Video Overlay Controls */}
            {showControls && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={togglePlayPause}
                  className="w-20 h-20 bg-black/50 hover:bg-black/70 text-white rounded-full"
                >
                  {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8" />}
                </Button>
              </div>
            )}
          </div>
        ) : null}
      </div>

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 z-10 flex items-center justify-center gap-2 p-4 bg-gradient-to-t from-black/50 to-transparent" onClick={(e) => e.stopPropagation()}>
        {mediaType === 'image' ? (
          <>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setZoom(prev => Math.max(0.25, prev - 0.25))}
              className="text-white hover:bg-white/20"
              disabled={zoom <= 0.25}
            >
              <ZoomOut className="h-5 w-5" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={resetView}
              className="text-white hover:bg-white/20"
            >
              {Math.round(zoom * 100)}%
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setZoom(prev => Math.min(3, prev + 0.25))}
              className="text-white hover:bg-white/20"
              disabled={zoom >= 3}
            >
              <ZoomIn className="h-5 w-5" />
            </Button>
            
            <div className="w-px h-6 bg-white/30 mx-2" />
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setRotation(prev => (prev + 90) % 360)}
              className="text-white hover:bg-white/20"
            >
              <RotateCw className="h-5 w-5" />
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => seek(-10)}
              className="text-white hover:bg-white/20"
            >
              <SkipBack className="h-5 w-5" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={togglePlayPause}
              className="text-white hover:bg-white/20"
            >
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => seek(10)}
              className="text-white hover:bg-white/20"
            >
              <SkipForward className="h-5 w-5" />
            </Button>
            
            <div className="w-px h-6 bg-white/30 mx-2" />
            
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMute}
              className="text-white hover:bg-white/20"
            >
              {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </Button>
            
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={handleVolumeChange}
              className="w-20 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
            />
            
            {mediaType === 'video' && (
              <>
                <div className="w-px h-6 bg-white/30 mx-2" />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleFullscreen}
                  className="text-white hover:bg-white/20"
                >
                  <Maximize2 className="h-5 w-5" />
                </Button>
              </>
            )}
          </>
        )}
        
        <div className="w-px h-6 bg-white/30 mx-2" />
        
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDownload}
          className="text-white hover:bg-white/20"
        >
          <Download className="h-5 w-5" />
        </Button>
        
        <div className="w-px h-6 bg-white/30 mx-2" />
        
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="text-white hover:bg-red-500/80 bg-red-600/90 border border-white/40 hover:border-white/80"
          title="Close modal"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Instructions */}
      <div className="absolute top-20 left-1/2 transform -translate-x-1/2 text-white/70 text-sm text-center">
        {mediaType === 'image' ? (
          <>
            <p>Use mouse wheel to zoom • Drag to pan • Press ESC to close</p>
            <p>Keyboard: + - 0 to zoom • R to rotate</p>
          </>
        ) : (
          <>
            <p>Space to play/pause • ← → to seek • M to mute • ESC to close</p>
            {mediaType === 'video' && <p>F for fullscreen • Click video to play/pause</p>}
          </>
        )}
      </div>
    </div>
  );
}
