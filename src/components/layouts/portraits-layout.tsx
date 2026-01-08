import { useState } from 'react';
import { ImageContainer, ImageModal } from '@/components/ui/';

interface Photo {
  id: string;
  url: string;
  alt?: string;
}

export function PortraitsLayout({ photos, variant = 'default' }: { photos: Photo[], variant?: 'default' | 'weddings' }) {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  return (
    <section className="w-full py-4">
      <ImageContainer
        photos={photos}
        variant={variant}
        onItemClick={(photo) => setSelectedPhoto(photo)}
      />

      <ImageModal
        isOpen={!!selectedPhoto}
        onClose={() => setSelectedPhoto(null)}
        imageUrl={selectedPhoto?.url || ''}
        alt={selectedPhoto?.alt || 'Porträttfoto'}
      />
    </section>
  );
}