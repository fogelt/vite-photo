import { useEffect } from 'react';
import { ImageCard } from '@/components/ui';
import { cloudinaryImage, preloadImage, VARIANT_THUMB_WIDTH } from '@/utils';
import { Images } from 'lucide-react';

interface Photo {
  id: string;
  url: string;
  alt?: string;
  description?: string;
  photo_variants?: { id: string; url: string }[];
}

interface ImageContainerProps {
  photos: Photo[];
  variant?: 'default' | 'weddings' | 'editorial' | 'reportage';
  onItemClick?: (photo: Photo, previewSrc?: string) => void;
  renderItem?: (photo: Photo, index: number, className: string) => React.ReactNode;
  isLoading?: boolean;
  skeletonCount?: number;
}

/**
 * The signature mosaic gallery.
 *
 * - `default` / `weddings` keep the portfolio's original grid: widths follow a
 *   repeating rhythm and each tile keeps the photo's natural aspect ratio, so
 *   the grid only crops slightly instead of forcing every photo into a fixed
 *   box.
 * - `editorial` is the 11-photo editorial mosaic used by the wedding site: three
 *   row rhythms — ||-|, |-|| and --| (| = 2:3 portrait, - = 3:2 landscape).
 * - `reportage` is a full-bleed row.
 */
export function ImageContainer({
  photos,
  variant = 'default',
  onItemClick,
  renderItem,
  isLoading,
  skeletonCount,
}: ImageContainerProps) {
  // The portfolio/weddings rhythm repeats in rows of 3 + 2 + 3 + 2 + 3 = 13,
  // so that count keeps the placeholders in complete rows instead of leaving a
  // single stretched tile. The editorial cycle is 11 photos.
  const skeletonTotal = skeletonCount ?? (variant === 'editorial' ? 11 : 13);

  const displayPhotos = isLoading
    ? Array.from({ length: skeletonTotal }).map((_, i) => ({ id: `skeleton-${i}`, url: '' })) as Photo[]
    : photos;

  /** Warm the tiny variant strip images before the modal opens. */
  const warmVariantThumbs = (photo: Photo) => {
    if (!photo.photo_variants?.length) return;

    // The strip shows the main photo first, then each variant.
    preloadImage(cloudinaryImage(photo.url, { width: VARIANT_THUMB_WIDTH }));
    for (const variant of photo.photo_variants) {
      preloadImage(cloudinaryImage(variant.url, { width: VARIANT_THUMB_WIDTH }));
    }
  };

  useEffect(() => {
    if (isLoading) return;

    // Only photos with variants get a strip: main image + its alternatives.
    const stripUrls = photos.flatMap((photo) =>
      photo.photo_variants?.length
        ? [photo.url, ...photo.photo_variants.map((variant) => variant.url)]
        : [],
    );
    if (stripUrls.length === 0) return;

    // Respect data-saving and very slow connections.
    const connection = (navigator as unknown as {
      connection?: { saveData?: boolean; effectiveType?: string };
    }).connection;
    if (
      connection?.saveData ||
      connection?.effectiveType === 'slow-2g' ||
      connection?.effectiveType === '2g'
    ) {
      return;
    }

    const warm = () => {
      for (const url of stripUrls) {
        preloadImage(cloudinaryImage(url, { width: VARIANT_THUMB_WIDTH }));
      }
    };

    // Let the grid's own images start first, then warm the tiny thumbs.
    const requestIdle = (window as unknown as {
      requestIdleCallback?: (callback: () => void) => number;
    }).requestIdleCallback;

    const timer = window.setTimeout(() => {
      if (requestIdle) requestIdle(warm);
      else warm();
    }, 300);

    return () => window.clearTimeout(timer);
  }, [photos, isLoading]);

  const getSizingClasses = (index: number) => {
    if (variant === 'reportage') {
      return 'flex-grow w-auto xl:h-[265px]';
    }

    if (variant === 'editorial') {
      // Editorial mosaic: three row rhythms cycle every 11 photos —
      // ||-|, |-|| and --| (| = 2:3 portrait, - = 3:2 landscape).
      // Widths are proportional to each tile's aspect so all tiles in a row
      // share one height; the px subtractions cover the 8px gaps plus a small
      // rounding margin, letting rows fill the container without wrapping.
      switch (index % 11) {
        case 2:
        case 5: // the landscape in the two 4-photo rows (||-| and |-||)
          return 'h-auto w-full md:aspect-[3/2] md:w-[calc(43%_-_11px)]';

        case 8:
        case 9: // the two landscapes in the closing --| row
          return 'h-auto w-full md:aspect-[3/2] md:w-[calc(41%_-_7px)]';

        case 10: // the portrait that closes the --| row
          return 'h-auto w-full md:aspect-[2/3] md:w-[calc(18%_-_3.5px)]';

        default: // the portraits in the two 4-photo rows
          return 'h-auto w-full md:aspect-[2/3] md:w-[calc(19%_-_5px)]';
      }
    }

    // Portfolio grid. Keep `h-auto`: the photo's natural aspect decides the row
    // height, which is what keeps the tiles from being cropped too hard.
    const base = 'flex-grow h-auto';
    const pos = (index % 10) + 1;

    if (variant === 'weddings') {
      switch (pos) {
        case 2: // the wide feature in the opening triptych
          return base + ' w-full md:w-[50%]';

        case 1:
        case 3: // the two portraits flanking it
          return base + ' w-full md:w-[20%]';

        case 4:
        case 5:
        case 7:
        case 9:
        case 10:
          return base + ' w-full md:w-[45%]';

        case 6:
        case 8:
          return base + ' w-full md:w-[18%]';

        default:
          return base + ' w-[30%]';
      }
    }

    switch (pos) {
      case 1:
      case 2:
      case 3:
        // The opening row follows each photo's natural aspect, like the live site.
        return base + ' w-full md:w-[28%]';

      case 4:
      case 5:
      case 7:
      case 9:
      case 10:
        return base + ' w-full md:w-[45%]';

      case 6:
      case 8:
        return base + ' w-full md:w-[18%]';

      default:
        return base + ' w-[30%]';
    }
  };

  /** Give each skeleton the aspect ratio its real photo will have. */
  const getSkeletonAspect = (index: number) => {
    if (variant === 'reportage') return 'aspect-[3/2]';

    if (variant === 'editorial') {
      switch (index % 11) {
        case 2:
        case 5:
        case 8:
        case 9:
          return 'aspect-[3/2]';
        default:
          return 'aspect-[2/3]';
      }
    }

    const pos = (index % 10) + 1;

    if (variant === 'weddings') {
      // 20 / 50 / 20 triptychs, then the 45 / 18 / 45 / 18 / 45 rows.
      switch (pos) {
        case 1:
        case 3:
        case 6:
        case 8:
          return 'aspect-[2/3]';
        default:
          return 'aspect-[3/2]';
      }
    }

    // Portfolio: portraits in the opening row and the narrow 18% tiles,
    // landscapes in the wide 45% tiles.
    switch (pos) {
      case 1:
      case 2:
      case 3:
      case 6:
      case 8:
        return 'aspect-[2/3]';
      default:
        return 'aspect-[3/2]';
    }
  };

  /**
   * Responsive `sizes` hint per tile. This must follow the actual rendered tile
   * width, otherwise the browser picks a too-small `srcset` candidate and wide
   * landscape tiles end up visibly stretched.
   */
  const getSizes = (index: number) => {
    if (variant === 'reportage') return '(min-width: 768px) 50vw, 100vw';

    if (variant === 'editorial') {
      switch (index % 11) {
        case 2:
        case 5:
        case 8:
        case 9: // the wider landscape tiles
          return '(min-width: 768px) 43vw, 100vw';
        default: // the narrow portrait tiles
          return '(min-width: 768px) 20vw, 100vw';
      }
    }

    const pos = (index % 10) + 1;

    if (variant === 'weddings') {
      switch (pos) {
        case 2:
          return '(min-width: 768px) 50vw, 100vw';
        case 1:
        case 3:
          return '(min-width: 768px) 20vw, 100vw';
        case 6:
        case 8:
          return '(min-width: 768px) 18vw, 100vw';
        default:
          return '(min-width: 768px) 45vw, 100vw';
      }
    }

    switch (pos) {
      case 4:
      case 5:
      case 7:
      case 9:
      case 10:
        return '(min-width: 768px) 45vw, 100vw';
      case 1:
      case 2:
      case 3:
        return '(min-width: 768px) 28vw, 100vw';
      case 6:
      case 8:
        return '(min-width: 768px) 18vw, 100vw';
      default:
        return '(min-width: 768px) 30vw, 100vw';
    }
  };

  return (
    <div className={`flex flex-wrap p-2 w-[93%] mx-auto justify-center ${variant === 'reportage' ? ' gap-1 max-w-[1000px]' : ' gap-2 max-w-[2000px]'
      }`}>
      {displayPhotos.map((photo, index) => {
        const sizingClass = getSizingClasses(index);

        if (isLoading) {
          return (
            <div
              key={photo.id}
              className={`${sizingClass} ${getSkeletonAspect(index)} bg-neutral-100 animate-pulse fade-in`}
              aria-hidden="true"
            />
          );
        }
        if (renderItem) return renderItem(photo, index, sizingClass);

        return (
          <div
            key={photo.id}
            className={`${sizingClass} overflow-hidden bg-neutral-100`}
            onPointerEnter={() => warmVariantThumbs(photo)}
            onPointerDown={() => warmVariantThumbs(photo)}
          >
            <ImageCard
              url={photo.url}
              alt={photo.alt}
              className="h-full w-full"
              imgClassName={`w-full object-cover object-[center_70%] transition-[opacity,transform] duration-700 ease-out group-hover:scale-[1.04] h-auto ${
                variant === 'reportage' ? 'xl:h-full' : 'md:h-full'
              }`}
              sizes={getSizes(index)}
              revealDelay={Math.min(index, 4) * 60}
              onClick={(previewSrc) => onItemClick?.(photo, previewSrc)}
              has_variant={photo.photo_variants?.length ? <Images size={15} /> : null}
            />
          </div>
        );
      })}
    </div>
  );
}
