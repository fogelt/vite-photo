interface CloudinaryImageOptions {
  /** Target width in pixels. Ignored when `blur` is set. */
  width?: number;
  /**
   * Target height in pixels. Ignored when `blur` is set. Together with `width`
   * the image is scaled down to fit inside both (never upscaled).
   */
  height?: number;
  /** Return a tiny blurred placeholder instead of the full-size image. */
  blur?: boolean;
}

const UPLOAD_PATH = '/image/upload/';
const CLOUDINARY_HOST = 'res.cloudinary.com';

/** Widths used for responsive `srcset` delivery. */
export const CLOUDINARY_WIDTHS = [400, 640, 900, 1200, 1600, 2000];

function isCloudinaryUrl(url: string) {
  return Boolean(url) && url.includes(CLOUDINARY_HOST) && url.includes(UPLOAD_PATH);
}

function splitCloudinaryUrl(url: string) {
  const [base, rest] = url.split(UPLOAD_PATH);
  const slash = rest.indexOf('/');

  // `rest` looks like either `v123/id.jpg`, `f_auto,q_auto/id.jpg` or `id.jpg`.
  // Drop any existing transformation segment and keep the version + filename.
  let tail = rest;
  if (slash !== -1) {
    const first = rest.slice(0, slash);
    if (!/^v\d+$/.test(first)) tail = rest.slice(slash + 1);
  }

  return { base, tail };
}

/**
 * Rewrites a Cloudinary delivery URL with width/quality transformations.
 * Non-Cloudinary URLs (or URLs that already point elsewhere) are returned as-is.
 */
export function cloudinaryImage(
  url: string,
  { width, height, blur = false }: CloudinaryImageOptions = {}
) {
  if (!isCloudinaryUrl(url)) {
    return url;
  }

  const { base, tail } = splitCloudinaryUrl(url);

  // With no size at all, fall back to 1600 wide.
  const size = [
    width || !height ? `w_${width ?? 1600}` : null,
    height ? `h_${height}` : null,
  ]
    .filter(Boolean)
    .join(',');

  const transform = blur
    ? 'w_40,c_limit,e_blur:600,q_auto,f_auto'
    : `${size},c_limit,f_auto,q_auto`;

  return `${base}${UPLOAD_PATH}${transform}/${tail}`;
}

/**
 * Builds a responsive `srcset` for a Cloudinary URL. Returns `undefined` for
 * other hosts so the browser simply falls back to the plain `src`.
 */
export function cloudinarySrcSet(url: string, widths: number[] = CLOUDINARY_WIDTHS) {
  if (!isCloudinaryUrl(url)) return undefined;

  return widths
    .map((width) => `${cloudinaryImage(url, { width })} ${width}w`)
    .join(', ');
}

// ---------------------------------------------------------------------------
// Shared delivery sizes
//
// These live here (this file has no imports) so the browser code and the
// `scripts/warm-cloudinary.mts` backfill script agree on the exact URLs.
// Cloudinary only creates a resized image the first time its URL is requested,
// so every distinct URL is a potential slow first view: keep the set small.
// ---------------------------------------------------------------------------

/** Desktop grid tiles are at most ~1000 CSS px wide, so 2000 is sharp on 2x screens. */
export const GRID_DESKTOP_WIDTH = 2000;

/**
 * Grid widths on phones. Tiles are full width there, so 900 covers almost
 * every phone at 2x (a 430 px wide screen needs ~800); 640 serves 1-1.5x
 * screens and 1400 phones held sideways.
 */
export const GRID_MOBILE_WIDTHS = [640, 900, 1400];

/**
 * `srcset` for the grid on phones. Plain `w` descriptors make a 3x phone fetch
 * 1200-1600 px wide tiles, about twice the bytes of 2x for no visible gain on a
 * small screen, so widths above what the screen needs at 2x are left out. The
 * steps match `GRID_MOBILE_WIDTHS`, so they can be created ahead of time.
 */
export function mobileGridSrcSet(url: string, { width, pixelRatio }: Omit<Viewport, 'height'>) {
  const needed = width * Math.min(pixelRatio || 1, MAX_PIXEL_RATIO);
  const cap = GRID_MOBILE_WIDTHS.findIndex((step) => step >= needed);
  const widths = cap === -1 ? GRID_MOBILE_WIDTHS : GRID_MOBILE_WIDTHS.slice(0, cap + 1);
  return cloudinarySrcSet(url, widths);
}

/** Height steps for the large modal image. */
export const MODAL_HEIGHT_STEPS = [1080, 1440, 2160];

/** Width cap for the modal on phones, where landscapes are limited by width. */
export const MODAL_PHONE_WIDTH = 1080;

/**
 * Mid-size stand-in shown in the modal while the sharp image loads. Small
 * enough (~30-60 KB) to preload several photos ahead, sharp enough that fast
 * browsing looks fine instead of showing a blur.
 */
export const MODAL_PREVIEW_HEIGHT = 540;

/** Below this viewport width the phone width cap applies (Tailwind's `md`). */
const PHONE_BREAKPOINT = 768;

/** Share of the viewport height the modal image box takes up (`h-[70vh]`). */
const MODAL_HEIGHT_SHARE = 0.7;

/** Beyond 2x the extra pixels cost far more bytes than they add in sharpness. */
const MAX_PIXEL_RATIO = 2;

export interface Viewport {
  width: number;
  height: number;
  pixelRatio: number;
}

/**
 * Size of the sharp modal image for a viewport. The box is driven by the
 * viewport height, so the height is rounded up to a fixed step; phones also get
 * a width cap so a landscape is not fetched far wider than the screen.
 */
export function modalImageSize({ width, height, pixelRatio }: Viewport) {
  const ratio = Math.min(pixelRatio || 1, MAX_PIXEL_RATIO);
  const needed = height * MODAL_HEIGHT_SHARE * ratio;
  const stepHeight =
    MODAL_HEIGHT_STEPS.find((step) => step >= needed) ??
    MODAL_HEIGHT_STEPS[MODAL_HEIGHT_STEPS.length - 1];

  return width < PHONE_BREAKPOINT
    ? { width: MODAL_PHONE_WIDTH, height: stepHeight }
    : { height: stepHeight };
}

/**
 * The resized versions of a photo that are worth creating ahead of time: the
 * desktop and phone grid tiles, the modal preview and the modal sizes common
 * screens ask for. The 2160 modal step and the rarer phone grid steps (640,
 * 1400) are left out; few screens use them.
 */
export function cloudinaryWarmUrls(url: string) {
  if (!isCloudinaryUrl(url)) return [];

  return [
    cloudinaryImage(url, { width: GRID_DESKTOP_WIDTH }),
    cloudinaryImage(url, { width: 900 }),
    cloudinaryImage(url, { height: MODAL_PREVIEW_HEIGHT }),
    cloudinaryImage(url, { height: 1080 }),
    cloudinaryImage(url, { height: 1440 }),
    cloudinaryImage(url, { width: MODAL_PHONE_WIDTH, height: 1080 }),
    cloudinaryImage(url, { width: MODAL_PHONE_WIDTH, height: 1440 }),
  ];
}

/**
 * Wedding-site hero (`vite-wed-site`, `hero-frames.ts`): the full-bleed phone
 * frame, capped at 1600 on the long side, and each standing desktop frame.
 */
export const HERO_PHONE_SIZE = { width: 1600, height: 1600 };
export const HERO_STANDING_WIDTH = 1400;

/** The wedding hero sizes, worth creating ahead for photos in `weddings_main`. */
export function heroWarmUrls(url: string) {
  if (!isCloudinaryUrl(url)) return [];

  return [
    cloudinaryImage(url, HERO_PHONE_SIZE),
    cloudinaryImage(url, { width: HERO_STANDING_WIDTH }),
  ];
}

/** The tag whose photos the wedding site's hero is picked from. */
export const HERO_TAG = 'weddings_main';

/**
 * `f_auto` makes Cloudinary pick the format from the browser's `Accept`
 * header, and each format is a separate derived image. These cover modern
 * browsers (AVIF) and the rest (WebP).
 */
export const WARM_ACCEPT_HEADERS = [
  'image/avif,image/webp,image/*,*/*;q=0.8',
  'image/webp,image/*,*/*;q=0.8',
];
