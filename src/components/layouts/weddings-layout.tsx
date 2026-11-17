import { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from "@/services";
import { ImageContainer, ImageModal } from '@/components/ui';

interface Photo {
  id: string;
  url: string;
  alt?: string;
  photo_variants?: { id: string; url: string; }[];
}

interface WeddingPackage {
  id: string;
  name: string;
  time: string;
  includes: string;
  images: string;
  price: string;
  highlight: boolean;
}

export function WeddingsLayout({ photos, isLoading }: { photos: Photo[], isLoading?: boolean }) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [preview, setPreview] = useState<{ id: string; src: string } | null>(null);

  const openPhoto = (photo: Photo, previewSrc?: string) => {
    const index = photos.findIndex(p => p.id === photo.id);
    setSelectedIndex(index);
    setPreview(previewSrc ? { id: photo.id, src: previewSrc } : null);
  };

  // Fetch dynamic packages from Supabase
  const { data: packages, isLoading: pricingLoading } = useQuery({
    queryKey: ["wedding_packages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wedding_packages")
        .select("*")
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return data as WeddingPackage[];
    }
  });

  const scrollerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Record<string, HTMLElement | null>>({});
  const [activeIndex, setActiveIndex] = useState(0);
  const total = packages?.length ?? 0;

  /** Which card is closest to the centre of the carousel? */
  const syncActiveIndex = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller || !packages?.length) return;

    const scrollerRect = scroller.getBoundingClientRect();
    const centre = scrollerRect.left + scrollerRect.width / 2;

    let best = 0;
    let bestDistance = Infinity;

    packages.forEach((pkg, index) => {
      const card = cardRefs.current[pkg.id];
      if (!card) return;
      const rect = card.getBoundingClientRect();
      const distance = Math.abs(rect.left + rect.width / 2 - centre);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = index;
      }
    });

    setActiveIndex(best);
  }, [packages]);

  // On phones the cards are a horizontal carousel. Open on the highlighted
  // package (Silver) so it is centred and visible without swiping.
  useEffect(() => {
    if (!packages?.length) return;

    const scroller = scrollerRef.current;
    const target =
      packages.find((pkg) => pkg.name.toLowerCase().includes('silver')) ?? packages[0];
    const card = target ? cardRefs.current[target.id] : null;
    if (!scroller || !card) return;

    const center = () => {
      const scrollerRect = scroller.getBoundingClientRect();
      const cardRect = card.getBoundingClientRect();
      const offset =
        cardRect.left + cardRect.width / 2 - (scrollerRect.left + scrollerRect.width / 2);
      scroller.scrollLeft += offset;
      syncActiveIndex();
    };

    // Wait one frame so the cards have their final layout.
    const frame = window.requestAnimationFrame(center);
    return () => window.cancelAnimationFrame(frame);
  }, [packages, syncActiveIndex]);

  // Keep the little node indicator in step with the swipe.
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        syncActiveIndex();
      });
    };

    scroller.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      scroller.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [syncActiveIndex]);

  const firstThree = photos.slice(0, 3);
  const theRest = photos.slice(3);

  return (
    <section className="w-full flex flex-col gap-16 py-8 bg-white">
      {/* Top Gallery Section */}
      <ImageContainer
        photos={firstThree}
        variant="weddings"
        onItemClick={openPhoto}
        isLoading={isLoading}
        skeletonCount={3}
      />

      {/* Pricing Section */}
      <div className="max-w-6xl mx-auto px-6 w-full">
        <div className="text-center mb-8 md:mb-12 animate-in fade-in slide-in-from-bottom-4 duration-1000 fill-mode-both">
          <h2 className="text-[11px] uppercase tracking-[0.4em] text-stone-400 mb-2">
            Bröllopspaket
          </h2>
          <p className="text-stone-500 font-light italic text-sm">En investering för livet</p>
        </div>

        <div className="flex items-center justify-center gap-3 text-stone-400 md:hidden">
          <ChevronLeft size={14} strokeWidth={1.5} className="motion-safe:animate-[swipe-hint-left_1.6s_ease-in-out_infinite]" aria-hidden="true" />
          <span className="text-[10px] uppercase tracking-[0.3em]">Svep för att se alla paket</span>
          <ChevronRight size={14} strokeWidth={1.5} className="motion-safe:animate-[swipe-hint_1.6s_ease-in-out_infinite]" aria-hidden="true" />
        </div>

        {/* Minimal node indicator under the hint */}
        <div className="mt-3 flex justify-center md:hidden" aria-hidden="true">
          <div className="relative h-[2px] w-28 bg-stone-200">
            {packages?.map((pkg, index) => (
              <span
                key={pkg.id}
                className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-stone-300 bg-white"
                style={{ left: total > 1 ? `${(index / (total - 1)) * 100}%` : '50%' }}
              />
            ))}

            {/* Filled dot that glides to the active node */}
            <span
              className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-stone-900 transition-[left] duration-300 ease-out"
              style={{ left: total > 1 ? `${(activeIndex / (total - 1)) * 100}%` : '50%' }}
            />
          </div>
        </div>

        <div
          ref={scrollerRef}
          className="-mx-6 mt-4 flex snap-x snap-mandatory scroll-px-[7.5%] items-stretch gap-4 overflow-x-auto px-[7.5%] pb-4 md:mx-0 md:mt-0 md:grid md:grid-cols-3 md:gap-8 md:overflow-visible md:px-0 md:pb-0"
        >
          {pricingLoading ? (
            // Skeleton loader while fetching packages
            [...Array(3)].map((_, i) => (
              <div key={i} className="h-[400px] w-[85%] shrink-0 snap-center bg-stone-50 animate-pulse border border-stone-100 md:w-auto" />
            ))
          ) : (
            packages?.map((pkg, index) => (
              <div
                key={pkg.id}
                ref={(node) => {
                  cardRefs.current[pkg.id] = node;
                }}
                style={{ animationDelay: `${(index + 1) * 200}ms` }}
                className={`
                  flex w-[85%] shrink-0 snap-center flex-col p-8 border border-stone-200 transition-all duration-700 md:w-auto
                  animate-in fade-in slide-in-from-bottom-6 fill-mode-both
                  ${pkg.highlight
                    ? 'bg-stone-50/50 shadow-sm ring-1 ring-stone-200 md:scale-105 z-10'
                    : 'bg-white hover:shadow-md'
                  }
                `}
              >
                <h3 className="font-light tracking-[0.2em] uppercase text-base mb-4 text-stone-800">
                  {pkg.name}
                </h3>

                <div className="flex-grow flex flex-col gap-4">
                  <div className="space-y-1">
                    <p className="text-[11px] uppercase tracking-wider text-stone-400 font-semibold">Tid</p>
                    <p className="text-xs text-stone-600 leading-relaxed">{pkg.time}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[11px] uppercase tracking-wider text-stone-400 font-semibold">Ingår</p>
                    <p className="text-xs text-stone-600 leading-relaxed whitespace-pre-line">{pkg.includes}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[11px] uppercase tracking-wider text-stone-400 font-semibold">Leverans</p>
                    <p className="text-xs text-stone-600 leading-relaxed">{pkg.images}</p>
                  </div>
                </div>

                <div className="mt-10 pt-6 border-t border-stone-300">
                  <p className="text-lg font-light tracking-tight text-stone-900">
                    {pkg.price}
                  </p>
                  <p className="text-[10px] text-stone-400 uppercase tracking-tighter">
                    inkl. moms
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-10 flex flex-col items-center gap-3 text-center md:mt-12">
          <a
            href="https://myeliebrollopsfoto.se"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex w-full items-center justify-center gap-3 border border-stone-300 px-8 py-3.5 text-[10px] uppercase tracking-[0.3em] text-stone-800 transition-colors duration-300 hover:border-stone-500 hover:bg-stone-50 md:w-auto md:px-10"
          >
            Se fler bröllopsbilder
            <ArrowUpRight
              size={14}
              strokeWidth={1.5}
              className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </a>
          <p className="text-[10px] uppercase tracking-[0.2em] text-stone-400">
            på myeliebrollopsfoto.se
          </p>
        </div>
      </div>

      {/* Bottom Gallery Section */}
      <ImageContainer
        photos={theRest}
        variant="weddings"
        onItemClick={openPhoto}
        isLoading={isLoading}
      />

      <ImageModal
        isOpen={selectedIndex !== null}
        onClose={() => setSelectedIndex(null)}
        photos={photos}
        currentIndex={selectedIndex || 0}
        setCurrentIndex={setSelectedIndex}
        preview={preview}
      />
    </section>
  );
}