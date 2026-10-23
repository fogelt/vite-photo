import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ChevronDown, Mail, Phone } from "lucide-react";
import { fetchPhotosByTag, supabase } from "@/services";

const CONTACT_EMAIL = "myelie@live.se";
const CONTACT_PHONE = "+46 72 16 82 019";

const WELCOME_FALLBACK_TITLE = "Välkomna hit";
const WELCOME_FALLBACK_TEXT =
  "Vad roligt att ni hittat hit! Jag heter Myelie och fotograferar bröllop med fokus på äkta känslor och de små ögonblicken som annars bara passerar. Bläddra runt bland bilderna nedan, lär känna mig lite bättre och kika på mina bröllopspaket — hör sedan gärna av er så berättar jag mer.";

const ENGAGEMENT_FALLBACK_TITLE = "Innan den stora dagen";
const ENGAGEMENT_FALLBACK_TEXT =
  "Innan den stora dagen kommer ögonblicket då allt börjar — förlovningen. En förlovningsfotografering är ett avslappnat sätt att lära känna varandra framför kameran, och ni får vackra bilder att spara och dela medan ni längtar efter bröllopet.";

interface PreviewPhoto {
  id: string;
  url: string;
  alt?: string;
}

/**
 * A scaled, non-interactive mirror of the live wedding site (vite-wed-site).
 * Keep the section order and markup in sync with that project's
 * `WeddingsLayout` when the wedding site changes.
 */
export function WeddingSitePreview({ items }: { items: any[] }) {
  const photo = (item: any): PreviewPhoto | undefined =>
    item ? { id: item.id, url: item.url, alt: item.alt } : undefined;

  const heroPhotos = items.slice(0, 3).map(photo).filter(Boolean) as PreviewPhoto[];
  const introPhotos = items.slice(3, 11);
  const galleryPhotos = items.slice(11);

  const { data: engagementPhotos = [] } = useQuery({
    queryKey: ["photos", "engagement"],
    queryFn: () => fetchPhotosByTag("engagement"),
  });

  const { data: packages } = useQuery({
    queryKey: ["wedding_packages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wedding_packages")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as any[];
    },
  });

  const { data: welcome } = useQuery({
    queryKey: ["welcome_content"],
    queryFn: async () => {
      const { data, error } = await supabase.from("welcome_content").select("*").maybeSingle();
      if (error) return null;
      return data;
    },
  });

  const { data: engagement } = useQuery({
    queryKey: ["engagement_content"],
    queryFn: async () => {
      const { data, error } = await supabase.from("engagement_content").select("*").maybeSingle();
      if (error) return null;
      return data;
    },
  });

  const { data: about } = useQuery({
    queryKey: ["about_content"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("about_content")
        .select("email, phone")
        .maybeSingle();
      if (error) return null;
      return data;
    },
  });

  const email = about?.email || CONTACT_EMAIL;
  const phone = about?.phone || CONTACT_PHONE;
  const engagementImage = photo(engagementPhotos[0]);

  return (
    <div className="w-full bg-white">
      <WeddingHero photos={heroPhotos} />

      {/* Välkommen: welcome text + the first eight photos */}
      <div className="py-12 md:py-16">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="text-[11px] uppercase tracking-[0.4em] text-stone-400">
              Välkommen
            </span>
            <h2 className="text-balance text-xl font-light leading-tight text-stone-900 md:text-2xl">
              {welcome?.title || WELCOME_FALLBACK_TITLE}
            </h2>
          </div>

          <p className="mx-auto mt-6 max-w-2xl whitespace-pre-line text-[15px] font-light leading-relaxed text-stone-600 md:text-base">
            {welcome?.text || WELCOME_FALLBACK_TEXT}
          </p>

          <div className="mt-10 flex justify-center">
            <div
              className="flex w-full max-w-[9rem] items-center justify-center gap-4"
              aria-hidden="true"
            >
              <span className="h-px flex-1 bg-stone-300/80" />
              <span className="h-1.5 w-1.5 rotate-45 border border-stone-300" />
              <span className="h-px flex-1 bg-stone-300/80" />
            </div>
          </div>
        </div>
      </div>

      <WeddingMosaic photos={introPhotos} />

      {/* Bröllopspaket */}
      <div className="py-12 md:py-16">
        <div className="mx-auto w-full max-w-6xl px-6">
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="text-[11px] uppercase tracking-[0.4em] text-stone-400">
              Bröllopspaket
            </span>
            <h2 className="text-balance text-xl font-light leading-tight text-stone-900 md:text-2xl">
              En investering för livet
            </h2>
          </div>

          <div className="mt-10 grid grid-cols-1 items-stretch gap-6 md:mt-14 md:grid-cols-3 md:gap-8">
            {packages?.map((pkg: any) => (
              <article
                key={pkg.id}
                className={`relative flex h-full flex-col border border-stone-200 p-8 transition-all duration-700 ${
                  pkg.highlight
                    ? "z-10 scale-[1.02] bg-stone-50/50 shadow-sm ring-1 ring-stone-200 md:scale-105"
                    : "bg-white shadow-sm hover:shadow-md"
                }`}
              >
                {pkg.highlight && (
                  <span className="absolute right-8 top-8 text-[10px] font-semibold uppercase tracking-[0.3em] text-stone-400 md:right-10 md:top-10">
                    Populärast
                  </span>
                )}

                <h3 className="text-base font-light uppercase tracking-[0.2em] text-stone-800">
                  {pkg.name}
                </h3>

                <div className="mt-8 flex-1 space-y-6 text-xs leading-relaxed text-stone-600">
                  <PackageDetail label="Tid" value={pkg.time} />
                  <PackageDetail label="Ingår" value={pkg.includes} />
                  <PackageDetail label="Leverans" value={pkg.images} />
                </div>

                <div className="mt-10 border-t border-stone-300 pt-6">
                  <p className="text-lg font-light tracking-tight text-stone-900">{pkg.price}</p>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-stone-400">
                    inkl. moms
                  </p>

                  <span className="mt-7 inline-flex w-full items-center justify-center border border-stone-300 py-3.5 text-[10px] uppercase tracking-[0.3em] text-stone-800">
                    Boka paketet
                  </span>
                </div>
              </article>
            ))}

            {/* Helt skräddarsytt */}
            <div className="flex h-full flex-col items-center justify-center border border-stone-200 bg-white p-8 text-center shadow-sm md:col-span-3 md:p-12">
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-stone-400">
                Helt skräddarsytt
              </p>
              <p className="mt-4 max-w-2xl text-[15px] font-light leading-relaxed text-stone-600 md:text-base">
                Drömmer ni om något utöver paketen — fler timmar, flera dagar eller ett upplägg
                helt i er stil? Berätta vad ni ser framför er, så bygger vi paketet tillsammans
                från grunden.
              </p>
              <span className="mt-7 inline-flex items-center justify-center border border-stone-300 px-10 py-3.5 text-[10px] uppercase tracking-[0.3em] text-stone-800">
                Berätta om era planer
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Förlovning */}
      <div className="py-12 md:py-16">
        <div className="mx-auto w-full max-w-6xl px-6">
          <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-2 md:gap-16">
            <div className="order-1">
              <div className="flex flex-col items-start gap-3 text-left">
                <span className="text-[11px] uppercase tracking-[0.4em] text-stone-400">
                  Förlovningsfotografering
                </span>
                <h2 className="text-balance text-xl font-light leading-tight text-stone-900 md:text-2xl">
                  {engagement?.title || ENGAGEMENT_FALLBACK_TITLE}
                </h2>
              </div>

              <p className="mt-5 whitespace-pre-line text-[15px] font-light leading-relaxed text-stone-600 md:text-base">
                {engagement?.text || ENGAGEMENT_FALLBACK_TEXT}
              </p>

              <span className="group mt-7 inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.3em] text-stone-900">
                <span className="border-b border-stone-300 pb-1">Berätta om era planer</span>
                <ArrowRight size={14} strokeWidth={1.5} />
              </span>
            </div>

            {engagementImage?.url && (
              <div className="order-2">
                <div className="relative">
                  <div
                    className="absolute -bottom-4 -right-4 hidden h-full w-full border border-stone-300/70 md:block"
                    aria-hidden="true"
                  />
                  <div className="relative overflow-hidden bg-stone-50">
                    <img
                      src={engagementImage.url}
                      alt={engagementImage.alt || "Förlovningsfotografering"}
                      loading="lazy"
                      decoding="async"
                      className="h-auto w-full"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Galleriet fortsätter efter förlovningen */}
      {galleryPhotos.length > 0 && <WeddingMosaic photos={galleryPhotos} />}

      {/* Kontakt */}
      <div className="border-t border-stone-200 bg-white">
        <div className="mx-auto max-w-3xl px-6 py-14 text-center md:py-20">
          <p className="text-[11px] uppercase tracking-[0.4em] text-stone-400">Förfrågan</p>

          <h2 className="mt-4 text-2xl font-light leading-tight text-stone-900 md:text-3xl">
            Låt oss berätta <span className="italic">er historia</span>
          </h2>

          <p className="mx-auto mt-4 max-w-lg text-sm font-light leading-relaxed text-stone-600 md:text-base">
            Berätta om era planer så tar vi det därifrån — datum, plats och era tankar. Jag svarar
            alltid personligt, oftast inom ett par dagar.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <span className="inline-flex w-full items-center justify-center gap-3 border border-black px-10 py-3.5 text-[11px] uppercase tracking-[0.28em] text-stone-900 sm:w-auto">
              <Mail size={14} strokeWidth={1.5} aria-hidden="true" />
              Skicka e-post
            </span>
            <span className="inline-flex w-full items-center justify-center gap-3 border border-stone-300 px-10 py-3.5 text-[11px] uppercase tracking-[0.28em] text-stone-500 sm:w-auto">
              <Phone size={14} strokeWidth={1.5} aria-hidden="true" />
              {phone}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function WeddingHero({ photos }: { photos: PreviewPhoto[] }) {
  const left = photos.length >= 2 ? photos[0] : undefined;
  const center = photos.length >= 2 ? photos[1] : photos[0];
  const right = photos.length >= 3 ? photos[2] : undefined;

  return (
    <div className="relative flex h-[78vh] max-h-[820px] min-h-[520px] w-full items-center justify-center overflow-hidden bg-white">
      {center?.url ? (
        <div className="absolute inset-0" aria-hidden="true">
          <div className="flex h-full w-full gap-2">
            <HeroStrip photo={left} className="hidden h-full w-[22%] md:block" />
            <HeroStrip photo={center} darkened className="h-full min-w-0 flex-1" />
            <HeroStrip photo={right} className="hidden h-full w-[22%] md:block" />
          </div>
        </div>
      ) : (
        <div className="absolute inset-0 bg-stone-900" aria-hidden="true" />
      )}

      <div className="relative z-10 flex flex-col items-center px-6 text-center">
        <span className="mb-7 text-[11px] uppercase tracking-[0.5em] text-white/80 [text-shadow:0_1px_2px_rgba(0,0,0,0.65),0_2px_18px_rgba(0,0,0,0.6)]">
          Bröllopsfotograf · Skåne
        </span>

        <h1 className="text-3xl font-light uppercase leading-tight tracking-[0.2em] text-white [text-shadow:0_2px_4px_rgba(0,0,0,0.55),0_4px_32px_rgba(0,0,0,0.65)] sm:text-4xl sm:tracking-[0.25em] md:text-5xl">
          Myelie Lendelund
        </h1>

        <span className="my-7 h-px w-16 bg-white/40" aria-hidden="true" />

        <p className="mb-11 max-w-xl text-sm font-light italic leading-relaxed text-white/90 [text-shadow:0_1px_2px_rgba(0,0,0,0.65),0_2px_20px_rgba(0,0,0,0.6)] md:text-base">
          Äkta ögonblick, varsamt bevarade
        </p>

        <span className="w-full bg-white px-10 py-4 text-[11px] uppercase tracking-[0.28em] text-stone-900 sm:w-auto">
          Se galleriet
        </span>
      </div>

      <span
        className="absolute bottom-5 left-1/2 z-10 -translate-x-1/2 text-white/65 drop-shadow-[0_1px_4px_rgba(0,0,0,0.55)]"
        aria-hidden="true"
      >
        <ChevronDown size={22} strokeWidth={1.25} />
      </span>
    </div>
  );
}

function HeroStrip({
  photo,
  darkened = false,
  className = "",
}: {
  photo?: PreviewPhoto;
  darkened?: boolean;
  className?: string;
}) {
  const [loaded, setLoaded] = useState(false);

  if (!photo?.url) return null;

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <img
        key={photo.url}
        src={photo.url}
        alt={photo.alt || "Bröllopsfotograf Myelie Lendelund"}
        onLoad={() => setLoaded(true)}
        className={`h-full w-full object-cover object-[center_35%] transition-[opacity,transform] duration-1000 ease-out ${
          loaded ? "scale-100 opacity-100" : "scale-[1.06] opacity-0"
        }`}
      />
      {darkened && (
        <div
          className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/15 to-black/30"
          aria-hidden="true"
        />
      )}
    </div>
  );
}

/** The wedding site's editorial mosaic rhythm (||-|, |-|| and --|). */
function WeddingMosaic({ photos }: { photos: any[] }) {
  const [loaded, setLoaded] = useState<Record<string, boolean>>({});

  const sizingClass = (index: number) => {
    switch (index % 11) {
      case 2:
      case 5:
        return "h-[60vh] w-full md:h-auto md:aspect-[3/2] md:w-[calc(43%_-_11px)]";
      case 8:
      case 9:
        return "h-[60vh] w-full md:h-auto md:aspect-[3/2] md:w-[calc(41%_-_7px)]";
      case 10:
        return "h-[60vh] w-full md:h-auto md:aspect-[2/3] md:w-[calc(18%_-_3.5px)]";
      default:
        return "h-[60vh] w-full md:h-auto md:aspect-[2/3] md:w-[calc(19%_-_5px)]";
    }
  };

  return (
    <div className="mx-auto flex w-[93%] max-w-[2000px] flex-wrap justify-center gap-2 p-2">
      {photos.map((photo, index) => (
        <div
          key={photo.id}
          className={`${sizingClass(index)} overflow-hidden bg-stone-50 transition-opacity duration-1000 ${
            loaded[photo.id] ? "opacity-100" : "opacity-0"
          }`}
        >
          <img
            src={photo.url}
            alt={photo.alt || "Bröllopsfotografi i Skåne"}
            loading="lazy"
            decoding="async"
            onLoad={() => setLoaded((prev) => ({ ...prev, [photo.id]: true }))}
            className="h-full w-full object-cover object-[center_70%]"
          />
        </div>
      ))}
    </div>
  );
}

function PackageDetail({ label, value }: { label: string; value?: string }) {
  if (!value) return null;

  return (
    <div className="space-y-1.5">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">{label}</p>
      <p className="whitespace-pre-line leading-relaxed">{value}</p>
    </div>
  );
}
