import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/services";

const FALLBACK_TITLE = "Välkomna hit";
const FALLBACK_TEXT =
  "Vad kul att ni hittat hit! Jag heter Myelie och fotograferar bröllop för par som vill minnas hur det kändes — pirret, tårarna och skratten mitt i allvaret. Inga stela poser, bara ni, precis som ni är.\n\nKika runt bland bilderna, känn efter, och hör av er om magen säger ja.";

export function WelcomeSection() {
  const { data: content } = useQuery({
    queryKey: ["welcome_content"],
    queryFn: async () => {
      const { data, error } = await supabase.from("welcome_content").select("*").maybeSingle();
      if (error) return null;
      return data;
    },
  });

  return (
    <div id="valkommen" className="max-w-3xl mx-auto px-6 text-center scroll-mt-36 md:scroll-mt-28 animate-in fade-in slide-in-from-bottom-4 duration-1000 fill-mode-both">
      <p className="text-[11px] uppercase tracking-[0.4em] text-stone-400 mb-4">
        Bröllopsfotograf i Skåne
      </p>
      <h1 className="text-3xl md:text-5xl font-light tracking-wide text-stone-900 mb-6">
        {content?.title || FALLBACK_TITLE}
      </h1>
      <p className="text-stone-500 font-light leading-relaxed text-sm md:text-base whitespace-pre-line first-letter:font-serif first-letter:text-5xl first-letter:float-left first-letter:mr-3 first-letter:leading-[0.9] first-letter:text-stone-700">
        {content?.text || FALLBACK_TEXT}
      </p>
    </div>
  );
}
