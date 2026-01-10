import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/services";

interface DbArticle {
  id: string;
  title: string;
  publisher: string;
  description: string;
  image_url: string;
  link_url: string;
  published_date: string;
  created_at: string;
}

export function ArticlesLayout() {
  const { data: articles, isLoading } = useQuery({
    queryKey: ["articles"],
    queryFn: async () => {
      if (!supabase) {
        console.error("Supabase client is not initialized. Check your environment variables.");
        return [];
      }

      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as DbArticle[];
    },
  });

  if (!articles || articles.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-6 py-16 md:py-24">
      {/* Header */}
      <div className="text-center mb-20 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <h2 className="text-[11px] uppercase tracking-[0.4em] text-stone-400 mb-2">
          Publicerade reportage
        </h2>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-20">
        {articles.map((article, index) => (
          <a
            key={article.id}
            href={article.link_url}
            target="_blank"
            rel="noopener noreferrer"
            className="group block space-y-6"
            style={{ animationDelay: `${index * 200}ms` }}
          >
            {/* Bildbehållare */}
            <div className="relative aspect-[16/9] overflow-hidden bg-stone-50 animate-in fade-in slide-in-from-bottom-6 duration-1000 fill-mode-both">
              <img
                src={article.image_url}
                alt={article.title}
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>

            {/* Textinnehåll */}
            <div className="space-y-3 px-1">
              <div className="flex justify-between items-baseline text-[10px] uppercase tracking-widest text-stone-400 font-medium">
                <span>{article.publisher}</span>
                <span>{article.published_date}</span>
              </div>
              <h3 className="text-xl font-light text-stone-900 group-hover:text-stone-500 transition-colors duration-300 leading-snug">
                {article.title}
              </h3>
              <p className="text-sm text-stone-500 font-light leading-relaxed max-w-md">
                {article.description}
              </p>
              <div className="pt-2">
                <span className="text-[10px] uppercase tracking-[0.2em] text-stone-900 border-b border-stone-200 pb-1 group-hover:border-stone-900 transition-colors">
                  Läs reportaget
                </span>
              </div>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}