'use client';

import dynamic from 'next/dynamic';

// Dynamic import in a client component is allowed
const ImageGenerationForm = dynamic(
  () => import('@/components/ImageGenerationForm'),
  { ssr: false }
);

export default function ImageGenerationFormWrapper() {
  return <ImageGenerationForm />;
}
