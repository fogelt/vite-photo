import { useState } from 'react';
import { ImageCard, WelcomeSection } from '@/components/ui';

interface SplitPhoto {
  id: string;
  url: string;
  alt?: string;
}

interface EditorialSplitProps {
  photos: SplitPhoto[];
  onItemClick?: (photo: SplitPhoto) => void;
  isLoading?: boolean;
}

export function EditorialSplit({ photos, onItemClick, isLoading }: EditorialSplitProps) {
  const [loaded, setLoaded] = useState<Record<string, boolean>>({});

  return (
    <section id="galleri" className="max-w-6xl mx-auto px-6 w-full scroll-mt-36 md:scroll-mt-28">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-start">
        {/* Sticky text column */}
        <div className="md:sticky md:top-36 self-start">
          <WelcomeSection />
        </div>

        {/* Flowing image column */}
        <div className="flex flex-col gap-4">
          {isLoading
            ? [...Array(3)].map((_, i) => (
              <div key={i} className="w-full h-[50vh] md:h-[60vh] bg-stone-100 animate-pulse" />
            ))
            : photos.map((photo) => (
              <div
                key={photo.id}
                className={`overflow-hidden bg-stone-50 transition-opacity duration-1000 ${loaded[photo.id] ? 'opacity-100' : 'opacity-0'}`}
              >
                <ImageCard
                  url={photo.url}
                  alt={photo.alt}
                  className="w-full h-[50vh] md:h-[60vh]"
                  onClick={() => onItemClick?.(photo)}
                  onLoad={() => setLoaded((prev) => ({ ...prev, [photo.id]: true }))}
                />
              </div>
            ))}
        </div>
      </div>
    </section>
  );
}
