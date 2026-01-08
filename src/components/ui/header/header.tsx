import { NavLink } from '@/components/ui'

export function Header() {
  return (
    <div className="w-full border-b border-gray-300">
      <header className="flex items-center justify-between px-8 py-10 w-full max-w-7xl mx-auto">
        <a href="/" className="group">
          <h1 className="text-sm md:text-base font-light tracking-[0.3em] uppercase transition-opacity group-hover:opacity-70">
            Fotograf <span className="font-medium">Myelie Lendelund</span>
          </h1>
        </a>

        <nav className="flex items-center gap-8">
          <NavLink text="Portfölj" href="/" />
          <NavLink text="Porträtt" href="/portraits" />
          <NavLink text="Bröllop" href="/weddings" />
          <NavLink text="Om Mig" href="/about" />
        </nav>
      </header>
    </div>
  )
}