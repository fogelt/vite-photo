// components/ui/byline.tsx
export function Byline({ date, publisher }: { date: string; publisher: string }) {
  return (
    <div className="flex items-center gap-6 mx-auto">
      <img
        src="/myelie_byline.avif"
        alt="Myelie Lendelund"
        className="w-14 h-14 rounded-full object-cover grayscale opacity-90 border border-stone-700 shadow-sm"
      />

      <div className="flex flex-col items-start text-left border-l border-stone-200 pl-6">
        <span className="text-[9px] uppercase tracking-[0.3em] text-stone-400 font-bold">
          Redigerat av
        </span>
        <h4 className="text-xl font-light tracking-[0.15em] text-stone-900 leading-tight">
          Myelie Lendelund
        </h4>
        <p className="text-[10px] uppercase tracking-[0.15em] text-stone-400 font-medium mt-1">
          {publisher} — {date}
        </p>
      </div>
    </div>
  );
}