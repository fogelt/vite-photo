import { useQuery } from "@tanstack/react-query";
import { useState } from 'react';
import { supabase } from "@/services";
import { Link } from 'react-router-dom';
import { LayoutGrid, BookOpen, Newspaper, ChevronDown, ListFilter, ExternalLink } from 'lucide-react';

interface DbArticle {
  id: string;
  title: string;
  publisher: string;
  description: string;
  image_url: string;
  link_url?: string;
  slug?: string;
  type: 'external' | 'internal';
  published_date: string;
  created_at: string;
}

const filterOptions = [
  { id: 'all', label: 'Alla', icon: LayoutGrid },
  { id: 'internal', label: 'Interna', icon: BookOpen },
  { id: 'external', label: 'Publicerade', icon: Newspaper },
] as const;

export function ArticlesLayout() {
  const [filter, setFilter] = useState<'all' | 'internal' | 'external'>('all');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { data: articles, isLoading } = useQuery({
    queryKey: ["articles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("articles")
        .select("*");

      if (error) throw error;

      // Sorteringslogik för svenska månadssträngar
      const swedishMonths: { [key: string]: number } = {
        januari: 0, februari: 1, mars: 2, april: 3, maj: 4, juni: 5,
        juli: 6, augusti: 7, september: 8, oktober: 9, november: 10, december: 11
      };

      const sortedData = (data as DbArticle[]).sort((a, b) => {
        const [monthA, yearA] = a.published_date.toLowerCase().split(" ");
        const [monthB, yearB] = b.published_date.toLowerCase().split(" ");

        if (yearA !== yearB) {
          return parseInt(yearB) - parseInt(yearA);
        }
        return swedishMonths[monthB] - swedishMonths[monthA];
      });

      return sortedData;
    },
  });

  if (isLoading) return <div className="min-h-screen animate-pulse bg-stone-50" />;
  if (!articles || articles.length === 0) return null;

  const activeLabel = filterOptions.find(opt => opt.id === filter)?.label;
  const filteredArticles = filter === 'all'
    ? articles
    : articles.filter(a => a.type === filter);

  return (
    <section className="max-w-7xl mx-auto px-6 py-16 md:py-24 animate-in fade-in duration-1000">
      <div className="flex flex-col items-center mb-20 space-y-6">
        <h2 className="text-[11px] uppercase tracking-[0.4em] text-stone-400">
          Reportage
        </h2>

        <div className="relative">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex items-center gap-3 px-6 py-2 border border-stone-200 rounded-full text-stone-600 hover:border-stone-900 hover:text-stone-900 transition-all duration-300"
          >
            <ListFilter size={14} className="opacity-60" />
            <span className="text-[10px] uppercase tracking-[0.3em] font-medium">
              {activeLabel}
            </span>
            <ChevronDown
              size={14}
              className={`transition-transform duration-300 ${isMenuOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {isMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setIsMenuOpen(false)}
              />

              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-4 w-48 bg-white border border-stone-100 shadow-xl rounded-sm py-2 z-40 animate-in fade-in zoom-in-95 duration-200">
                {filterOptions.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => {
                      setFilter(opt.id);
                      setIsMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-4 px-5 py-3 text-[10px] uppercase tracking-[0.2em] transition-colors
                    ${filter === opt.id
                        ? 'text-stone-900 bg-stone-50'
                        : 'text-stone-400 hover:text-stone-900 hover:bg-stone-50/50'
                      }`}
                  >
                    <opt.icon size={14} strokeWidth={filter === opt.id ? 2 : 1.5} />
                    {opt.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-16">
        {filteredArticles.map((article) => {
          const isInternal = article.type === 'internal';
          const destination = isInternal ? `/reportage/${article.slug || article.id}` : article.link_url;
          const Wrapper = isInternal ? Link : "a";
          const wrapperProps = isInternal ? { to: destination } : { href: destination, target: "_blank", rel: "noopener noreferrer" };

          return (
            <Wrapper
              key={article.id}
              {...(wrapperProps as any)}
              className="group flex flex-col bg-stone-50/40 hover:bg-stone-50 transition-colors duration-500 rounded-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-1000 fill-mode-both shadow-sm hover:shadow-md"
            >
              {/* Image Container */}
              <div className="relative aspect-[16/9] overflow-hidden bg-stone-100">
                <img
                  src={article.image_url}
                  alt={article.title}
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                />

                {/* Variant-style Icon Logic (Photography Style) */}
                <div className="absolute top-4 right-4 z-20 flex items-center gap-2 pointer-events-auto group/icon">
                  <span className="text-white text-[10px] uppercase tracking-widest bg-black/40 backdrop-blur-md px-2 py-1.5 rounded-md opacity-0 -translate-x-2 transition-all duration-300 group-hover/icon:opacity-100 group-hover/icon:translate-x-0 whitespace-nowrap">
                    {isInternal ? "Läs reportage" : "Öppna extern länk"}
                  </span>

                  <div className="text-white drop-shadow-md bg-black/40 backdrop-blur-md px-2 py-2 rounded-md opacity-40 transition-all duration-300 group-hover/icon:scale-110 group-hover/icon:opacity-100">
                    {isInternal ? (
                      <BookOpen size={14} strokeWidth={1.5} />
                    ) : (
                      <ExternalLink size={14} strokeWidth={1.5} />
                    )}
                  </div>
                </div>

                <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>

              {/* Text Content Area */}
              <div className="flex flex-col flex-grow p-8 space-y-4">
                <div className="flex justify-between items-baseline text-[10px] uppercase tracking-widest text-stone-400 font-medium">
                  <span className="tracking-[0.2em]">{article.publisher}</span>
                  <span>{article.published_date}</span>
                </div>

                <div className="space-y-3">
                  <h3 className="text-xl font-light text-stone-900 group-hover:text-stone-600 transition-colors duration-300 leading-snug">
                    {article.title}
                  </h3>
                  <p className="text-sm text-stone-500 font-light leading-relaxed line-clamp-3">
                    {article.description}
                  </p>
                </div>

                {/* Spacer to push button to the bottom */}
                <div className="flex-grow" />

                <div className="pt-2 flex flex-row items-center gap-1 group">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-stone-900 border-b border-stone-200 pb-1 group-hover:border-stone-900 transition-colors">
                    {isInternal ? (
                      "Se hela Reportaget"
                    ) : (
                      <>
                        Läs mer på <span className="font-bold text-stone-600">{article.publisher}</span>
                      </>
                    )}
                  </span>
                  {!isInternal && (
                    <ExternalLink
                      size={14}
                      strokeWidth={1.5}
                      className="text-stone-900 mb-1 -translate-y-[3px]"
                    />
                  )}
                </div>
              </div>
            </Wrapper>
          );
        })}
      </div>
    </section>
  );
}