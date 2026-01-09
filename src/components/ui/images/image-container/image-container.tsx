import { ImageCard } from '@/components/ui';

interface Photo {
  id: string;
  url: string;
  alt?: string;
}

interface ImageContainerProps {
  photos: Photo[];
  variant?: 'default' | 'weddings';
  onItemClick?: (photo: Photo) => void;
}

export function ImageContainer({
  photos,
  variant = 'default',
  onItemClick
}: ImageContainerProps) {

  const getSizingClasses = (index: number) => {
    const pos = (index % 10) + 1;
    switch (pos) {
      case 1: case 2: case 3:
        if (variant === 'weddings') {
          return pos === 2 ? "h-[60vh] md:w-[35vw]" : "h-[60vh] md:w-[20vw]";
        }
        return "h-[65vh] md:w-[25vw]";
      case 4: return "h-[55vh] md:w-[40vw]";
      case 5: return "h-[55vh] md:w-[35vw]";
      case 6: case 8: return "h-[50vh] md:w-[20vw]";
      case 7: return "h-[50vh] md:w-[35vw]";
      case 9: return "h-[60vh] md:w-[35vw]";
      case 10: return "h-[60vh] md:w-[30vw]";
      default: return "h-[25em] w-[35em]";
    }
  };

  return (
    <div className="flex flex-wrap justify-center gap-2 p-2 w-[93%] mx-auto">
      {photos.map((photo, index) => (
        <ImageCard
          key={photo.id}
          url={photo.url}
          alt={photo.alt}
          // We apply the animation classes and sizing classes to the SAME element
          className={`
            flex-grow ${getSizingClasses(index)}
            animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both
          `}
          // We pass the delay as an inline style so it doesn't affect the CSS classes
          style={{
            animationDelay: `${Math.min(index * 100, 1000)}ms`
          }}
          onClick={() => onItemClick?.(photo)}
        />
      ))}
    </div>
  );
}