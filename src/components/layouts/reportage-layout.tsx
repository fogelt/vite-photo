import { Byline } from '@/components/ui';
import { CornerDownLeft } from 'lucide-react'

interface ReportageLayoutProps {
  article: any;
}

export function ReportageLayout({ article }: ReportageLayoutProps) {
  const blocks = article.content_blocks || [];

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
          {/* Title */}
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

          <div className="mx-auto pt-10 border-t">
            <p className="text-xl md:text-[24px] text-stone-700 font-light serif whitespace-pre-line">
              {article.description}
            </p>
          </div>
        </div>
      </header>

      <main className="mt-20 px-6">
        <div className="max-w-7xl mx-auto bg-stone-50/50 border bg-stone-200 border-stone-200 p-4 md:p-8 rounded-sm shadow-sm">

          <div className="flex justify-between items-end mb-6 px-2">
            <h3 className="text-[10px] uppercase tracking-[0.3em] text-stone-500 font-medium">
              Reportage / Galleri
            </h3>
          </div>

          {/* Carousel Container */}
          <div className="flex overflow-x-scroll overflow-y-hidden snap-x snap-mandatory force-scrollbar-show gap-4 pb-6">
            {blocks
              .filter((block: any) => block.type === 'image')
              .map((block: any, index: number) => (
                <div
                  key={index}
                  className="snap-center shrink-0"
                >
                  {/* Själva bilden inuti containern */}
                  <div className="h-[55vh] md:h-[70vh] w-auto overflow-hidden bg-white border border-stone-200 shadow-sm">
                    <img
                      src={block.value}
                      className="h-full w-auto object-contain grayscale-[0.2] hover:grayscale-0 transition-all duration-1000"
                      alt=""
                      loading="lazy"
                    />
                  </div>
                </div>
              ))}
          </div>

          {/* Footer inuti containern */}
          <div className="flex justify-between items-center mt-6 pt-6 border-t border-stone-200/60 px-2">
            <p className="text-[9px] uppercase tracking-[0.3em] text-stone-400 italic">
              Bläddra för att utforska bilderna
            </p>
            <div className="flex gap-4">
            </div>
          </div>
        </div>
      </main>
    </article>
  );
}