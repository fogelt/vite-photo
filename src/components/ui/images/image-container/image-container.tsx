import { useState } from "react";
import { ImageCard } from '@/components/ui';

interface Photo {
  id: string;
  url: string;
  alt?: string;
  photo_variants?: { id: string; url: string; }[];
}

interface ImageContainerProps {
  photos: Photo[];
  variant?: 'default' | 'weddings';
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
    const pos = (index % 10) + 1;
    switch (pos) {
      case 1: case 2: case 3:
        return variant === 'weddings' ? (pos === 2 ? "h-[60vh] md:w-[35vw]" : "h-[60vh] md:w-[20vw]") : "h-[70vh] md:w-[25vw]";
      case 4: return "h-[60vh] md:w-[37vw]";
      case 5: return "h-[60vh] md:w-[37vw]";
      case 6: case 8: return "h-[60vh] md:w-[18vw]";
      case 7: return "h-[60vh] md:w-[37vw]";
      case 9: return "h-[60vh] md:w-[37vw]";
      case 10: return "h-[60vh] md:w-[37vw]";
      default: return "h-[25em] w-[35em]";
    }
  };

  return (
    <div className="flex flex-wrap justify-center gap-2 p-2 w-[93%] mx-auto">
      {photos.map((photo, index) => {
        const sizingClass = `flex-grow ${getSizingClasses(index)}`;
        const hasLoaded = loadedImages[photo.id];

        if (renderItem) {
          return renderItem(photo, index, sizingClass);
        }

        return (
          <div
            key={photo.id}
            className={`${sizingClass} overflow-hidden bg-stone-50 transition-opacity duration-1000 ${hasLoaded ? 'opacity-100' : 'opacity-0'
              }`}
          >
            <ImageCard
              url={photo.url}
              alt={photo.alt}
              className={`w-full h-full ${hasLoaded ? 'animate-in fade-in slide-in-from-bottom-8 duration-1000 fill-mode-both' : 'opacity-0'
                }`}
              style={{
                animationDelay: `${index * 150}ms`,
              }}
              onClick={() => onItemClick?.(photo)}
              onLoad={() => handleImageLoad(photo.id)}
            />
          </div>
        );
      })}
    </div>
  );
}