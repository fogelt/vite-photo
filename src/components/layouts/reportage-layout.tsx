import { useState } from 'react';
import { ImageContainer, ImageModal, Byline } from '@/components/ui/';
import { CornerDownLeft } from 'lucide-react';

interface ReportageLayoutProps {
  article: any;
}

export function ReportageLayout({ article }: ReportageLayoutProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const photos = (article.content_blocks || [])
    .filter((block: any) => block.type === 'image')
    .map((block: any) => ({
      id: block.id,
      url: block.value,
      alt: article.title,
      photo_variants: []
    }));

  return (

    <article className="min-h-screen bg-white pb-40 animate-in fade-in duration-1000">
      <footer className="mt-10 flex flex-row gap-3 ml-10">
        <CornerDownLeft size={15} className="text-stone-900" />
        <a
          href="/articles"
          className="text-[10px] uppercase tracking-[0.5em] text-stone-900 font-bold border-b border-stone-900 pb-1 hover:text-stone-500 hover:border-stone-500 transition-colors"
        >
          Artiklar
        </a>
      </footer>
      <header className="pt-10 px-6">
        <div className="max-w-5xl mx-auto text-center space-y-5">
          <h1 className="text-[24px] uppercase tracking-[0.4em] text-stone-400 mb-2">
            {article.title}
          </h1>
          <div className="w-full aspect-[16/10] md:aspect-[21/9] overflow-hidden shadow-sm mt-12">
            <img
              src={article.image_url}
              className="w-full h-full object-cover"
              alt={article.title}
            />
          </div>
          <Byline
            date={article.published_date}
            publisher={article.publisher}
          />
          <div className="py-10 border-y text-left">
            <p className="text-xl md:text-[22px] leading-[1.5] md:leading-[1.6] text-stone-800 font-light serif whitespace-pre-line
            first-letter:text-6xl">
              {article.description}
            </p>
          </div>
        </div>
      </header>
      <main className="px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-end mb-8 px-2 border-b border-stone-100 pb-4">
          </div>
          <ImageContainer
            photos={photos}
            variant="reportage"
            onItemClick={(photo) => {
              const index = photos.findIndex((p: any) => p.id === photo.id);
              setSelectedIndex(index);
            }}
          />
        </div>
      </main>
      <ImageModal
        isOpen={selectedIndex !== null}
        onClose={() => setSelectedIndex(null)}
        photos={photos}
        currentIndex={selectedIndex || 0}
        setCurrentIndex={setSelectedIndex}
      />
    </article>
  );
}