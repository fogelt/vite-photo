import { Link } from "react-router-dom";

/**
 * Clerk-free admin entry point for the public site. Clerk is only loaded once
 * the visitor actually opens /admin, so public pages set no auth cookies.
 */
export function AdminButton() {
  return (
    <div className="hidden lg:flex absolute left-8 top-1/2 -translate-y-1/2 z-[70]">
      <Link
        to="/admin"
        aria-label="Admin"
        className="group flex flex-col items-center gap-1 opacity-0 transition-opacity duration-500 hover:opacity-100 focus-visible:opacity-100"
      >
        <div className="flex h-7 w-7 items-center justify-center rounded-full border border-stone-100">
          <div className="h-1 w-1 rounded-full bg-stone-200" />
        </div>
        <p className="text-[8px] uppercase tracking-[0.2em] text-stone-300">
          Admin
        </p>
      </Link>
    </div>
  );
}
