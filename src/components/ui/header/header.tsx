import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { NavLink, AdminButton } from '@/components/ui';

export function Header() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isOpen]);

  const navLinks = [
    { text: "Portfölj", href: "/" },
    { text: "Porträtt", href: "/portraits" },
    { text: "Bröllop", href: "/weddings" },
    { text: "Reportage", href: "/articles" },
    { text: "Om Mig", href: "/about" },
  ];

  return (
    <div className="w-full border-b border-stone-200 bg-white sticky top-0 z-[60] overflow-x-hidden">
      <header className="flex items-center justify-between px-4 md:px-8 py-6 md:py-10 w-full max-w-7xl mx-auto">

        <Link to="/" className="z-[70] flex-shrink-0" onClick={() => setIsOpen(false)}>
          <h1 className="text-[10px] sm:text-xs md:text-base font-light tracking-[0.2em] md:tracking-[0.3em] uppercase">
            Fotograf <span className="font-medium">Myelie Lendelund</span>
          </h1>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <NavLink key={link.text} text={link.text} href={link.href} />
          ))}
        </nav>

        <button
          className="md:hidden z-[70] p-2 flex-shrink-0 -mr-2"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Meny"
        >
          {isOpen ? <X size={20} className="text-stone-600" /> : <Menu size={20} className="text-stone-600" />}
        </button>

        <div className={`
          fixed inset-0 bg-white z-[65] flex flex-col items-center justify-center transition-all duration-300 ease-in-out md:hidden
          ${isOpen ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'}
        `}>
          <nav className="flex flex-col items-center gap-8">
            {navLinks.map((link) => (
              <div
                key={link.text}
                onClick={() => setIsOpen(false)}
                className="text-lg tracking-[0.2em] uppercase font-light"
              >
                <NavLink text={link.text} href={link.href} />
              </div>
            ))}
          </nav>
        </div>
      </header>
    </div>
  );
}