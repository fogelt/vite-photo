import { Byline } from '@/components/ui';
import { CornerDownLeft } from 'lucide-react'

interface ReportageLayoutProps {
  article: any;
}

export function ReportageLayout({ article }: ReportageLayoutProps) {
  const blocks = article.content_blocks || [];

  return (
    <article className="min-h-screen bg-white pb-40 animate-in fade-in duration-1000">

      {/* NEWSPAPER TOP */}
      <header className="pt-10 px-6">
        <div className="max-w-5xl mx-auto text-center space-y-5">
          {/* Title */}
          <h1 className="text-[24px] uppercase tracking-[0.4em] text-stone-400 mb-2">
            {article.title}
          </h1>

          <div className="w-full aspect-[16/10] md:aspect-[21/9] overflow-hidden bg-stone-100 shadow-sm mt-12">
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

          <div className="mx-auto py-10 border-y">
            <p className="text-xl md:text-2xl text-stone-600 font-light leading-relaxed serif italic">
              {article.description}
            </p>
          </div>
        </div>
      </header>

      {/* MASONRY IMAGE GRID */}
      <main className="mx-auto max-w-7xl mt-8">
        <div className="columns-1 md:columns-2 lg:columns-4 gap-4 space-y-4 px-4">
          {blocks
            .filter((block: any) => block.type === 'image')
            .map((block: any, index: number) => (
              <div
                key={index}
                className="break-inside-avoid overflow-hidden bg-stone-50 group border border-stone-50"
              >
                <img
                  src={block.value}
                  className="w-full h-auto object-cover grayscale-[0.2] hover:grayscale-0 transition-all duration-1000 group-hover:scale-[1.02]"
                  alt=""
                  loading="lazy"
                />
              </div>
            ))}
        </div>
      </main>

      <footer className="mt-40 flex flex-row items-center justify-center gap-3">
        <CornerDownLeft size={15} className="text-stone-900" />
        <a
          href="/articles"
          className="text-[10px] uppercase tracking-[0.5em] text-stone-900 font-bold border-b border-stone-900 pb-1 hover:text-stone-500 hover:border-stone-500 transition-colors"
        >
          Artiklar
        </a>
      </footer>
    </article>
  );
}