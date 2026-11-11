import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Check, ChevronDown, ChevronLeft, ChevronRight, Mail, Phone } from "lucide-react";
import { fetchPhotosByTag, supabase } from "@/services";
import { ImageContainer } from "@/components/ui";
import {
  DEFAULT_PROCESS_STEPS,
  getProcessIcon,
  normalizeProcessSteps,
  type ProcessStep,
} from "../process-icons";

const CONTACT_EMAIL = "myelie@live.se";
const CONTACT_PHONE = "+46 72 16 82 019";

const WELCOME_FALLBACK_TITLE = "Välkomna hit";
const WELCOME_FALLBACK_TEXT =
  "Vad roligt att ni hittat hit! Jag heter Myelie och fotograferar bröllop med fokus på äkta känslor och de små ögonblicken som annars bara passerar. Bläddra runt bland bilderna nedan, lär känna mig lite bättre och kika på mina bröllopspaket — hör sedan gärna av er så berättar jag mer.";

const PROCESS_FALLBACK_EYEBROW = "Så funkar det";

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

  const processSteps = normalizeProcessSteps(welcome?.process_steps);
  const processEyebrow =
    typeof welcome?.process_eyebrow === "string" && welcome.process_eyebrow.trim()
      ? welcome.process_eyebrow
      : PROCESS_FALLBACK_EYEBROW;

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

      {/* Välkommen: welcome text + the process panel */}
      <div className="py-12 md:py-16">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
            <span className="text-[11px] uppercase tracking-[0.45em] text-stone-400">
              Välkommen
            </span>
            <h2 className="mt-4 text-balance text-xl font-light leading-tight text-stone-900 md:text-3xl">
              {welcome?.title || WELCOME_FALLBACK_TITLE}
            </h2>
            <div className="mt-6 h-px w-16 bg-stone-300" aria-hidden="true" />
          </div>

          <div className="mt-10 border-y border-stone-200 py-8 md:mt-12 md:py-10">
            <div className="flex flex-col gap-8 md:flex-row md:gap-12">
              <p className="flex-1 whitespace-pre-line text-[15px] font-light leading-relaxed text-stone-900 first-letter:float-left first-letter:mr-3 first-letter:mt-1 first-letter:text-5xl first-letter:font-normal first-letter:leading-[0.78] md:text-base">
                {welcome?.text || WELCOME_FALLBACK_TEXT}
              </p>

              <div
                className="hidden w-px self-stretch bg-stone-200 md:block"
                aria-hidden="true"
              />

              <div className="md:w-[42%] md:flex-none">
                <ProcessPreview
                  eyebrow={processEyebrow}
                  steps={processSteps.length > 0 ? processSteps : DEFAULT_PROCESS_STEPS}
                />
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-center">
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

      <ImageContainer photos={introPhotos} variant="editorial" skeletonCount={8} />

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

          <div className="mt-8 flex items-center justify-center gap-3 text-stone-400 md:hidden">
            <ChevronLeft size={14} strokeWidth={1.5} className="motion-safe:animate-[swipe-hint-left_1.6s_ease-in-out_infinite]" aria-hidden="true" />
            <span className="text-[10px] uppercase tracking-[0.3em]">Svep för att se alla paket</span>
            <ChevronRight size={14} strokeWidth={1.5} className="motion-safe:animate-[swipe-hint_1.6s_ease-in-out_infinite]" aria-hidden="true" />
          </div>

          <div className="-mx-6 mt-4 flex snap-x snap-mandatory scroll-px-[7.5%] items-stretch gap-4 overflow-x-auto px-[7.5%] pb-4 md:mx-0 md:mt-14 md:grid md:grid-cols-3 md:gap-8 md:overflow-visible md:px-0 md:pb-0">
            {packages?.map((pkg: any) => (
              <article
                key={pkg.id}
                className={`relative flex w-[85%] shrink-0 snap-center flex-col border border-stone-200 p-8 transition-all duration-700 md:w-auto ${
                  pkg.highlight
                    ? "z-10 bg-stone-50/50 shadow-sm ring-1 ring-stone-200 md:scale-105"
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
          </div>

          {/* Helt skräddarsytt */}
          <div className="mt-6 flex h-full flex-col items-center justify-center border border-stone-200 bg-white p-8 text-center shadow-sm md:mt-8 md:p-12">
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
      {galleryPhotos.length > 0 && <ImageContainer photos={galleryPhotos} variant="editorial" />}

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
            <HeroStrip photo={center} className="h-full min-w-0 flex-1" />
            <HeroStrip photo={right} className="hidden h-full w-[22%] md:block" />
          </div>
        </div>
      ) : (
        <div className="absolute inset-0 flex gap-2" aria-hidden="true">
          <div className="hidden h-full w-[22%] animate-pulse bg-neutral-100 md:block" />
          <div className="h-full min-w-0 flex-1 animate-pulse bg-neutral-100" />
          <div className="hidden h-full w-[22%] animate-pulse bg-neutral-100 md:block" />
        </div>
      )}

      <div className="absolute inset-0 z-10 flex flex-col items-center justify-between px-6 pt-8 pb-12 text-center md:pt-12 md:pb-16">
        <div className="flex flex-col items-center">
          <h1 className="mb-4 text-3xl font-light uppercase leading-tight tracking-[0.2em] text-white [text-shadow:0_2px_4px_rgba(0,0,0,0.55),0_4px_32px_rgba(0,0,0,0.65)] sm:text-4xl sm:tracking-[0.25em] md:mb-5 md:text-5xl">
            Myelie Lendelund
          </h1>

          <span className="mb-4 h-px w-16 bg-white/40 md:mb-5" aria-hidden="true" />

          <span className="text-[11px] uppercase tracking-[0.5em] text-white/80 [text-shadow:0_1px_2px_rgba(0,0,0,0.65),0_2px_18px_rgba(0,0,0,0.6)]">
            Bröllopsfotograf · Skåne
          </span>
        </div>

        <div className="flex flex-col items-center gap-5 md:gap-6">
          <p className="max-w-xl text-sm font-light italic leading-relaxed text-white/90 [text-shadow:0_1px_2px_rgba(0,0,0,0.65),0_2px_20px_rgba(0,0,0,0.6)] md:text-base">
            Äkta ögonblick, varsamt bevarade
          </p>

          <span className="w-full bg-white px-10 py-4 text-[11px] uppercase tracking-[0.28em] text-stone-900 sm:w-auto">
            Se bilder
          </span>
        </div>
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
  className = "",
}: {
  photo?: PreviewPhoto;
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
    </div>
  );
}

function ProcessPreview({
  eyebrow,
  steps,
}: {
  eyebrow: string;
  steps: ProcessStep[];
}) {
  return (
    <div>
      <div className="flex items-center gap-4">
        <span className="text-[10px] uppercase tracking-[0.35em] text-stone-400">
          {eyebrow}
        </span>
        <span className="h-px flex-1 bg-stone-200" aria-hidden="true" />
      </div>

      <div className="relative mt-8">
        <ol className="space-y-5">
          {steps.map((step, index) => {
            const Icon = getProcessIcon(step.icon, index);

            return (
              <li key={`${index}-${step.title}`} className="relative pl-14">
                {index < steps.length - 1 && (
                  <span
                    className="absolute -bottom-[42px] left-[15px] top-[22px] w-px bg-stone-900"
                    aria-hidden="true"
                  />
                )}
                <span
                  className="absolute left-0 top-1.5 flex h-8 w-8 items-center justify-center rounded-full border border-stone-900 bg-stone-900 text-white"
                  aria-hidden="true"
                >
                  <Icon size={15} strokeWidth={1.5} />
                  <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-900">
                    <Check size={8} strokeWidth={3} />
                  </span>
                </span>

                <div className="rounded-sm bg-stone-200/40 p-4">
                  <span className="text-[9px] uppercase tracking-[0.3em] text-stone-900">
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  <h3 className="mt-1 text-base font-light leading-snug text-stone-900">
                    {step.title}
                  </h3>

                  <p className="mt-2 text-sm font-light leading-relaxed text-stone-600">
                    {step.text}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      <span className="mt-8 inline-flex items-center gap-3 text-[10px] uppercase tracking-[0.28em] text-stone-900">
        <span className="border-b border-stone-300 pb-1">Boka ett samtal</span>
        <ArrowRight size={14} strokeWidth={1.5} />
      </span>
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
