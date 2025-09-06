"use client";

import { useState } from 'react';
import Image from 'next/image';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useHistory } from '@/contexts/HistoryContext';
import ImageModal from './ImageModal';

export default function ImageGenerationForm() {
  const { addToHistory } = useHistory();
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);

  const handleDownload = async () => {
    if (!generatedImage) return;

    try {
      const response = await fetch(generatedImage);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'generated-image.jpeg';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Download failed:', err);
      setError('Failed to download image');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }
    
    const startTime = Date.now();
    setIsGenerating(true);
    setError(null);
    
    try {
      console.log('Sending request to generate image with prompt:', prompt);
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });
      
      const data = await response.json();
      console.log('API response received:', data);
      
      if (!response.ok) {
        // Store detailed error information if available
        setErrorDetails(data.details || data.raw_response || null);
        throw new Error(data.error || 'Failed to generate image');
      }
      
      if (data.data && data.data.images && data.data.images[0]) {
        console.log('Image generated successfully:', data.data.images[0].url);
        setGeneratedImage(data.data.images[0].url);
        
        // Save to history
        try {
          addToHistory({
            modelId: 'legacy-image-generation',
            modelName: 'Legacy Image Generation',
            category: 'image-generation',
            provider: 'fal-ai',
            prompt: prompt,
            inputParams: { prompt },
            result: data.data,
            metadata: {
              processingTime: Date.now() - startTime,
              version: '1.0.0',
            }
          });
        } catch (historyError) {
          console.error('Failed to save to history:', historyError);
          // Don't fail the generation if history saving fails
        }
      } else {
        console.error('No image in response:', data);
        throw new Error('No image generated in the response');
      }
    } catch (err) {
      console.error('Error in handleSubmit:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-4">
      <form onSubmit={handleSubmit} className="space-y-4 mb-8">
        <div>
          <Label htmlFor="prompt" className="mb-2 block">Enter your image prompt</Label>
          <Textarea
            id="prompt"
            rows={3}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the image you want to generate..."
          />
        </div>
        <Button type="submit" disabled={isGenerating} className="w-full">
          {isGenerating ? 'Generating...' : 'Generate Image'}
        </Button>
      </form>

      {error && (
        <div className="p-4 mb-6 rounded-md border border-destructive/40 bg-destructive/10">
          <p className="text-destructive">{error}</p>
          {errorDetails && (
            <div className="mt-2">
              <details className="text-sm">
                <summary className="cursor-pointer font-medium">View error details</summary>
                <pre className="mt-2 p-2 rounded overflow-auto text-xs max-h-48 border border-destructive/30 bg-destructive/10 text-destructive">
                  {JSON.stringify(errorDetails, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </div>
      )}

      {isGenerating && (
        <div className="flex justify-center items-center py-8 text-muted-foreground">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      )}

      {generatedImage && !isGenerating && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Generated Image</h2>
           <div 
             className="relative aspect-square w-full max-w-lg mx-auto overflow-hidden rounded-lg shadow-lg cursor-pointer hover:shadow-xl transition-shadow duration-200"
             onClick={() => setShowModal(true)}
           >
             <Image
               src={generatedImage}
               alt="Generated image based on your prompt"
               fill
               className="object-contain hover:scale-105 transition-transform duration-200"
               sizes="(max-width: 768px) 100vw, 50vw"
             />
             <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors duration-200 flex items-center justify-center">
               <div className="opacity-0 hover:opacity-100 transition-opacity duration-200 bg-white/90 text-black px-3 py-1 rounded-full text-sm font-medium">
                 Click to expand
               </div>
             </div>
           </div>
          <div className="mt-4 text-center">
            <Button onClick={handleDownload} variant="secondary" className="mr-2">
              Download Image
            </Button>
            <Button onClick={() => setShowModal(true)} variant="outline">
              View Full Size
            </Button>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {generatedImage && (
        <ImageModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          imageUrl={generatedImage}
          alt="Generated image based on your prompt"
          title="Generated Image"
        />
      )}
    </div>
  );
}
