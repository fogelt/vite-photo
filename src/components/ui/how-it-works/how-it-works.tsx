import { MessagesSquare, CalendarCheck, Camera, Images, ChevronRight } from 'lucide-react';
import { Fragment } from 'react';

const STEPS = [
  {
    icon: MessagesSquare,
    title: "Hör av er",
    text: "Berätta om era planer, datum och vision. Jag svarar alltid personligt, oftast inom ett par dagar.",
  },
  {
    icon: CalendarCheck,
    title: "Vi planerar",
    text: "Vi träffas eller tar ett samtal och går igenom schema, platser och era önskemål inför dagen.",
  },
  {
    icon: Camera,
    title: "Bröllopsdagen",
    text: "Jag finns med diskret under dagen och fångar allt — från förberedelserna till sista dansen.",
  },
  {
    icon: Images,
    title: "Leverans",
    text: "Ni får ett handplockat och varsamt redigerat galleri att dela, spara och återvända till.",
  },
];

export function HowItWorks() {
  return (
    <div className="max-w-6xl mx-auto px-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-1000 fill-mode-both">
      <div className="text-center mb-12">
        <h2 className="text-[11px] uppercase tracking-[0.4em] text-stone-400 mb-2">
          Hur går det till
        </h2>
        <p className="text-stone-500 font-light italic text-sm">Från första mejlet till färdiga bilder</p>
      </div>

      <div className="flex flex-col lg:flex-row items-stretch gap-8 lg:gap-4">
        {STEPS.map((step, index) => (
          <Fragment key={step.title}>
            <div
              style={{ animationDelay: `${(index + 1) * 150}ms` }}
              className="flex-1 flex flex-col items-center text-center p-8 border border-stone-200 bg-white transition-all duration-700 animate-in fade-in slide-in-from-bottom-6 fill-mode-both hover:shadow-md"
            >
              <span className="text-[10px] tracking-[0.3em] text-stone-300 font-bold mb-4">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className="w-12 h-12 rounded-full border border-stone-200 flex items-center justify-center mb-5">
                <step.icon size={20} strokeWidth={1.5} className="text-stone-600" />
              </span>
              <h3 className="font-light tracking-[0.2em] uppercase text-sm mb-3 text-stone-800">
                {step.title}
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed font-light">
                {step.text}
              </p>
            </div>
            {index < STEPS.length - 1 && (
              <div className="hidden lg:flex items-center justify-center shrink-0" aria-hidden="true">
                <ChevronRight size={18} className="text-stone-300" />
              </div>
            )}
          </Fragment>
        ))}
      </div>
    </div>
  );
}
