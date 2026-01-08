import { ImageCard } from '@/components/ui';

interface ImageContainerProps {
  photos: { id: string; url: string; alt?: string }[];
  variant?: 'default' | 'weddings';
}

export function ImageContainer({ photos, variant = 'default' }: ImageContainerProps) {

  const getSizingClasses = (index: number) => {
    const pos = (index % 10) + 1;

    switch (pos) {
      // First three
      case 1: case 2: case 3:
        if (variant === 'weddings') {
          return pos === 2 ? "h-[60vh] md:w-[35vw]" : "h-[60vh] md:w-[20vw]";
        }
        return "h-[65vh] md:w-[25vw]";

      // Next two landscapes
      case 4: return "h-[55vh] md:w-[40vw]";
      case 5: return "h-[55vh] md:w-[35vw]";

      // Mixed style
      case 6: case 8: return "h-[50vh] md:w-[20vw]";
      case 7: return "h-[50vh] md:w-[35vw]";

      // Ending
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
          className={`flex-grow ${getSizingClasses(index)}`}
        />
      ))}
    </div>
  );
}