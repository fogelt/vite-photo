import { useEffect, useState } from 'react';
import { cloudinarySrcSet } from '@/utils/cloudinary';
import { useImageLoaded } from '@/utils/use-image-loaded';

interface ImageCardProps {
  url: string;
  alt?: string;
  className?: string;
  imgClassName?: string;
  style?: React.CSSProperties;
  onClick?: (previewSrc?: string) => void;
  onLoad?: () => void;
  has_variant?: React.ReactNode;
  /** Responsive `sizes` hint. Only used when the URL is served by Cloudinary. */
  sizes?: string;
  /** Widths for the responsive `srcset`. Defaults to the shared Cloudinary scale. */
  widths?: number[];
  /** Load immediately instead of lazily. Use for above-the-fold images. */
  priority?: boolean;
  /** Stagger the fade-in by this many milliseconds. */
  revealDelay?: number;
}

const DEFAULT_IMG_CLASS =
  'relative h-full w-full object-cover object-[center_70%] transition-[opacity,transform] duration-700 ease-out group-hover:scale-[1.04]';

const REVEAL_DURATION = 700;
const MOBILE_MEDIA_QUERY = '(max-width: 767px)';

/**
 * Desktop photos are judged on sharpness, so the grid loads the high-resolution
 * source there. Mobile keeps the responsive `srcset` to save data.
 */
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia(MOBILE_MEDIA_QUERY).matches
      : false,
  );

  useEffect(() => {
    const query = window.matchMedia(MOBILE_MEDIA_QUERY);
    const update = () => setIsMobile(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  return isMobile;
}

export function ImageCard({
  url,
  alt,
  className,
  imgClassName,
  style,
  onClick,
  onLoad: onLoadProp,
  has_variant,
  sizes = '100vw',
  widths,
  priority = false,
  revealDelay = 0,
}: ImageCardProps) {
  const image = useImageLoaded(url);
  const isMobile = useIsMobile();
  const srcSet = isMobile ? cloudinarySrcSet(url, widths) : undefined;

  /**
   * The stagger delay belongs to the reveal only. Keeping it on the element
   * would also delay the hover zoom on every hover, which feels sluggish, so we
   * drop it once the fade has finished.
   */
  const [revealComplete, setRevealComplete] = useState(false);

  useEffect(() => {
    if (!image.loaded) {
      setRevealComplete(false);
      return;
    }
    if (!revealDelay) {
      setRevealComplete(true);
      return;
    }
    const timer = window.setTimeout(
      () => setRevealComplete(true),
      revealDelay + REVEAL_DURATION,
    );
    return () => window.clearTimeout(timer);
  }, [image.loaded, revealDelay]);

  const handleLoad = () => {
    image.onLoad();
    onLoadProp?.();
  };

  const revealDelayStyle = revealDelay ? `${revealDelay}ms` : undefined;
  const transitionDelay = revealComplete ? undefined : revealDelayStyle;

  return (
    <div
      className={`group relative overflow-hidden ${className}`}
      onClick={() => onClick?.(image.ref.current?.currentSrc || url)}
      style={style}
    >
      {has_variant && (
        <div
          className="pointer-events-auto absolute top-4 right-4 z-20 flex items-center gap-2 group/icon"
        >
          <span className="whitespace-nowrap rounded-md bg-black/40 px-2 py-1 text-xs font-medium text-white opacity-0 backdrop-blur-md transition-all duration-300 -translate-x-2 group-hover/icon:translate-x-0 group-hover/icon:opacity-100">
            Bilden har varianter
          </span>

          <div className="flex cursor-pointer flex-row rounded-md bg-black/40 px-1 py-1 text-xs font-medium text-white opacity-65 drop-shadow-md backdrop-blur-md transition-transform duration-300 group-hover/icon:scale-110 group-hover/icon:opacity-100">
            Fler bilder
            <div className="ml-2">
              {has_variant}
            </div>
          </div>
        </div>
      )}

      {/* Very dim skeleton in the card's shape until the photo fades in. */}
      <div
        className={`pointer-events-none absolute inset-0 bg-neutral-100 transition-opacity duration-700 ${
          image.loaded ? 'opacity-0' : 'animate-pulse'
        }`}
        style={{ transitionDelay: revealDelayStyle }}
        aria-hidden="true"
      />

      <img
        ref={image.ref}
        src={url}
        srcSet={srcSet}
        sizes={srcSet ? sizes : undefined}
        alt={alt || "Fotografi Myelie Lendelund"}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={priority ? 'high' : 'auto'}
        onLoad={handleLoad}
        onError={image.onError}
        style={{ transitionDelay }}
        className={`${imgClassName ?? DEFAULT_IMG_CLASS} ${
          image.loaded
            ? 'scale-100 opacity-100'
            : 'scale-[1.02] opacity-0'
        }`}
      />
      <div className="absolute inset-0 bg-black/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
    </div>
  );
}
