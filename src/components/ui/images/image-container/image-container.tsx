import { useState } from "react";
import { ImageCard } from '@/components/ui';
import { Images } from 'lucide-react';

interface Photo {
  id: string;
  url: string;
  alt?: string;
  photo_variants?: { id: string; url: string; }[];
}

interface ImageContainerProps {
  photos: Photo[];
  variant?: 'default' | 'weddings' | 'reportage';
  onItemClick?: (photo: Photo) => void;
  renderItem?: (photo: Photo, index: number, className: string) => React.ReactNode;
}

export function ImageContainer({
  photos,
  variant = 'default',
  onItemClick,
  renderItem
}: ImageContainerProps) {
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});

  const handleImageLoad = (id: string) => {
    setLoadedImages((prev) => ({ ...prev, [id]: true }));
  };

  const getSizingClasses = (index: number) => {
    if (variant === 'reportage') {
      return "h-auto w-full md:h-[35vh] lg:h-[38.5vh] md:w-auto flex-grow-[1.5] shrink-0 md:min-w-[15vh]";
    }

    const pos = (index % 10) + 1;
    switch (pos) {
      case 1: case 2: case 3:
        return variant === 'weddings' ? (pos === 2 ? "md:h-[60vh] md:w-[35vw]" : "h-[60vh] md:w-[20vw]") : "h-[70vh] md:w-[25vw]";
      case 4: case 5: case 7: case 9: case 10: return "md:h-[60vh] md:w-[37vw]";
      case 6: case 8: return "h-[60vh] md:w-[18vw]";
      default: return "h-[25em] w-[35em]";
    }
  };

  return (
    <div className="flex flex-wrap gap-2 p-2 w-[95%] mx-auto">
      {photos.map((photo, index) => {
        const sizingClass = getSizingClasses(index);
        const hasLoaded = loadedImages[photo.id];

        return (
          <div
            key={photo.id}
            className={`${sizingClass} overflow-hidden bg-stone-50 transition-all duration-1000 ${hasLoaded ? 'opacity-100' : 'opacity-0'
              }`}
          >
            <ImageCard
              url={photo.url}
              alt={photo.alt}
              className={`w-full h-full object-cover transition-transform duration-700 hover:scale-105 ${hasLoaded ? 'animate-in fade-in duration-1000' : 'opacity-0'
                }`}
              onClick={() => onItemClick?.(photo)}
              onLoad={() => handleImageLoad(photo.id)}
            />
          </div>
        );
      })}
      {variant === 'reportage' && <div className="grow-[10] basis-0" />}
    </div>
  );
}