import { cloudinaryWarmUrls, WARM_ACCEPT_HEADERS } from './cloudinary';

/**
 * Requests run a few at a time: each one may make Cloudinary resize a large
 * original, and a batch upload should not flood the admin's connection.
 */
const MAX_CONCURRENT = 3;

const queue: Array<() => Promise<void>> = [];
let active = 0;

function pump() {
  while (active < MAX_CONCURRENT && queue.length > 0) {
    const job = queue.shift()!;
    active++;
    job().finally(() => {
      active--;
      pump();
    });
  }
}

/**
 * Ask Cloudinary for the resized versions visitors will request (grid tile and
 * modal sizes, AVIF and WebP), so it creates and stores them now instead of
 * making the first visitor wait. Fire-and-forget: failures are only logged.
 *
 * `no-cors` keeps this a plain image GET with no preflight; `Accept` is a
 * CORS-safelisted header so it is still sent, which is what selects the format
 * under `f_auto`. `no-store` keeps the admin's own cache out of the way.
 */
export function warmCloudinaryImage(url: string) {
  for (const target of cloudinaryWarmUrls(url)) {
    for (const accept of WARM_ACCEPT_HEADERS) {
      queue.push(() =>
        fetch(target, { mode: 'no-cors', cache: 'no-store', headers: { Accept: accept } })
          .then(() => undefined)
          .catch((error) => console.warn('Could not warm image', target, error)),
      );
    }
  }
  pump();
}
