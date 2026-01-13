import { UserButton, SignedIn, SignedOut } from "@clerk/clerk-react";
import { Link } from "react-router-dom";

export function AdminButton() {
  return (
    <div className="hidden lg:flex absolute left-8 top-1/2 -translate-y-1/2 z-[70]">

      {/* Signed In State */}
      <SignedIn>
        <Link to="/admin" className="flex flex-col items-center gap-1 group">
          <UserButton
            appearance={{
              elements: {
                userButtonAvatarBox: "w-7 h-7 border border-stone-100",
              },
            }}
          />
          <p className="text-[8px] uppercase tracking-[0.2em] text-stone-400 group-hover:text-stone-800 transition-colors">
            Admin
          </p>
        </Link>
      </SignedIn>

      {/* Signed Out State */}
      <SignedOut>
        <Link
          to="/admin"
          className="flex flex-col items-center gap-1 opacity-0 hover:opacity-100 transition-opacity duration-500 cursor-default group"
        >
          <div className="w-7 h-7 rounded-full border border-stone-100 flex items-center justify-center">
            <div className="w-1 h-1 bg-stone-200 rounded-full" />
          </div>
          <p className="text-[8px] uppercase tracking-[0.2em] text-stone-300">
            Login
          </p>
        </Link>
      </SignedOut>
    </div>
  );
}