import { useEffect, useCallback, useState } from 'react';

interface PhotoVariant {
  id: string;
  url: string;
}

interface Photo {
  id: string;
  url: string;
  alt?: string;
  photo_variants?: PhotoVariant[];
}

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  photos: Photo[];
  currentIndex: number;
  setCurrentIndex: (index: number) => void;
}

export const ImageModal = ({ isOpen, onClose, photos, currentIndex, setCurrentIndex }: ImageModalProps) => {
  const currentPhoto = photos[currentIndex];
  const [activeUrl, setActiveUrl] = useState<string | null>(null);

  useEffect(() => {
    if (currentPhoto) setActiveUrl(currentPhoto.url);
  }, [currentIndex, currentPhoto]);

  const goNext = useCallback(() => setCurrentIndex((currentIndex + 1) % photos.length), [currentIndex, photos.length, setCurrentIndex]);
  const goPrev = useCallback(() => setCurrentIndex((currentIndex - 1 + photos.length) % photos.length), [currentIndex, photos.length, setCurrentIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, goNext, goPrev]);

  if (!isOpen || !currentPhoto) return null;

  const allRelated = [
    { id: 'main', url: currentPhoto.url },
    ...(currentPhoto.photo_variants || [])
  ];

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black/95 transition-all duration-300">

      {/* Header - Siffra och Stäng-knapp */}
      <div className="flex justify-between items-center p-6 md:px-10">
        <div className="text-white/20 text-[10px] tracking-[0.4em] uppercase font-light">
          {currentIndex + 1} / {photos.length}
        </div>
        <button onClick={onClose} className="text-white/40 hover:text-white text-3xl transition-colors">&times;</button>
      </div>

      {/* Main Image Viewport */}
      <div className="relative flex-grow flex items-center justify-center px-4 md:px-20" onClick={onClose}>
        {/* Navigation Buttons */}
        <button
          onClick={(e) => { e.stopPropagation(); goPrev(); }}
          className="absolute left-4 md:left-10 top-1/2 -translate-y-1/2 text-white/20 hover:text-white text-5xl p-4 transition-all z-[110]"
        >
          &#8249;
        </button>

        <img
          key={activeUrl}
          src={activeUrl || currentPhoto.url}
          alt={currentPhoto?.alt || ''}
          className="max-w-full max-h-[75vh] object-contain shadow-2xl animate-in fade-in zoom-in-95 duration-500"
          onClick={(e) => e.stopPropagation()}
        />

        <button
          onClick={(e) => { e.stopPropagation(); goNext(); }}
          className="absolute right-4 md:right-10 top-1/2 -translate-y-1/2 text-white/20 hover:text-white text-5xl p-4 transition-all z-[110]"
        >
          &#8250;
        </button>
      </div>

      <div
        className="w-full flex flex-col items-center justify-center min-h-[120px]"
        onClick={(e) => e.stopPropagation()}
      >
        {allRelated.length > 1 && (
          <div className="flex gap-4">
            {allRelated.map((img) => {
              const isActive = activeUrl === img.url;
              return (
                <button
                  key={img.id}
                  onClick={() => setActiveUrl(img.url)}
                  className="flex flex-col items-center gap-3 group"
                >
                  <div className={`
                w-12 h-12 md:w-14 md:h-14 transition-all duration-200 overflow-hidden border
                ${isActive
                      ? 'border-white border-2 scale-110'
                      : 'border-transparent opacity-50 blur-[1px] hover:opacity-100 hover:blur-0'
                    }
              `}>
                    <img src={img.url} className="w-full h-full object-cover" alt="Variant preview" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};