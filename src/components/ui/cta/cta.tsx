import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/services";
import { Mail, Phone } from 'lucide-react';

const FALLBACK_EMAIL = "myelie@live.se";
const FALLBACK_PHONE = "+46 72 16 82 019";

export function ContactCTA() {
  const { data: content } = useQuery({
    queryKey: ["about_content"],
    queryFn: async () => {
      const { data, error } = await supabase.from("about_content").select("email, phone").maybeSingle();
      if (error) return null;
      return data;
    },
  });

  const email = content?.email || FALLBACK_EMAIL;
  const phone = content?.phone || FALLBACK_PHONE;

  return (
    <section id="kontakt" className="w-full bg-stone-900 text-white scroll-mt-20">
      <div className="max-w-3xl mx-auto px-6 py-20 md:py-28 text-center animate-in fade-in slide-in-from-bottom-4 duration-1000 fill-mode-both">
        <p className="text-[11px] uppercase tracking-[0.4em] text-stone-400 mb-4">
          Boka
        </p>
        <h2 className="text-3xl md:text-5xl font-light tracking-wide mb-6">
          Låt oss berätta <span className="font-serif italic">er historia</span>
        </h2>
        <p className="text-stone-300 font-light leading-relaxed text-sm md:text-base mb-10">
          Berätta om era planer så tar vi det därifrån — datum, plats och era tankar.
          Jag svarar alltid personligt, oftast inom ett par dagar.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href={`mailto:${email}?subject=${encodeURIComponent("Förfrågan om bröllopsfotografering")}`}
            className="inline-flex items-center gap-3 bg-white text-stone-900 text-[11px] uppercase tracking-[0.25em] font-bold px-10 py-4 hover:bg-stone-200 transition-colors"
          >
            <Mail size={14} />
            Skicka e-post
          </a>
          <a
            href={`tel:${phone.replace(/\s/g, '')}`}
            className="inline-flex items-center gap-3 border border-stone-600 text-stone-200 text-[11px] uppercase tracking-[0.25em] font-bold px-10 py-4 hover:border-stone-300 hover:text-white transition-colors"
          >
            <Phone size={14} />
            {phone}
          </a>
        </div>
      </div>
    </section>
  );
}
