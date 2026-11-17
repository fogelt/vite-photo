import {
  cloudinaryImage,
  GRID_DESKTOP_WIDTH,
  MODAL_PREVIEW_HEIGHT,
  modalImageSize,
} from './cloudinary';

/** Width of the tiny thumbnails in the modal's variant strip. */
export const VARIANT_THUMB_WIDTH = 160;

/**
 * URL for the sharp image in the modal, sized to the box it is shown in rather
 * than a fixed width. The box is driven by the viewport height, so a portrait
 * no longer downloads 2000x3000 pixels only to be shown at ~500x750. The sizes
 * come in a few fixed steps (see `modalImageSize`) so they can be pre-created.
 */
export function modalImageSrc(url: string) {
  if (typeof window === 'undefined') return cloudinaryImage(url, { width: GRID_DESKTOP_WIDTH });

  return cloudinaryImage(
    url,
    modalImageSize({
      width: window.innerWidth,
      height: window.innerHeight,
      pixelRatio: window.devicePixelRatio,
    }),
  );
}

/** False for visitors who asked to save data or are on a very slow network. */
export function canPreloadImages() {
  const connection = (navigator as unknown as {
    connection?: { saveData?: boolean; effectiveType?: string };
  }).connection;

  return !(
    connection?.saveData ||
    connection?.effectiveType === 'slow-2g' ||
    connection?.effectiveType === '2g'
  );
}

/** Warm the browser cache with the modal-size version of a photo. */
export function preloadModalImage(url: string) {
  if (!url || !canPreloadImages()) return;
  preloadImage(modalImageSrc(url));
}

/** URL for the mid-size stand-in shown while the sharp modal image loads. */
export function modalPreviewSrc(url: string) {
  return cloudinaryImage(url, { height: MODAL_PREVIEW_HEIGHT });
}

/** Warm the browser cache with the mid-size modal stand-in of a photo. */
export function preloadModalPreview(url: string) {
  if (!url || !canPreloadImages()) return;
  preloadImage(modalPreviewSrc(url));
}

/** Run `callback` when the browser is idle, or shortly after where unsupported. */
export function whenIdle(callback: () => void) {
  const idle = (window as unknown as {
    requestIdleCallback?: (cb: () => void, options?: { timeout: number }) => number;
    cancelIdleCallback?: (handle: number) => void;
  });

  if (idle.requestIdleCallback) {
    const handle = idle.requestIdleCallback(callback, { timeout: 1000 });
    return () => idle.cancelIdleCallback?.(handle);
  }

  const timer = window.setTimeout(callback, 200);
  return () => window.clearTimeout(timer);
}

/** URLs already warmed in the browser cache, so we never request one twice. */
const preloadedImages = new Set<string>();

/** True once `src` is known to be in the browser cache. */
export function isImageLoaded(src: string) {
  return preloadedImages.has(src);
}

/** Record that an `<img>` on the page finished loading `src`. */
export function rememberLoadedImage(src: string) {
  if (src) preloadedImages.add(src);
}

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
