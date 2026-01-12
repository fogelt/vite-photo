import { useEffect, useCallback, useState } from 'react';

interface PhotoVariant {
  id: string;
  url: string;
}

interface Photo {
  id: string;
  url: string;
  alt?: string;
  description?: string;
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

      {/* Header */}
      <div className="flex justify-between items-center p-6 md:px-10 z-[120]">
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

        <div className="relative group flex flex-col items-center" onClick={(e) => e.stopPropagation()}>

          {/* 1. Variants - Floating OVER the image */}
          {allRelated.length > 1 && (
            <div className="absolute -top-16 left-1/2 -translate-x-1/2 flex gap-3 z-[120] animate-in fade-in slide-in-from-top-4 duration-500">
              {allRelated.map((img) => {
                const isActive = activeUrl === img.url;
                return (
                  <button
                    key={img.id}
                    onClick={() => setActiveUrl(img.url)}
                    className="transition-transform active:scale-95"
                  >
                    <div className={`
                      w-10 h-10 md:w-12 md:h-12 transition-all duration-300 overflow-hidden border
                      ${isActive
                        ? 'border-white border-2 scale-110 shadow-lg'
                        : 'border-white/20 opacity-40 blur-[0.5px] hover:opacity-100 hover:blur-0'
                      }
                    `}>
                      <img src={img.url} className="w-full h-full object-cover" alt="Variant" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Main Image */}
          <img
            key={activeUrl}
            src={activeUrl || currentPhoto.url}
            alt={currentPhoto?.alt || ''}
            className="max-w-full max-h-[65vh] md:max-h-[70vh] object-contain shadow-2xl animate-in fade-in zoom-in-95 duration-500"
          />
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); goNext(); }}
          className="absolute right-4 md:right-10 top-1/2 -translate-y-1/2 text-white/20 hover:text-white text-5xl p-4 transition-all z-[110]"
        >
          &#8250;
        </button>
      </div>

      {/* 2. Photo Description Area - Bottom */}
      <div
        className="w-full flex items-center justify-center py-10 min-h-[120px] z-[120]"
        onClick={(e) => e.stopPropagation()}
      >
        {currentPhoto.description && (
          <div className="max-w-xl px-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <p className="text-white/50 font-light text-[11px] md:text-xs leading-relaxed tracking-[0.15em] uppercase italic">
              {currentPhoto.description}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};