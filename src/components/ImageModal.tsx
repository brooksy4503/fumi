"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { X, Download, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  alt: string;
  title?: string;
  metadata?: {
    width?: number;
    height?: number;
    fileSize?: number;
    contentType?: string;
  };
}

export default function ImageModal({ 
  isOpen, 
  onClose, 
  imageUrl, 
  alt, 
  title = "Generated Image",
  metadata 
}: ImageModalProps) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [position, setPosition] = useState({ x: 0, y: 0 });

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setRotation(0);
      setPosition({ x: 0, y: 0 });
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
    };

    // Add event listener with capture to ensure it gets the event first
    document.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => document.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [isOpen, onClose]);

  // Handle mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(prev => Math.max(0.25, Math.min(3, prev + delta)));
  };

  // Handle mouse drag
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `generated-image-${Date.now()}.jpg`;
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
      {/* Close button - always visible in top-right corner with higher z-index */}
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
            </p>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 z-10 flex items-center justify-center gap-2 p-4 bg-gradient-to-t from-black/50 to-transparent" onClick={(e) => e.stopPropagation()}>
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
        
        {/* Alternative close button in bottom controls */}
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

      {/* Image Container */}
      <div 
        className="relative max-w-[90vw] max-h-[90vh] overflow-hidden cursor-grab active:cursor-grabbing mt-16 mb-20"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="relative transition-transform duration-200 ease-out"
          style={{
            transform: `scale(${zoom}) rotate(${rotation}deg) translate(${position.x}px, ${position.y}px)`,
            transformOrigin: 'center center'
          }}
        >
          <Image
            src={imageUrl}
            alt={alt}
            width={800}
            height={800}
            className="max-w-full max-h-full object-contain"
            priority
            unoptimized
          />
        </div>
      </div>

      {/* Instructions */}
      <div className="absolute top-20 left-1/2 transform -translate-x-1/2 text-white/70 text-sm text-center">
        <p>Use mouse wheel to zoom • Drag to pan • Press ESC to close</p>
        <p>Keyboard: + - 0 to zoom • R to rotate</p>
      </div>
    </div>
  );
}
