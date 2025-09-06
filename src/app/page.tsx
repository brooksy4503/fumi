"use client";

import { useState } from 'react';
import UnifiedFalInterface from '@/components/UnifiedFalInterface';
import { Card, CardContent } from '@/components/ui/card';
import { ThemeToggle } from '@/components/theme-toggle';
import HistorySidebar from '@/components/history/HistorySidebar';
import MediaPreviewPanel from '@/components/MediaPreviewPanel';
import Image from 'next/image';
import ImageModal from '@/components/ImageModal';

export default function Home() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loadHistoryItem, setLoadHistoryItem] = useState<any>(null);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<any>(null);
  const [modalImage, setModalImage] = useState<{
    url: string;
    alt: string;
    metadata?: any;
  } | null>(null);

  const handleNewChat = () => {
    // Scroll to top and clear any current generation
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setIsSidebarOpen(false);
    setLoadHistoryItem(null);
    setSelectedHistoryItem(null);
  };

  const handleImageClick = (image: any) => {
    setModalImage({
      url: image.url,
      alt: image.alt || 'Generated image',
      metadata: {
        width: image.width,
        height: image.height,
        fileSize: image.fileSize,
        contentType: image.contentType
      }
    });
  };

  const handleLoadHistoryItem = (item: any) => {
    // Close sidebar on mobile
    setIsSidebarOpen(false);
    
    // Set the history item to load
    setLoadHistoryItem(item);
    
    // Scroll to top to show the form
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    console.log('Loading history item:', item);
  };

  const handleSelectHistoryItem = (item: any) => {
    setSelectedHistoryItem(item);
  };

  const closeModal = () => {
    setModalImage(null);
  };

  const handleHistoryItemLoaded = () => {
    // Clear the loadHistoryItem after it's been processed
    setLoadHistoryItem(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground overflow-x-hidden">
      <header className="border-b">
        <div className="container mx-auto px-4 py-6 grid grid-cols-[1fr_auto_1fr] items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden p-2 hover:bg-muted rounded-md transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="hidden lg:block" />
          </div>
          <div className="justify-self-center text-center">
            <div className="flex items-center justify-center gap-3">
              <Image src="/fumi.svg" alt="FUMI logo" width={36} height={36} priority />
              <h1 className="text-3xl font-bold">FUMI</h1>
            </div>
            <p className="mt-2 text-muted-foreground">
              Generate images, videos, audio, and text with AI models
            </p>
          </div>
          <div className="justify-self-end">
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="flex flex-1 min-w-0 relative">
        {/* Main Content */}
        <main className="flex-1 min-w-0">
          <div className="container mx-auto px-4 py-8">
            <Card className="max-w-4xl mx-auto">
              <CardContent className="p-6 sm:p-10">
                <UnifiedFalInterface 
                  onImageClick={handleImageClick} 
                  loadHistoryItem={loadHistoryItem}
                  onHistoryItemLoaded={handleHistoryItemLoaded}
                />
              </CardContent>
            </Card>
          </div>
        </main>

        {/* Media Preview Panel */}
        <MediaPreviewPanel
          isOpen={!!selectedHistoryItem}
          onClose={() => setSelectedHistoryItem(null)}
          historyItem={selectedHistoryItem}
          onLoadItem={handleLoadHistoryItem}
          onImageClick={handleImageClick}
        />

        {/* History Sidebar */}
        <HistorySidebar
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          onNewChat={handleNewChat}
          onImageClick={handleImageClick}
          onLoadItem={handleLoadHistoryItem}
          onSelectItem={handleSelectHistoryItem}
          selectedItem={selectedHistoryItem}
        />
      </div>

      <footer className="border-t">
        <div className="container mx-auto px-4 py-6 text-center text-muted-foreground">
          <p>FUMI — Built with Next.js</p>
        </div>
      </footer>

      {/* Image Modal */}
      {modalImage && (
        <ImageModal
          isOpen={!!modalImage}
          onClose={closeModal}
          imageUrl={modalImage.url}
          alt={modalImage.alt}
          title="Generated Image"
          metadata={modalImage.metadata}
        />
      )}
    </div>
  );
}
