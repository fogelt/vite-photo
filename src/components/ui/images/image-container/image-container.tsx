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
  isLoading?: boolean;
}

export function ImageContainer({
  photos,
  variant = 'default',
  onItemClick,
  renderItem,
  isLoading
}: ImageContainerProps) {
  const displayPhotos = isLoading
    ? Array.from({ length: 10 }).map((_, i) => ({ id: `skeleton-${i}`, url: '' })) as Photo[]
    : photos;
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});

  const handleImageLoad = (id: string) => {
    setLoadedImages((prev) => ({ ...prev, [id]: true }));
  };

  const getSizingClasses = (index: number) => {
    if (variant === 'reportage') {
      return "w-full h-auto lg:h-[43.5vh] md:w-auto flex-grow lg:max-w-{40vw]";
    }

    const pos = (index % 10) + 1;
    const base = "flex-grow ";

    switch (pos) {
      case 1: case 2: case 3:
        return base + (variant === 'weddings' ? (pos === 2 ? "md:h-[60vh] md:w-[35vw]" : "h-[60vh] md:w-[20vw]") : "h-[70vh] md:w-[25vw]");
      case 4: case 5: case 7: case 9: case 10:
        return base + "md:h-[60vh] md:w-[37vw]";
      case 6: case 8:
        return base + "h-[60vh] md:w-[18vw]";
      default:
        return base + "h-[25em] w-[35em]";
    }
  };

  return (
    <div className={`flex flex-wrap p-2 w-[93%] mx-auto ${variant === 'reportage' ? 'justify-start gap-1 ' : 'justify-center gap-2'
      }`}>
      {displayPhotos.map((photo, index) => {
        const sizingClass = getSizingClasses(index);

        if (isLoading) {
          return (
            <div
              key={photo.id}
              className={`
        ${sizingClass} bg-stone-100 animate-pulseanimate-in fade-in duration-300`} />);
        }
        const hasLoaded = loadedImages[photo.id];

        if (renderItem) return renderItem(photo, index, sizingClass);

        return (
          <div
            key={photo.id}
            className={`${sizingClass} overflow-hidden bg-stone-50 transition-opacity duration-1000 ${hasLoaded ? 'opacity-100' : 'opacity-0'
              }`}
          >
            <ImageCard
              url={photo.url}
              alt={photo.alt}
              className={`w-full object-cover ${variant === 'reportage' ? 'h-auto md:h-full' : 'h-full'
                } ${hasLoaded
                  ? 'animate-in fade-in slide-in-from-bottom-8 duration-1000 fill-mode-both'
                  : 'opacity-0'
                }`}
              style={{
                animationDelay: `${index * 150}ms`,
              }}
              onClick={() => onItemClick?.(photo)}
              onLoad={() => handleImageLoad(photo.id)}
              has_variant={photo.photo_variants?.length ? <Images size={15} /> : null}
            />
          </div>
        );
      })}
      {variant === 'reportage' && (
        <div className="flex-[10] h-0 min-w-[40%]" aria-hidden="true" />
      )}
    </div>
  );
}