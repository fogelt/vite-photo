import { useEffect, useLayoutEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header, Footer } from '@/components/ui';
import {
  markSiteMounted,
  revealSiteCurtain,
  ScrollToTop,
  settleSiteCurtain,
  showSiteCurtain,
  waitForImages,
} from '@/utils';

/** The photos a visitor meets first: the ones in or just below the viewport. */
function firstVisibleImageSrcs() {
  const viewportHeight = window.innerHeight;

  return Array.from(document.querySelectorAll<HTMLImageElement>('main img'))
    .filter((image) => {
      const rect = image.getBoundingClientRect();
      return rect.bottom > 0 && rect.top < viewportHeight;
    })
    .map((image) => image.currentSrc || image.src)
    .filter(Boolean);
}

/**
 * How long to wait for the first photos to show up in the DOM. The gallery data
 * arrives after the route renders, so this covers a slow Supabase response; if
 * nothing arrives by then the page is revealed with its skeletons instead.
 */
const PHOTO_WAIT_CAP = 4000;

export default function AppRoot() {
  const { pathname } = useLocation();
  const lastPathname = useRef(pathname);

  // Every route change gets the same dissolve. The navigation itself may have
  // covered the page already; this makes sure it is covered and then starts the
  // wave once the new route is committed.
  useLayoutEffect(() => {
    if (lastPathname.current === pathname) return;
    lastPathname.current = pathname;
    showSiteCurtain();
    settleSiteCurtain();
  }, [pathname]);

  // The white curtain from index.html stays up until the first photos are in,
  // then waves away from the top-left corner. Waiting for those photos means
  // the page is never revealed half-empty, while the curtain hides the wait
  // (and adds its spinner only if it takes a while).
  useEffect(() => {
    // From here on the curtain may give up on a photo that never finishes.
    markSiteMounted();

    let cancelled = false;
    let timer = 0;
    const startedAt = Date.now();

    const reveal = () => {
      if (!cancelled) revealSiteCurtain();
    };

    const revealWhenReady = () => {
      const srcs = firstVisibleImageSrcs();

      // Lazy routes can commit a frame after this layout, so keep looking for
      // the first photos briefly instead of revealing an empty page.
      if (srcs.length === 0 && Date.now() - startedAt < PHOTO_WAIT_CAP) {
        timer = window.setTimeout(revealWhenReady, 100);
        return;
      }

      void waitForImages(srcs).then(reveal);
    };

    // The admin is a private dashboard with its own loading UI and often no
    // photos in view: reveal as soon as it has painted, don't hold it for photos.
    const path = window.location.pathname.replace(/\/+$/, '');
    if (path.startsWith('/admin')) {
      const waitForContent = () => {
        const main = document.querySelector('main');
        if (main?.childElementCount && !cancelled) {
          reveal();
          return;
        }
        if (Date.now() - startedAt >= 1500) {
          reveal();
          return;
        }
        timer = window.setTimeout(waitForContent, 100);
      };
      waitForContent();
    } else {
      revealWhenReady();
    }

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col selection:bg-stone-100">
      <ScrollToTop />
      <Header />
      <main className="flex-grow min-h-[90vh]">
        <Outlet />
      </main>
      <div className="animate-in fade-in duration-1000 delay-700 fill-mode-both">
        <Footer />
      </div>
    </div>
  );
}

export function ErrorBoundary() {
  // Never leave a failed page hidden behind the loading curtain.
  useEffect(() => {
    revealSiteCurtain();
  }, []);

  return <div className="p-10 text-center">Något gick fel. Försök ladda om sidan.</div>;
}
