import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const ADMIN_AVATAR = '/admin-avatar.png';

/**
 * Clerk writes `__client_uat` (and suffixed variants) on the main domain when a
 * session exists. Reading only that cookie keeps the public site completely
 * free of Clerk scripts and Clerk network requests.
 */
function hasClerkSession() {
  if (typeof document === 'undefined') return false;

  return document.cookie
    .split(';')
    .map((cookie) => cookie.trim())
    .some((cookie) => {
      const [name, ...valueParts] = cookie.split('=');
      const value = valueParts.join('=');

      // Clerk's readable "updated at" cookie is a Unix timestamp when a
      // session exists, and 0 when signed out.
      if (name.startsWith('__client_uat')) {
        return /^\d+$/.test(value) && Number(value) > 0;
      }

      // Dev-only Clerk cookie; production session cookies are HttpOnly.
      if (name.startsWith('__clerk_db_jwt')) {
        return value.length > 0;
      }

      return false;
    });
}

/**
 * Discreet admin entry in the footer. Visually identical to the original Clerk
 * button, but it links to /admin and never loads Clerk on public pages.
 */
export function AdminButton() {
  const [signedIn, setSignedIn] = useState(hasClerkSession);

  useEffect(() => {
    const update = () => setSignedIn(hasClerkSession());
    update();
    window.addEventListener('focus', update);
    document.addEventListener('visibilitychange', update);
    return () => {
      window.removeEventListener('focus', update);
      document.removeEventListener('visibilitychange', update);
    };
  }, []);

  return (
    <div className="hidden lg:flex absolute left-8 top-1/2 -translate-y-1/2 z-[70]">
      {signedIn ? (
        <Link
          to="/admin"
          aria-label="Admin"
          className="flex flex-col items-center gap-1 group"
        >
          <img
            src={ADMIN_AVATAR}
            alt=""
            className="h-7 w-7 rounded-full border border-stone-100 object-cover"
          />
          <p className="text-[8px] uppercase tracking-[0.2em] text-stone-400 group-hover:text-stone-800 transition-colors">
            Admin
          </p>
        </Link>
      ) : (
        <Link
          to="/admin"
          aria-label="Logga in som admin"
          className="flex flex-col items-center gap-1 opacity-0 hover:opacity-100 transition-opacity duration-500 cursor-default group"
        >
          <div className="w-7 h-7 rounded-full border border-stone-100 flex items-center justify-center">
            <div className="w-1 h-1 bg-stone-200 rounded-full" />
          </div>
          <p className="text-[8px] uppercase tracking-[0.2em] text-stone-300">
            Login
          </p>
        </Link>
      )}
    </div>
  );
}
