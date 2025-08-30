import UnifiedFalInterface from '@/components/UnifiedFalInterface';
import { Card, CardContent } from '@/components/ui/card';
import { ThemeToggle } from '@/components/theme-toggle';
import Image from 'next/image';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="border-b">
        <div className="container mx-auto px-4 py-6 grid grid-cols-[1fr_auto_1fr] items-center">
          <div aria-hidden />
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

      <main className="flex-grow container mx-auto px-4 py-8">
        <Card className="max-w-4xl mx-auto">
          <CardContent className="p-6 sm:p-10">
            <UnifiedFalInterface />
          </CardContent>
        </Card>

        
      </main>

      <footer className="border-t">
        <div className="container mx-auto px-4 py-6 text-center text-muted-foreground">
          <p>FUMI — Built with Next.js</p>
        </div>
      </footer>
    </div>
  );
}
