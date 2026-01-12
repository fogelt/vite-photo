import { useState } from "react";
import { ImageCard } from '@/components/ui';

interface AboutLayoutProps {
  image?: { url: string; alt: string };
  isLoading?: boolean;
}

export function AboutLayout({ image, isLoading }: AboutLayoutProps) {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <section className="max-w-6xl mx-auto px-6 py-16 md:py-24">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-24 items-center">

        {/* Bild-sida */}
        <div className="order-2 md:order-1">
          {isLoading ? (
            <div className="aspect-[3/4] w-full bg-stone-50 animate-pulse" />
          ) : (
            <div className={`transition-opacity duration-1000 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}>
              <ImageCard
                url={image?.url || ""}
                alt={image?.alt || "Myelie Lendelund"}
                className={`aspect-[3/4] w-full ${imageLoaded ? 'animate-in fade-in slide-in-from-bottom-8 duration-1000 fill-mode-both' : ''}`}
                onLoad={() => setImageLoaded(true)}
              />
            </div>
          )}
        </div>

        {/* Text-sida */}
        <div className={`order-1 md:order-2 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000 fill-mode-both delay-300`}>
          <div className="space-y-4">
            <h2 className="text-[11px] uppercase tracking-[0.4em] text-stone-400">
              Om mig
            </h2>
            <span className="font-normal">Myelie Lendelund</span>
          </div>

          <div className="space-y-6 text-stone-600 font-light leading-relaxed text-sm md:text-base">
            <p>
              Jag är 25 år gammal, född och uppväxt i Skåne. För mig är fotografi mer
              än bara en bild, det är ett sätt att bevara de där flyktiga ögonblicken
              som annars bara passerar.
            </p>
            <p>
              Jag drivs av att fånga de äkta känslorna och de små detaljerna som
              uppstår när vi möts. Genom min kamera fokuserar jag främst på människor;
              jag älskar att hitta det unika i varje person och berätta deras historia
              genom ljus och skugga.
            </p>
          </div>

          <div className="pt-8 border-t border-stone-200 space-y-4">
            <h3 className="text-[11px] uppercase tracking-[0.4em] text-stone-400 font-bold">
              Kontakt
            </h3>
            <div className="space-y-2 text-stone-800 tracking-wide text-sm">
              <p className="flex items-center gap-3">
                <span className="text-stone-300">Mejl:</span>
                <a href="mailto:myelie@live.se" className="hover:text-stone-400 transition-colors underline underline-offset-4 decoration-stone-200">
                  myelie@live.se
                </a>
              </p>
              <p className="flex items-center gap-3">
                <span className="text-stone-300">Telefon:</span>
                <a href="tel:0721682019" className="hover:text-stone-400 transition-colors">
                  072 16 82 019
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}