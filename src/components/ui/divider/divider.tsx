export function SectionDivider() {
  return (
    <div className="flex items-center justify-center gap-4 max-w-xs mx-auto px-6" aria-hidden="true">
      <span className="h-px flex-1 bg-stone-200" />
      <span className="w-1.5 h-1.5 rotate-45 bg-stone-300" />
      <span className="h-px flex-1 bg-stone-200" />
    </div>
  );
}
