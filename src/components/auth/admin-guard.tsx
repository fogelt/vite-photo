import { useEffect, useRef } from "react";
import { useUser, useClerk } from "@clerk/clerk-react";
import { Outlet } from "react-router-dom";

const CLERK_USER_ID = import.meta.env.VITE_CLERK_USER_ID;

export const AdminGuard = () => {
  const { isLoaded, isSignedIn, user } = useUser();
  const clerk = useClerk();
  const redirecting = useRef(false);

  useEffect(() => {
    if (!isLoaded || isSignedIn || redirecting.current) return;
    redirecting.current = true;

    // Replace instead of push. If the photographer presses Back from Clerk's
    // hosted sign-in page, they should land on the public site rather than on
    // a stale /admin entry that can be restored from bfcache as a blank page.
    window.location.replace(
      clerk.buildSignInUrl({ redirectUrl: window.location.href }),
    );
  }, [clerk, isLoaded, isSignedIn]);

  if (!isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center">
        <span className="text-[10px] uppercase tracking-widest text-stone-400">Verifierar...</span>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="flex h-screen items-center justify-center">
        <span className="text-[10px] uppercase tracking-widest text-stone-400">
          Omdirigerar till inloggning...
        </span>
      </div>
    );
  }

  if (user.id !== CLERK_USER_ID) {
    return (
      <div className="flex flex-col h-[60vh] items-center justify-center gap-4">
        <p className="text-[10px] uppercase tracking-[0.2em] text-red-800">Åtkomst nekad</p>
        <button onClick={() => clerk.signOut()} className="text-[9px] underline uppercase tracking-widest text-stone-500 hover:text-stone-800">
          Logga ut
        </button>
      </div>
    );
  }

  return <Outlet />;
};
