import { useState } from 'react';
import { ImageContainer, ImageModal, Byline } from '@/components/ui/';
import { CornerDownLeft } from 'lucide-react';

interface ReportageLayoutProps {
  article: any;
}

export function ReportageLayout({ article }: ReportageLayoutProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  //-- Split text logic --
  const paragraphs = (article.description || "").split('\n').filter((p: string) => p.trim() !== '');
  const splitPoint = Math.max(1, Math.floor(paragraphs.length * 0.5));
  const firstHalf = paragraphs.slice(0, splitPoint).join('\n\n');
  const secondHalf = paragraphs.slice(splitPoint).join('\n\n');

  const photos = (article.content_blocks || [])
    .filter((block: any) => block.type === 'image')
    .map((block: any) => ({
      id: block.id,
      url: block.value,
      alt: article.title,
      photo_variants: []
    }));

  return (

    <article className="min-h-screen bg-white pb-10 animate-in fade-in duration-1000">
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
          <div className="py-3 border-y text-left">
            <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-12">

              <div className="flex-1">
                <p className="text-sm leading-relaxed md:text-base text-stone-900 font-light whitespace-pre-line first-letter:text-4xl first-letter:mt-1">
                  {firstHalf}
                </p>
              </div>

              <div className="hidden md:block w-px bg-stone-200 self-stretch" />

              <div className="flex-1 md:pt-16">
                <p className="text-sm leading-relaxed md:text-base text-stone-900 font-light whitespace-pre-line">
                  {secondHalf}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>
      <main className="px-4">
        <div className="max-w-8xl mx-auto">
          <div className="flex justify-between items-end mb-8  pb-4">
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