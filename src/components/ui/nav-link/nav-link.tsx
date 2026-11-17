import { NavLink as RouterLink, useLocation } from 'react-router-dom';
import { showSiteCurtain } from '@/utils';

export function NavLink({ text, href }: { text: string; href: string }) {
  const { pathname } = useLocation();

  return (
    <RouterLink
      to={href}
      onClick={() => {
        // Cover the old page the moment the link is used: the next route's
        // chunk may take a moment, and the white sheet is the loading state.
        // The route layout starts the dissolve once the new page has landed.
        if (href !== pathname) showSiteCurtain();
      }}
      className={({ isActive }) => `
        text-[10px] uppercase tracking-[0.2em] transition-colors duration-300
        ${isActive ? 'text-black font-semibold' : 'text-gray-400 hover:text-black'}
      `}
    >
      {text}
    </RouterLink>
  );
}
