interface CloudinaryImageOptions {
  /** Target width in pixels. Ignored when `blur` is set. */
  width?: number;
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
  { width = 1600, blur = false }: CloudinaryImageOptions = {}
) {
  if (!isCloudinaryUrl(url)) {
    return url;
  }

  const { base, tail } = splitCloudinaryUrl(url);
  const transform = blur
    ? 'w_40,c_limit,e_blur:600,q_auto,f_auto'
    : `w_${width},c_limit,f_auto,q_auto`;

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
