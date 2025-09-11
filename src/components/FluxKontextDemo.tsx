"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import ImageUploadPreview from './ImageUploadPreview';
import DragDropFileUpload from './DragDropFileUpload';
import { UploadProgress } from '@/services/fal-storage';

export default function FluxKontextDemo() {
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!referenceImage || !prompt.trim()) {
      setError('Please provide both a reference image and a prompt');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setResult(null);

    try {
      // This would normally call your API endpoint
      console.log('Generating with Flux.1 Pro Kontext:', {
        imageUrl: referenceImage,
        prompt: prompt
      });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setResult({
        success: true,
        message: 'Image generated successfully!',
        imageUrl: referenceImage, // In real implementation, this would be the generated image
        prompt: prompt
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">Flux.1 Pro Kontext Demo</h2>
        <p className="text-muted-foreground">
          Upload a reference image and provide a prompt to generate variations using Flux.1 Pro Kontext
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Badge variant="secondary">Flux.1 Pro Kontext</Badge>
            Reference Image Upload
          </CardTitle>
          <p className="text-muted-foreground">
            This model requires a reference image to generate variations. Upload an image and it will be 
            automatically uploaded to Fal storage and converted to a hosted URL.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Reference Image Upload */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Reference Image</h3>
            <ImageUploadPreview
              accept="image/*"
              maxSize={10 * 1024 * 1024} // 10MB
              multiple={false}
              uploadToStorage={true}
              onImagesChange={(images) => {
                const image = Array.isArray(images) ? images[0] : images;
                setReferenceImage(typeof image === 'string' ? image : null);
              }}
              onUploadProgress={(progress: UploadProgress) => {
                console.log('Image upload progress:', progress);
              }}
              disabled={isGenerating}
            />
            
            {referenceImage && (
              <Alert>
                <AlertDescription>
                  ✅ Reference image uploaded successfully! 
                  <br />
                  <code className="text-xs mt-1 block break-all">
                    {referenceImage}
                  </code>
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Prompt Input */}
          <div className="space-y-2">
            <label htmlFor="prompt" className="text-sm font-medium">
              Prompt
            </label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the variation you want to generate..."
              className="w-full p-3 border rounded-lg resize-none"
              rows={3}
              disabled={isGenerating}
            />
          </div>

          {/* Generate Button */}
          <Button 
            onClick={handleGenerate}
            disabled={!referenceImage || !prompt.trim() || isGenerating}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <span className="mr-2 h-4 w-4 animate-spin">⏳</span>
                Generating...
              </>
            ) : (
              'Generate Variation'
            )}
          </Button>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Result Display */}
          {result && (
            <Alert>
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">✅ {result.message}</p>
                  <div className="text-sm text-muted-foreground">
                    <p><strong>Prompt:</strong> {result.prompt}</p>
                    <p><strong>Reference Image URL:</strong></p>
                    <code className="text-xs block break-all bg-muted p-2 rounded">
                      {result.imageUrl}
                    </code>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Alternative Upload Methods */}
      <Card>
        <CardHeader>
          <CardTitle>Alternative Upload Methods</CardTitle>
          <p className="text-muted-foreground">
            Here are the other file upload approaches available for different use cases.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Drag & Drop Method */}
            <div className="space-y-2">
              <h3 className="font-medium">Drag & Drop Upload</h3>
              <p className="text-sm text-muted-foreground">
                Simple drag-and-drop interface for single file uploads.
              </p>
              <DragDropFileUpload
                accept="image/*"
                maxSize={10 * 1024 * 1024}
                multiple={false}
                uploadToStorage={true}
                onFilesChange={(files) => {
                  console.log('Drag & drop files:', files);
                }}
                onUploadProgress={(progress: UploadProgress) => {
                  console.log('Drag & drop progress:', progress);
                }}
                placeholder="Drop an image here or click to browse"
              />
            </div>

            {/* Multiple Images Method */}
            <div className="space-y-2">
              <h3 className="font-medium">Multiple Images Upload</h3>
              <p className="text-sm text-muted-foreground">
                Upload multiple images with live previews in a grid layout.
              </p>
              <ImageUploadPreview
                accept="image/*"
                maxSize={5 * 1024 * 1024}
                multiple={true}
                maxImages={4}
                uploadToStorage={true}
                onImagesChange={(images) => {
                  console.log('Multiple images:', images);
                }}
                onUploadProgress={(progress: UploadProgress) => {
                  console.log('Multiple images progress:', progress);
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Implementation Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Implementation Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <h3 className="font-semibold">How This Works</h3>
            <ol className="space-y-2 text-sm text-muted-foreground">
              <li>1. User selects or drags an image file</li>
              <li>2. File is automatically uploaded to Fal.ai storage</li>
              <li>3. Fal storage returns a hosted URL</li>
              <li>4. URL is used in the model request instead of a local file</li>
              <li>5. Model processes the image and generates variations</li>
            </ol>
          </div>
          
          <div className="space-y-3">
            <h3 className="font-semibold">Benefits</h3>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• No need to host images on your own server</li>
              <li>• Automatic URL generation for model consumption</li>
              <li>• Progress tracking and error handling</li>
              <li>• Support for various file types and sizes</li>
              <li>• Mobile-friendly drag and drop interface</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
