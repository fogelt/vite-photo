import { useUser, RedirectToSignIn, useClerk } from "@clerk/clerk-react";
import { Outlet } from "react-router-dom";

const CLERK_USER_ID = import.meta.env.VITE_CLERK_USER_ID;

export const AdminGuard = () => {
  const { isLoaded, isSignedIn, user } = useUser();
  const { signOut } = useClerk();

  if (!isLoaded) return (
    <div className="flex h-screen items-center justify-center">
      <span className="text-[10px] uppercase tracking-widest text-stone-400">Verifierar...</span>
    </div>
  );

  if (!isSignedIn) return <RedirectToSignIn />;

  if (user.id !== CLERK_USER_ID) {
    return (
      <div className="flex flex-col h-[60vh] items-center justify-center gap-4">
        <p className="text-[10px] uppercase tracking-[0.2em] text-red-800">Åtkomst nekad</p>
        <button onClick={() => signOut()} className="text-[9px] underline uppercase tracking-widest text-stone-500 hover:text-stone-800">
          Logga ut
        </button>
      </div>
    );
  }

  return <Outlet />;
};