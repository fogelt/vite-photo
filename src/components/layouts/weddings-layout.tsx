import { useState } from 'react';
import { useQuery } from "@tanstack/react-query";
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

  const firstThree = photos.slice(0, 3);
  const theRest = photos.slice(3);

  return (
    <section className="w-full flex flex-col gap-16 py-8 bg-white">
      {/* Top Gallery Section */}
      <ImageContainer
        photos={firstThree}
        variant="weddings"
        onItemClick={(photo) => {
          const index = photos.findIndex(p => p.id === photo.id);
          setSelectedIndex(index);
        }}
        isLoading={isLoading}
      />

      {/* Pricing Section */}
      <div className="max-w-6xl mx-auto px-6 w-full">
        <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom-4 duration-1000 fill-mode-both">
          <h2 className="text-[11px] uppercase tracking-[0.4em] text-stone-400 mb-2">
            Bröllopspaket
          </h2>
          <p className="text-stone-500 font-light italic text-sm">En investering för livet</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {pricingLoading ? (
            // Skeleton loader while fetching packages
            [...Array(3)].map((_, i) => (
              <div key={i} className="h-[400px] bg-stone-50 animate-pulse border border-stone-100" />
            ))
          ) : (
            packages?.map((pkg, index) => (
              <div
                key={pkg.id}
                style={{ animationDelay: `${(index + 1) * 200}ms` }}
                className={`
                  flex flex-col p-8 border border-stone-200 transition-all duration-700
                  animate-in fade-in slide-in-from-bottom-6 fill-mode-both
                  ${pkg.highlight
                    ? 'bg-stone-50/50 shadow-sm ring-1 ring-stone-200 scale-[1.02] md:scale-105 z-10'
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
      </div>

      {/* Bottom Gallery Section */}
      <ImageContainer
        photos={theRest}
        variant="weddings"
        onItemClick={(photo) => {
          const index = photos.findIndex(p => p.id === photo.id);
          setSelectedIndex(index);
        }}
        isLoading={isLoading}
      />

      <ImageModal
        isOpen={selectedIndex !== null}
        onClose={() => setSelectedIndex(null)}
        photos={photos}
        currentIndex={selectedIndex || 0}
        setCurrentIndex={setSelectedIndex}
      />
    </section>
  );
}