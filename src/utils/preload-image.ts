/** Width of the tiny thumbnails in the modal's variant strip. */
export const VARIANT_THUMB_WIDTH = 160;

/** URLs already warmed in the browser cache, so we never request one twice. */
const preloadedImages = new Set<string>();

/** Requests still in flight, kept referenced so the browser cannot cancel them. */
const inFlightImages = new Map<string, HTMLImageElement>();

/**
 * Warm the browser cache so a later `<img>` with the same URL can paint
 * immediately instead of waiting for a network round trip.
 */
export function preloadImage(src: string) {
  if (!src || preloadedImages.has(src) || inFlightImages.has(src)) return;

  const image = new Image();
  image.decoding = 'async';
  image.onload = () => {
    preloadedImages.add(src);
    inFlightImages.delete(src);
  };
  image.onerror = () => {
    inFlightImages.delete(src);
  };
  image.src = src;
  inFlightImages.set(src, image);
}
