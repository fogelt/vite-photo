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
      return "lg:h-[360px] w-auto flex-grow";
    }

    const pos = (index % 10) + 1;
    const base = "flex-grow h-auto";

    switch (pos) {
      case 1: case 2: case 3:
        return base + " " + (variant === 'weddings'
          ? (pos === 2 ? "h-[60vh] w-full md:w-[32%]" : "h-[60vh] w-full md:w-[20%]")
          : "h-[70vh] w-full md:w-[28%]");

      case 4: case 5: case 7: case 9: case 10:
        return base + "h-[60vh] w-full md:w-[45%]";

      case 6: case 8:
        return base + "h-[60vh] w-full md:w-[18%]";

      default:
        return base + "h-[25em] w-[30%]";
    }
  };

  return (
    <div className={`flex flex-wrap p-2 w-[93%] max-w-[2000px] mx-auto justify-center ${variant === 'reportage' ? 'gap-1 max-w-[1350px]' : ' gap-2'
      }`}>
      {displayPhotos.map((photo, index) => {
        const sizingClass = getSizingClasses(index);

        if (isLoading) {
          return (
            <div
              key={photo.id}
              className={`${sizingClass} bg-stone-200 animate-pulse fade-in min-h-[500px]`}
            />
          );
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
    </div>
  );
}