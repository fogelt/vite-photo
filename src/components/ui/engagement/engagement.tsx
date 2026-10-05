import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ImageCard } from '@/components/ui';
import { supabase } from "@/services";

interface EngagementSectionProps {
  image?: { url: string; alt: string };
  isLoading?: boolean;
}

const FALLBACK_TITLE = "Förlovning";
const FALLBACK_TEXT =
  "Innan den stora dagen kommer ögonblicket då allt börjar — förlovningen. En förlovningsfotografering är ett avslappnat sätt att lära känna varandra framför kameran, och ni får vackra bilder att spara och dela medan ni längtar efter bröllopet.";

export function EngagementSection({ image, isLoading: isImageLoading }: EngagementSectionProps) {
  const [imageLoaded, setImageLoaded] = useState(false);

  const { data: content, isLoading: isTextLoading } = useQuery({
    queryKey: ["engagement_content"],
    queryFn: async () => {
      const { data, error } = await supabase.from("engagement_content").select("*").maybeSingle();
      if (error) return null;
      return data;
    },
  });

  if (isTextLoading) return null;

  return (
    <section className="max-w-6xl mx-auto px-6 py-16 md:py-24">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-24 items-start">

        {/* Text Column (left) */}
        <div className="order-1 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000 fill-mode-both">
          <div className="space-y-3 pt-10">
            <div className="space-y-2">
              <h2 className="text-[11px] uppercase tracking-[0.4em] text-stone-400 font-bold">Förlovning</h2>
              <span className="font-normal text-xl text-stone-900 block">
                {content?.title || FALLBACK_TITLE}
              </span>
            </div>
            <div className="text-stone-600 font-light leading-relaxed text-sm md:text-base whitespace-pre-line">
              {content?.text || FALLBACK_TEXT}
            </div>
          </div>
        </div>

        {/* Image Column (right) */}
        <div className="order-2">
          {isImageLoading ? (
            <div className="aspect-[3/4] w-full bg-stone-50 animate-pulse" />
          ) : image?.url ? (
            <div className={`transition-opacity duration-1000 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}>
              <ImageCard
                url={image.url}
                alt={image.alt || "Förlovningsfotografering"}
                className={`aspect-[3/4] w-full object-cover ${imageLoaded ? 'animate-in fade-in slide-in-from-bottom-8 duration-1000 fill-mode-both delay-300' : ''
                  }`}
                onLoad={() => setImageLoaded(true)}
              />
            </div>
          ) : null}
        </div>

      </div>
    </section>
  );
}
