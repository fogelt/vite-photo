import { useState } from "react";
import { ImageCard } from '@/components/ui';
import { supabase } from "@/services";
import { useQuery } from "@tanstack/react-query";
import { Globe, Mail, Phone } from 'lucide-react'

interface AboutSectionProps {
  image?: { url: string; alt: string };
  isLoading?: boolean;
}

const CATEGORIES = ["Utbildningar", "Utställningar", "Meriter"];

export function AboutSection({ image, isLoading: isImageLoading }: AboutSectionProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState(CATEGORIES[0]);

  const { data: content, isLoading: isTextLoading } = useQuery({
    queryKey: ["about_content"],
    queryFn: async () => {
      const { data, error } = await supabase.from("about_content").select("*").maybeSingle();
      if (error) return null;
      return data;
    }
  });

  const { data: credentials, isLoading: isCredsLoading } = useQuery({
    queryKey: ["about_credentials"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("about_credentials")
        .select("*")
        .order('sort_order', { ascending: true });
      if (error) return [];
      return data || [];
    }
  });

  // Consolidated loading state for the data
  const isDataFetching = isTextLoading || isCredsLoading;
  const activeItems = credentials?.filter(item => item.category === activeTab) || [];
  const portraitAlt = image?.alt || content?.name || "Myelie Lendelund";

  return (
    <section id="om-mig" className="max-w-6xl mx-auto px-6 py-16 md:py-24 scroll-mt-28 md:scroll-mt-20">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-24 items-start">

        {/* Image Column (desktop only) */}
        <div className="order-2 md:order-1 hidden md:block">
          {isImageLoading ? (
            <div className="aspect-[3/4] w-full bg-stone-50 animate-pulse" />
          ) : image?.url ? (
            <div className={`transition-opacity duration-1000 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}>
              <ImageCard
                url={image.url}
                alt={portraitAlt}
                className={`aspect-[3/4] w-full object-cover ${imageLoaded ? 'animate-in fade-in slide-in-from-bottom-8 duration-1000 fill-mode-both delay-300' : ''
                  }`}
                onLoad={() => setImageLoaded(true)}
              />
            </div>
          ) : null}
        </div>

        {/* Text Column */}
        <div className={`order-1 md:order-2 space-y-8 ${isDataFetching
          ? "opacity-0"
          : "animate-in fade-in slide-in-from-bottom-4 duration-1000 fill-mode-both"
          }`}>

          {/* Header & Bio */}
          <div className="space-y-3 pt-10">
            <div className="flex items-center gap-5">
              {isImageLoading ? (
                <div className="md:hidden w-20 h-24 rounded-sm bg-stone-100 animate-pulse shrink-0" />
              ) : image?.url ? (
                <img
                  src={image.url}
                  alt={portraitAlt}
                  onLoad={() => setImageLoaded(true)}
                  className={`md:hidden w-20 h-24 object-cover rounded-sm ring-1 ring-stone-200 shrink-0 transition-opacity duration-1000 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                />
              ) : null}
              <div className="space-y-2">
                <h2 className="text-[11px] uppercase tracking-[0.4em] text-stone-400 font-bold">Om mig</h2>
                <span className="font-normal text-xl text-stone-900 block">
                  {content?.name || "Myelie Lendelund"}
                </span>
              </div>
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
                <Globe size={12} className="text-stone-400" />
                <span className="text-stone-400">Hemsida:</span>
                <a href={window.location.origin} className="hover:text-stone-400 transition-colors underline underline-offset-4 decoration-stone-200">
                  {window.location.hostname}
                </a>
              </p>
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

            <div className="min-h-[100px]">
              <div
                key={activeTab}
                className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-700 ease-out"
              >
                {activeItems.length > 0 ? (
                  activeItems.map((item) => (
                    <div key={item.id} className="group">
                      <p className="text-stone-600 text-sm font-medium italic tracking-[0.1em]">{item.title}</p>
                      <p className="text-stone-500 text-xs italic">{item.subtitle}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-stone-400 text-xs italic py-2">Ingen information tillgänglig än.</p>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
