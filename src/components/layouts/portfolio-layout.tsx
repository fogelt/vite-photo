import { useState } from 'react';
import { ImageContainer, ImageModal } from '@/components/ui/';

interface Photo {
  id: string;
  url: string;
  alt?: string;
  photo_variants?: { id: string; url: string; }[];
}

export function PortfolioLayout({ photos, variant = 'default', isLoading }: { photos: Photo[], variant?: 'default' | 'weddings', isLoading?: boolean }) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  return (
    <section className="w-full py-4">
      <ImageContainer
        photos={photos}
        variant={variant}
        onItemClick={(photo) => {
          const index = photos.findIndex(p => p.id === photo.id);
          setSelectedIndex(index);
        }}
        isLoading={isLoading}
      />

      <ImageModal
        isOpen={selectedIndex !== null}
        onClose={() => setSelectedIndex(null)}
        photos={photos}
        currentIndex={selectedIndex ?? 0}
        setCurrentIndex={setSelectedIndex}
      />
    </section>
  );
}