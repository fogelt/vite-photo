import { useEffect, useCallback } from 'react';

interface Photo {
  id: string;
  url: string;
  alt?: string;
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

  const goNext = useCallback(() => {
    setCurrentIndex((currentIndex + 1) % photos.length);
  }, [currentIndex, photos.length, setCurrentIndex]);

  const goPrev = useCallback(() => {
    setCurrentIndex((currentIndex - 1 + photos.length) % photos.length);
  }, [currentIndex, photos.length, setCurrentIndex]);

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

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4 md:p-10 transition-all duration-300">
      {/* Close Button */}
      <button onClick={onClose} className="absolute top-6 right-6 text-white/50 hover:text-white text-4xl z-[110]">&times;</button>

      {/* Navigation Buttons */}
      <button
        onClick={(e) => { e.stopPropagation(); goPrev(); }}
        className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white text-5xl p-4 transition-colors z-[110]"
      >
        &#8249;
      </button>

      <button
        onClick={(e) => { e.stopPropagation(); goNext(); }}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white text-5xl p-4 transition-colors z-[110]"
      >
        &#8250;
      </button>

      <div className="relative w-full h-full flex items-center justify-center" onClick={onClose}>
        <img
          key={currentPhoto?.id}
          src={currentPhoto?.url}
          alt={currentPhoto?.alt || ''}
          className="max-w-full max-h-full object-contain shadow-2xl animate-in fade-in zoom-in-95 duration-300"
          onClick={(e) => e.stopPropagation()}
        />

        {/* Counter UI */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/40 text-xs tracking-widest uppercase">
          {currentIndex + 1} / {photos.length}
        </div>
      </div>
    </div>
  );
};