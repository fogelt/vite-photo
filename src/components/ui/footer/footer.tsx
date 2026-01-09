import { Instagram, Linkedin, Mail } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full py-12 border-t border-gray-300">
      <div className="flex flex-col items-center justify-center gap-4">

        <div className="flex items-center gap-8 text-[10px] uppercase tracking-widest text-gray-500">
          {/* Instagram Icon */}
          <a
            href="https://www.instagram.com/myelielendelund/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-black transition-colors"
            aria-label="Instagram"
          >
            <Instagram size={16} strokeWidth={1.2} />
          </a>

          {/* LinkedIn Icon */}
          <a
            href="https://www.linkedin.com/in/myelie-lendelund-3696b3380/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-black transition-colors"
            aria-label="LinkedIn"
          >
            <Linkedin size={16} strokeWidth={1.2} />
          </a>

          {/* Mail Icon */}
          <a
            href="mailto:myelie@live.se"
            className="hover:text-black transition-colors"
            aria-label="Mail"
          >
            <Mail size={16} strokeWidth={1.2} />
          </a>
        </div>
        <h1 className="text-xs tracking-[0.2em] uppercase text-gray-400 font-light mb-0">
          © {currentYear} Myelie Lendelund
        </h1>
      </div>
    </footer>
  );
}