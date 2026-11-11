import { ArrowLeft, Instagram, Linkedin, Mail, MapPin, Camera, Phone } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { AdminButton } from '@/components/ui/admin-button';


export function Footer() {
  const currentYear = new Date().getFullYear();
  const { pathname } = useLocation();
  const isAdmin = pathname.startsWith('/admin');

  return (
    <footer className="w-full py-12 border-t border-gray-300 bg-white">
      <div className="flex flex-col items-center justify-center gap-6">
        {isAdmin ? (
          <div className="hidden lg:flex absolute left-8 top-1/2 -translate-y-1/2 z-[70]">
            <Link
              to="/"
              aria-label="Tillbaka till sajten"
              className="group flex flex-col items-center gap-1"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full border border-stone-100 text-stone-400 transition-colors group-hover:text-stone-800">
                <ArrowLeft size={13} strokeWidth={1.5} aria-hidden="true" />
              </span>
              <span className="text-[8px] uppercase tracking-[0.2em] text-stone-400 transition-colors group-hover:text-stone-800">
                Tillbaka
              </span>
            </Link>
          </div>
        ) : (
          <AdminButton />
        )}
        {/* Social Icons Row */}
        <div className="flex items-center gap-8 text-gray-500">
          <a
            href="https://www.instagram.com/myelielendelund/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-black transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-black rounded-sm outline-none"
            aria-label="Följ Myelie Foto på Instagram (öppnas i ny flik)"
          >
            <Instagram size={16} strokeWidth={1.2} aria-hidden="true" />
          </a>

          <a
            href="https://www.linkedin.com/in/myelie-lendelund-3696b3380/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-black transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-black rounded-sm outline-none"
            aria-label="Myelie Lendelund på LinkedIn (öppnas i ny flik)"
          >
            <Linkedin size={16} strokeWidth={1.2} aria-hidden="true" />
          </a>

          <a
            href="mailto:myelie@live.se"
            className="hover:text-black transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-black rounded-sm outline-none"
            aria-label="Skicka ett e-postmeddelande till Myelie"
          >
            <Mail size={16} strokeWidth={1.2} aria-hidden="true" />
          </a>

          <a
            href="tel:+46721682019"
            className="hover:text-black transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-black rounded-sm outline-none"
            aria-label="Telefonnummer till Myelie"
          >
            <Phone size={16} strokeWidth={1.2} aria-hidden="true" />
          </a>
        </div>

        {/* Balanced Three-Part Info Row */}
        <div className="flex flex-wrap justify-center items-center gap-4 md:gap-6 text-[10px] tracking-[0.2em] uppercase text-gray-400 font-light">

          {/* Left Side: Specialty */}
          <div className="flex items-center gap-2">
            <Camera size={12} strokeWidth={1.2} />
            <span>Fotograf</span>
          </div>

          <span className="text-gray-200 hidden sm:block">|</span>

          {/* Middle: Copyright */}
          <span className="text-gray-500 font-normal">© {currentYear} Myelie Lendelund</span>

          <span className="text-gray-200 hidden sm:block">|</span>

          {/* Right Side: Location */}
          <div className="flex items-center gap-2">
            <MapPin size={12} strokeWidth={1.2} />
            <span>Sverige</span>
          </div>
        </div>
      </div>
    </footer>
  );
}