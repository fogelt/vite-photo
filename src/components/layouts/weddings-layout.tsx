import { useState } from 'react';
import { ImageContainer, ImageModal } from '@/components/ui';

interface Photo {
  id: string;
  url: string;
  alt?: string;
}

export function WeddingsLayout({ photos }: { photos: Photo[] }) {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  const firstThree = photos.slice(0, 3);
  const theRest = photos.slice(3);

  const packages = [
    {
      name: "Brons",
      time: "3 timmar bevakning",
      includes: "Mingel, vigsel, porträtt",
      images: "Mellan 30-40 bilder",
      price: "9.500 kr",
    },
    {
      name: "Silver",
      time: "10 timmar bevakning",
      includes: "Mingel, vigsel, porträtt, middag, fest",
      images: "Mellan 100-130 bilder",
      price: "16.500 kr",
      highlight: true,
    },
    {
      name: "Guld",
      time: "Heldag (15 timmar)",
      includes: "Förberedelser, first-look, mingel, vigsel, porträtt, middag, fest",
      images: "Mellan 140-160 bilder",
      price: "24.500 kr",
    },
  ];

  return (
    <section className="w-full flex flex-col gap-16 py-8 bg-white">
      {/* Top Gallery Section */}
      <ImageContainer
        photos={firstThree}
        variant="weddings"
        onItemClick={(photo) => setSelectedPhoto(photo)}
      />

      {/* Pricing Section */}
      <div className="max-w-6xl mx-auto px-6 w-full">
        <div className="text-center mb-12">
          <h2 className="text-[11px] uppercase tracking-[0.4em] text-stone-400 mb-2">
            Bröllopspaket
          </h2>
          <p className="text-stone-500 font-light italic text-sm">En investering för livet</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {packages.map((pkg) => (
            <div
              key={pkg.name}
              className={`
                flex flex-col p-8 border border-stone-200 transition-all duration-500
                ${pkg.highlight ? 'bg-stone-50/50 shadow-sm ring-1 ring-stone-200' : 'bg-white hover:shadow-md'}
              `}
            >
              <h3 className="font-light tracking-[0.2em] uppercase text-base mb-4 text-stone-800">
                {pkg.name}
              </h3>

              <div className="flex-grow flex flex-col gap-4">
                <div className="space-y-1">
                  <p className="text-[11px] uppercase tracking-wider text-stone-400 font-semibold">Tid</p>
                  <p className="text-xs text-stone-600 leading-relaxed">{pkg.time}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] uppercase tracking-wider text-stone-400 font-semibold">Ingår</p>
                  <p className="text-xs text-stone-600 leading-relaxed">{pkg.includes}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] uppercase tracking-wider text-stone-400 font-semibold">Leverans</p>
                  <p className="text-xs text-stone-600 leading-relaxed">{pkg.images}</p>
                </div>
              </div>

              <div className="mt-10 pt-6 border-t border-stone-300">
                <p className="text-lg font-light tracking-tight text-stone-900">
                  {pkg.price}
                </p>
                <p className="text-[10px] text-stone-400 uppercase tracking-tighter">
                  inkl. moms
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Gallery Section */}
      <ImageContainer
        photos={theRest}
        variant="weddings"
        onItemClick={(photo) => setSelectedPhoto(photo)}
      />

      {/* Fullscreen Modal Component */}
      <ImageModal
        isOpen={!!selectedPhoto}
        onClose={() => setSelectedPhoto(null)}
        imageUrl={selectedPhoto?.url || ''}
        alt={selectedPhoto?.alt || 'Bröllopsfotografi'}
      />
    </section>
  );
}