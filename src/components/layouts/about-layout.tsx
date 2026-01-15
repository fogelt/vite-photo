import { useState } from "react";
import { ImageCard } from '@/components/ui';
import { supabase } from "@/services";
import { useQuery } from "@tanstack/react-query";
import { Mail, Phone } from 'lucide-react'

interface AboutLayoutProps {
  image?: { url: string; alt: string };
  isLoading?: boolean;
}

// Grouped data for the tabs
const CATEGORIES = ["Utbildningar", "Utställningar", "Meriter"];

const CREDENTIALS_DATA = {
  Utbildningar: [
    { text: "Nordens Fotoskola", sub: "Biskops Arnö, 2023-2026" },
    { text: "Grundläggande Fotografi", sub: "Kulturama, 2021" }
  ],
  Utställningar: [
    { text: "Vårutställningen", sub: "ABC Huset, 2023" },
    { text: "Ljus & Skugga", sub: "Galleri Kontrast, 2022" }
  ],
  Meriter: [
    { text: "Frilansande Fotograf", sub: "Egen verksamhet, 2021-Nuvarande" },
    { text: "Fotoassistent", sub: "Studio X, 2020" }
  ]
};

export function AboutLayout({ image, isLoading: isImageLoading }: AboutLayoutProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState(CATEGORIES[0]);

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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-24 items-start">

        <div className="order-2 md:order-1">
          {isLoading ? (
            <div className="aspect-[3/4] w-full bg-stone-50 animate-pulse" />
          ) : (
            <div className={`transition-opacity duration-1000 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}>
              <ImageCard
                url={image?.url || ""}
                alt={image?.alt || content?.name || "Myelie Lendelund"}
                className={`aspect-[3/4] w-full object-cover ${imageLoaded ? 'animate-in fade-in slide-in-from-bottom-8 duration-1000 fill-mode-both delay-300' : ''
                  }`}
                onLoad={() => setImageLoaded(true)}
              />
            </div>
          )}
        </div>

        {/* Text-sida */}
        <div className="order-1 md:order-2 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000 fill-mode-both">

          {/* Header & Bio */}
          <div className="space-y-3 pt-10">
            <div className="space-y-2">
              <h2 className="text-[11px] uppercase tracking-[0.4em] text-stone-400 font-bold">Om mig</h2>
              <span className="font-normal text-xl text-stone-900 block">{content?.name || "Myelie Lendelund"}</span>
            </div>
            <div className="space-y-6 text-stone-600 font-light leading-relaxed text-sm md:text-base">
              <p>{content?.bio_p1}</p>
              <p>{content?.bio_p2}</p>
            </div>
          </div>

          {/* Kontakt */}
          <div className="pt-8 pb-8 border-t border-b border-stone-200 space-y-4">
            <h3 className="text-[11px] uppercase tracking-[0.4em] text-stone-400 font-bold">Kontakt</h3>
            <div className="space-y-2 text-stone-800 tracking-wide text-sm font-light">
              <p className="flex items-center gap-3">
                <Mail size={12} className="text-stone-400" />
                <span className="text-stone-400">E-mail:</span>
                <a href={`mailto:${content?.email}`} className="hover:text-stone-400 transition-colors underline underline-offset-4 decoration-stone-200">
                  {content?.email}
                </a>
              </p>
              <p className="flex items-center gap-3">
                <Phone size={12} className="text-stone-400" />
                <span className="text-stone-400">Telefon:</span>
                <a href={`tel:${content?.phone?.replace(/\s/g, '')}`} className="hover:text-stone-400 transition-colors">
                  {content?.phone}
                </a>
              </p>
            </div>
          </div>

          {/* TAB SECTION */}
          <div className="space-y-2">
            <div className="flex gap-8">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveTab(cat)}
                  className={`pb-3 text-[10px] uppercase tracking-[0.2em] transition-all duration-300 relative ${activeTab === cat ? "text-stone-500" : "text-stone-300 hover:text-stone-400"
                    }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="min-h-[100px]">
              <div
                key={activeTab}
                className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-700 ease-out"
              >
                {CREDENTIALS_DATA[activeTab as keyof typeof CREDENTIALS_DATA].map((item, i) => (
                  <div key={i} className="group">
                    <p className="text-stone-900 text-sm font-medium">{item.text}</p>
                    <p className="text-stone-500 text-xs italic">{item.sub}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}