import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/services";

const FALLBACK_TITLE = "Välkomna hit";
const FALLBACK_TEXT =
  "Vad roligt att ni hittat hit! Jag heter Myelie och fotograferar bröllop med fokus på äkta känslor och de små ögonblicken som annars bara passerar. Bläddra runt bland bilderna nedan, lär känna mig lite bättre och kika på mina bröllopspaket — hör sedan gärna av er så berättar jag mer.";

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
    <div className="max-w-3xl mx-auto px-6 text-center animate-in fade-in slide-in-from-bottom-4 duration-1000 fill-mode-both">
      <p className="text-[11px] uppercase tracking-[0.4em] text-stone-400 mb-4">
        Bröllopsfotograf i Skåne
      </p>
      <h1 className="text-3xl md:text-5xl font-light tracking-wide text-stone-900 mb-6">
        {content?.title || FALLBACK_TITLE}
      </h1>
      <p className="text-stone-500 font-light leading-relaxed text-sm md:text-base whitespace-pre-line">
        {content?.text || FALLBACK_TEXT}
      </p>
    </div>
  );
}
