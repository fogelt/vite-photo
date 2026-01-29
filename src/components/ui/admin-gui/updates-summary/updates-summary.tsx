import { Check } from "lucide-react";

export function UpdatesSummary() {

  return (
    <div className="relative p-5 pt-10 border h-[85px] border-stone-200 shadow-lg flex items-center gap-6 animate-in fade-in slide-in-from-right-4 duration-1000">

      <p className="absolute top-2 text-[10px] text-stone-400 uppercase tracking-widest mt-2 font-bold">
        Uppdateringar
      </p>
      <div className="flex items-center gap-2">
        <Check size={15} className="text-green-600" />
        <div className="flex flex-col">
          <div className="flex flex-col">
            <span className="text-[10px] text-stone-600 uppercase tracking-widest font-bold">Variant-bilder kan nu flyttas runt</span>
          </div>
        </div>
      </div>

    </div>
  );
}