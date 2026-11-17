/**
 * The white curtain that covers the page until the first photos are on screen.
 *
 * The curtain itself lives in `index.html`, with its own inline CSS and script,
 * so it is painted from the very first frame — before the app bundle, the
 * stylesheet or the gallery data have downloaded. This module is the app's side
 * of the handshake: wait for the first photos, then ask the curtain to wave
 * away, from the top-left corner to the bottom-right.
 *
 * The curtain keeps the page plain white for the first couple of seconds, so a
 * fast connection never sees a loading state at all; only after that does its
 * spinner fade in.
 */

const CURTAIN_ID = 'site-curtain';

declare global {
  interface Window {
    /** Waves the curtain away. Defined by the inline script in index.html. */
    __revealSite?: () => void;
    /** Arms the curtain's last-resort reveal. Defined by index.html. */
    __siteMounted?: () => void;
    /** Covers the page again for a route change. Defined by index.html. */
    __siteCurtainShow?: () => void;
    /** Starts the route wave once the new route has landed. Defined by index.html. */
    __siteCurtainSettle?: () => void;
  }
}

/** True while the white curtain still covers the page, i.e. on first load. */
export function isSiteCurtainVisible() {
  return typeof document !== 'undefined' && Boolean(document.getElementById(CURTAIN_ID));
}

/** Reveal the page with the diagonal wave. Safe to call more than once. */
export function revealSiteCurtain() {
  window.__revealSite?.();
}

/**
 * Cover the page and wave it away again, for a route change. Call it when a
 * navigation starts so the old page is hidden while the new route loads.
 */
export function showSiteCurtain() {
  window.__siteCurtainShow?.();
}

/**
 * The new route has committed: hold for a beat, give its opening photos a
 * moment, then dissolve. Safe to call after `showSiteCurtain`.
 */
export function settleSiteCurtain() {
  window.__siteCurtainSettle?.();
}

/**
 * Tells the curtain that the app has rendered, which lets it eventually give up
 * waiting for a photo that never arrives. Until this is called the curtain keeps
 * spinning rather than uncovering a page the browser has not painted yet.
 */
export function markSiteMounted() {
  window.__siteMounted?.();
}

/**
 * Resolves once `src` has loaded and decoded, or failed. Never rejects: a broken
 * or missing photo must not keep the curtain up.
 */
export function waitForImage(src: string) {
  return new Promise<void>((resolve) => {
    const image = new Image();
    const done = () => resolve();

    image.onload = () => {
      if (typeof image.decode === 'function') image.decode().then(done, done);
      else done();
    };
    image.onerror = done;
    image.src = src;
  });
}

/** Resolves once every image has loaded, decoded or failed. */
export function waitForImages(srcs: string[]) {
  return Promise.all(srcs.map(waitForImage)).then(() => undefined);
}
