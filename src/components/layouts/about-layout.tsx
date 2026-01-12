import { useState } from "react";
import { ImageCard } from '@/components/ui';
import { supabase } from "@/services";
import { useQuery } from "@tanstack/react-query";

interface AboutLayoutProps {
  image?: { url: string; alt: string };
  isLoading?: boolean;
}

export function AboutLayout({ image, isLoading: isImageLoading }: AboutLayoutProps) {
  const [imageLoaded, setImageLoaded] = useState(false);

  // Fetch only the text content from the database
  const { data: content, isLoading: isTextLoading } = useQuery({
    queryKey: ["about_content"],
    queryFn: async () => {
      const { data } = await supabase.from("about_content").select("*").single();
      return data;
    }
  });

  const isLoading = isImageLoading || isTextLoading;

  return (
    <section className="max-w-6xl mx-auto px-6 py-16 md:py-24">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-24 items-center">

        {/* Bild-sida (Using the passed-in gallery image) */}
        <div className="order-2 md:order-1">
          {isLoading ? (
            <div className="aspect-[3/4] w-full bg-stone-50 animate-pulse" />
          ) : (
            <div className={`transition-opacity duration-1000 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}>
              <ImageCard
                url={image?.url || ""}
                alt={image?.alt || content?.name || "Myelie Lendelund"}
                className={`aspect-[3/4] w-full object-cover ${imageLoaded ? 'animate-in fade-in slide-in-from-bottom-8 duration-1000 fill-mode-both' : ''}`}
                onLoad={() => setImageLoaded(true)}
              />
            </div>
          )}
        </div>

        <div className={`order-1 md:order-2 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000 fill-mode-both delay-300`}>
          <div className="space-y-4">
            <h2 className="text-[11px] uppercase tracking-[0.4em] text-stone-400">
              Om mig
            </h2>
            <span className="font-normal text-xl text-stone-900">
              {content?.name || "Myelie Lendelund"}
            </span>
          </div>

          <div className="space-y-6 text-stone-600 font-light leading-relaxed text-sm md:text-base">
            <p>{content?.bio_p1}</p>
            <p>{content?.bio_p2}</p>
          </div>

          <div className="pt-8 border-t border-stone-200 space-y-4">
            <h3 className="text-[11px] uppercase tracking-[0.4em] text-stone-400 font-bold">
              Kontakt
            </h3>
            <div className="space-y-2 text-stone-800 tracking-wide text-sm">
              <p className="flex items-center gap-3">
                <span className="text-stone-300">Mejl:</span>
                <a href={`mailto:${content?.email}`} className="hover:text-stone-400 transition-colors underline underline-offset-4 decoration-stone-200">
                  {content?.email}
                </a>
              </p>
              <p className="flex items-center gap-3">
                <span className="text-stone-300">Telefon:</span>
                <a href={`tel:${content?.phone?.replace(/\s/g, '')}`} className="hover:text-stone-400 transition-colors">
                  {content?.phone}
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}