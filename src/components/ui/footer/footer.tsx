import { Instagram, Linkedin, Mail, MapPin, Camera } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full py-12 border-t border-gray-300 bg-white">
      <div className="flex flex-col items-center justify-center gap-6">

        {/* Social Icons Row */}
        <div className="flex items-center gap-8 text-gray-500">
          <a
            href="https://www.instagram.com/myelielendelund/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-black transition-colors"
          >
            <Instagram size={16} strokeWidth={1.2} />
          </a>

          <a
            href="https://www.linkedin.com/in/myelie-lendelund-3696b3380/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-black transition-colors"
          >
            <Linkedin size={16} strokeWidth={1.2} />
          </a>

          <a
            href="mailto:myelie@live.se"
            className="hover:text-black transition-colors"
          >
            <Mail size={16} strokeWidth={1.2} />
          </a>
        </div>

        {/* Balanced Three-Part Info Row */}
        <div className="flex flex-wrap justify-center items-center gap-4 md:gap-6 text-[10px] tracking-[0.2em] uppercase text-gray-400 font-light">

          {/* Left Side: Specialty */}
          <div className="flex items-center gap-2">
            <Camera size={12} strokeWidth={1.2} />
            <span>Fotografi</span>
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