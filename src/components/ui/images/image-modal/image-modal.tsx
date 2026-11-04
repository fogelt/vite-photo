import { useCallback, useEffect, useState } from 'react';
import { cloudinaryImage, preloadImage, VARIANT_THUMB_WIDTH } from '@/utils';
import { useImageLoaded } from '@/utils/use-image-loaded';

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

export interface ImagePreview {
  id: string;
  src: string;
}

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  photos: Photo[];
  currentIndex: number;
  setCurrentIndex: (index: number) => void;
  /**
   * The already-decoded thumbnail the user clicked. It is shown immediately so
   * the large view opens with zero perceived delay.
   */
  preview?: ImagePreview | null;
}

/** Width of the sharp image in the large view. */
const MODAL_IMAGE_WIDTH = 2000;

/** Larger stand-in for the main view when a variant is picked. */
const VARIANT_PREVIEW_WIDTH = 600;

function preloadVariant(url: string) {
  preloadImage(cloudinaryImage(url, { width: MODAL_IMAGE_WIDTH }));
}

/**
 * Mounts only while open, so the sharp image always re-checks the browser cache
 * instead of keeping stale loaded state from a previous open.
 */
export const ImageModal = (props: ImageModalProps) => {
  if (!props.isOpen || !props.photos[props.currentIndex]) return null;
  return <ImageModalContent {...props} />;
};

const ImageModalContent = ({
  onClose,
  photos,
  currentIndex,
  setCurrentIndex,
  preview,
}: ImageModalProps) => {
  const currentPhoto = photos[currentIndex];
  const [activeVariant, setActiveVariant] = useState<string | null>(null);

  const displayUrl = activeVariant ?? currentPhoto.url;
  const sharpSrc = cloudinaryImage(displayUrl, { width: MODAL_IMAGE_WIDTH });
  const sharp = useImageLoaded(sharpSrc);

  // Variant images are small, and warming them early is what makes browsing
  // alternatives instant. Start right away rather than waiting for the main
  // image, but skip it for visitors who explicitly asked to save data.
  useEffect(() => {
    const connection = (navigator as unknown as { connection?: { saveData?: boolean } }).connection;
    if (connection?.saveData) return;

    const timer = window.setTimeout(() => {
      for (const variant of currentPhoto.photo_variants || []) {
        preloadVariant(variant.url);
      }
    }, 150);

    return () => window.clearTimeout(timer);
  }, [currentPhoto]);

  // A new photo always starts on its main image.
  useEffect(() => {
    setActiveVariant(null);
  }, [currentIndex]);

  const goNext = useCallback(
    () => setCurrentIndex((currentIndex + 1) % photos.length),
    [currentIndex, photos.length, setCurrentIndex],
  );
  const goPrev = useCallback(
    () => setCurrentIndex((currentIndex - 1 + photos.length) % photos.length),
    [currentIndex, photos.length, setCurrentIndex],
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, goNext, goPrev]);

  const allRelated = [
    { id: 'main', url: currentPhoto.url },
    ...(currentPhoto.photo_variants || []),
  ];

  // Reuse the thumbnail the user just clicked for an instant first paint. When
  // a variant is picked, its (already fetched) strip thumbnail does the same.
  const instantSrc = activeVariant
    ? cloudinaryImage(activeVariant, { width: VARIANT_PREVIEW_WIDTH })
    : preview?.id === currentPhoto.id
      ? preview.src
      : null;

  // Tiny blur fallback, e.g. after navigating with the arrow keys.
  const placeholderSrc = instantSrc ?? cloudinaryImage(displayUrl, { blur: true });

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black/95 transition-all duration-300">

      {/* Header */}
      <div className="z-[120] flex items-center justify-between p-6 md:px-10">
        <div className="text-[11px] uppercase tracking-[0.3em] text-white/35">
          {currentIndex + 1} / {photos.length}
        </div>
        <button
          onClick={onClose}
          aria-label="Stäng"
          className="text-3xl leading-none text-white/40 transition-colors hover:text-white"
        >
          &times;
        </button>
      </div>

      {/* Main Image Viewport */}
      <div className="relative flex flex-grow items-center justify-center px-4 md:px-20" onClick={onClose}>

        {/* Navigation Buttons */}
        <button
          onClick={(e) => { e.stopPropagation(); goPrev(); }}
          aria-label="Föregående bild"
          className="absolute left-4 top-1/2 z-[110] -translate-y-1/2 p-4 text-5xl text-white/20 transition-colors hover:text-white md:left-10"
        >
          &#8249;
        </button>

        <div className="group relative flex flex-col items-center" onClick={(e) => e.stopPropagation()}>

          {/* Variants - floating above the image */}
          {allRelated.length > 1 && (
            <div className="absolute -top-16 left-1/2 z-[120] flex -translate-x-1/2 gap-3 animate-in fade-in slide-in-from-top-4 duration-500">
              {allRelated.map((img) => {
                const isActive = displayUrl === img.url;
                return (
                  <button
                    key={img.id}
                    onClick={() => setActiveVariant(img.url === currentPhoto.url ? null : img.url)}
                    onPointerEnter={() => preloadVariant(img.url)}
                    onFocus={() => preloadVariant(img.url)}
                    onPointerDown={() => preloadVariant(img.url)}
                    aria-label="Visa variant"
                    className="transition-transform active:scale-95"
                  >
                    <div className={`
                      h-10 w-10 overflow-hidden border transition-all duration-300 md:h-12 md:w-12
                      ${isActive
                        ? 'scale-110 border-2 border-white shadow-lg'
                        : 'border-white/20 opacity-40 blur-[0.5px] hover:opacity-100 hover:blur-0'
                      }
                    `}>
                      <img
                        src={cloudinaryImage(img.url, { width: VARIANT_THUMB_WIDTH })}
                        loading="eager"
                        decoding="async"
                        className="h-full w-full object-cover"
                        alt=""
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Main Image. The placeholder is in normal flow so it defines the
              layout box, and the box is driven by the viewport height so even a
              small variant thumbnail scales up instead of rendering tiny. */}
          <div className="relative h-[65vh] max-w-full animate-in fade-in zoom-in-95 duration-500 md:h-[70vh] md:max-w-[calc(100vw-10rem)] max-w-[calc(100vw-2rem)]">
            <img
              src={placeholderSrc}
              alt=""
              aria-hidden="true"
              className="h-full w-auto max-w-full object-contain drop-shadow-2xl"
            />
            <img
              ref={sharp.ref}
              src={sharpSrc}
              alt={currentPhoto.alt || ''}
              loading="eager"
              decoding="async"
              fetchPriority="high"
              onLoad={sharp.onLoad}
              onError={sharp.onError}
              className={`absolute inset-0 h-full w-full object-contain drop-shadow-2xl transition-opacity duration-300 ${
                sharp.loaded ? 'opacity-100' : 'opacity-0'
              }`}
            />
          </div>
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); goNext(); }}
          aria-label="Nästa bild"
          className="absolute right-4 top-1/2 z-[110] -translate-y-1/2 p-4 text-5xl text-white/20 transition-colors hover:text-white md:right-10"
        >
          &#8250;
        </button>
      </div>

      {/* Photo Description - Bottom */}
      <div
        className="z-[120] flex min-h-[120px] w-full items-center justify-center py-10"
        onClick={(e) => e.stopPropagation()}
      >
        {currentPhoto.description && (
          <div className="max-w-xl px-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <p className="text-[11px] font-light uppercase italic leading-relaxed tracking-[0.15em] text-white/50 md:text-xs">
              {currentPhoto.description}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
