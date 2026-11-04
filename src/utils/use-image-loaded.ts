import { useLayoutEffect, useRef, useState } from 'react';

interface ImageLoadedState {
  ref: React.RefObject<HTMLImageElement | null>;
  loaded: boolean;
  onLoad: () => void;
  onError: () => void;
}

/**
 * Tracks whether an <img> has finished loading and always lets the transparent
 * state paint once, so even browser-cached images fade in instead of popping.
 */
export function useImageLoaded(src: string): ImageLoadedState {
  const ref = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);

  useLayoutEffect(() => {
    const img = ref.current;
    setLoaded(false);

    // A cached image can finish before React attaches onLoad, so check the
    // element directly and reveal it on the next painted frame.
    if (!img?.complete || !img.src) return;

    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => setLoaded(true));
    });

    return () => cancelAnimationFrame(frame);
  }, [src]);

  return {
    ref,
    loaded,
    onLoad: () => setLoaded(true),
    onError: () => setLoaded(true),
  };
}
