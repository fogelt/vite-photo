import { NavLink as RouterLink } from 'react-router-dom';

export function NavLink({ text, href }: { text: string; href: string }) {
  return (
    <RouterLink
      to={href}
      className={({ isActive }) => `
        text-[10px] uppercase tracking-[0.2em] transition-colors duration-300
        ${isActive ? 'text-black font-semibold' : 'text-gray-400 hover:text-black'}
      `}
    >
      {text}
    </RouterLink>
  );
}