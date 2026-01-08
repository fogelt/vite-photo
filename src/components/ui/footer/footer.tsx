export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full py-12 border-t border-gray-300">
      <div className="flex flex-col items-center justify-center gap-4">
        <h1 className="text-xs tracking-[0.2em] uppercase text-gray-400 font-light">
          © {currentYear} Myelie Lendelund
        </h1>

        {/* Simple Social links or Location */}
        <div className="flex gap-8 text-[10px] uppercase tracking-widest text-gray-500">
          <a href="https://www.instagram.com/myelielendelund/" className="hover:text-black transition-colors">Instagram</a>
          <a href="https://www.linkedin.com/in/myelie-lendelund-3696b3380/" className="hover:text-black transition-colors">LinkedIn</a>
          <a href="mailto:myelie@live.se" className="hover:text-black transition-colors">Mail</a>
          <span className="cursor-default">Stockholm, Sweden</span>
        </div>
      </div>
    </footer>
  )
}