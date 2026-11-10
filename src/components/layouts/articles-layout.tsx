import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/services";
import { Dropdown } from "@/components/ui";
import { Link } from "react-router-dom";
import {
  ArrowUpDown,
  BookOpen,
  CalendarDays,
  ExternalLink,
  LayoutGrid,
  Newspaper,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { cloudinaryImage, cloudinarySrcSet } from "@/utils";

interface DbArticle {
  id: string;
  title: string;
  publisher: string;
  description: string;
  image_url: string;
  link_url?: string;
  slug?: string;
  type: "external" | "internal";
  published_date: string;
  created_at: string;
  is_published?: boolean;
}

const SWEDISH_MONTHS: Record<string, number> = {
  januari: 0,
  februari: 1,
  mars: 2,
  april: 3,
  maj: 4,
  juni: 5,
  juli: 6,
  augusti: 7,
  september: 8,
  oktober: 9,
  november: 10,
  december: 11,
};

const typeOptions = [
  { id: "all", label: "Alla", icon: LayoutGrid },
  { id: "internal", label: "Fristående", icon: BookOpen },
  { id: "external", label: "Publicerade", icon: Newspaper },
] as const;

const sortOptions = [
  { value: "newest", label: "Senaste först" },
  { value: "oldest", label: "Äldsta först" },
  { value: "title", label: "A–Ö" },
] as const;

type TypeFilter = (typeof typeOptions)[number]["id"];
type SortOrder = (typeof sortOptions)[number]["value"];

function parsePublishedDate(value: string) {
  const [monthName = "", yearValue = ""] = (value ?? "")
    .toLowerCase()
    .trim()
    .split(/\s+/);

  const month = SWEDISH_MONTHS[monthName] ?? -1;
  const year = Number(yearValue);

  return {
    year: Number.isFinite(year) && year > 0 ? year : 0,
    month,
  };
}

function articleYear(article: DbArticle) {
  return parsePublishedDate(article.published_date).year;
}

function articleTimestamp(article: DbArticle) {
  const { year, month } = parsePublishedDate(article.published_date);

  if (year > 0 && month >= 0) {
    return Date.UTC(year, month, 1);
  }

  const created = Date.parse(article.created_at ?? "");
  return Number.isNaN(created) ? 0 : created;
}

export function ArticlesLayout() {
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [publisherFilter, setPublisherFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const [search, setSearch] = useState("");

  const { data: articles, isLoading } = useQuery({
    queryKey: ["articles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("articles").select("*");
      if (error) throw error;
      return (data ?? []) as DbArticle[];
    },
  });

  const publishedArticles = useMemo(
    () => (articles ?? []).filter((article) => article.is_published !== false),
    [articles],
  );

  const publishers = useMemo(() => {
    return Array.from(
      new Set(
        publishedArticles
          .map((article) => article.publisher)
          .filter((publisher): publisher is string => Boolean(publisher)),
      ),
    ).sort((a, b) => a.localeCompare(b, "sv"));
  }, [publishedArticles]);

  const years = useMemo(() => {
    return Array.from(
      new Set(
        publishedArticles
          .map(articleYear)
          .filter((year) => year > 0),
      ),
    ).sort((a, b) => b - a);
  }, [publishedArticles]);

  const filteredArticles = useMemo(() => {
    const query = search.trim().toLowerCase();

    const filtered = publishedArticles.filter((article) => {
      if (typeFilter !== "all" && article.type !== typeFilter) return false;
      if (publisherFilter !== "all" && article.publisher !== publisherFilter) {
        return false;
      }
      if (yearFilter !== "all" && String(articleYear(article)) !== yearFilter) {
        return false;
      }

      if (query) {
        const haystack =
          `${article.title} ${article.publisher} ${article.description}`
            .toLowerCase();
        if (!haystack.includes(query)) return false;
      }

      return true;
    });

    return filtered.sort((a, b) => {
      if (sortOrder === "title") {
        return a.title.localeCompare(b.title, "sv");
      }

      const difference = articleTimestamp(a) - articleTimestamp(b);
      return sortOrder === "newest" ? -difference : difference;
    });
  }, [
    publishedArticles,
    typeFilter,
    publisherFilter,
    yearFilter,
    search,
    sortOrder,
  ]);

  const hasFilters =
    typeFilter !== "all" ||
    publisherFilter !== "all" ||
    yearFilter !== "all" ||
    sortOrder !== "newest" ||
    search.trim() !== "";

  const resetFilters = () => {
    setTypeFilter("all");
    setPublisherFilter("all");
    setYearFilter("all");
    setSortOrder("newest");
    setSearch("");
  };

  if (isLoading) {
    return <div className="min-h-screen animate-pulse bg-stone-50" />;
  }

  if (publishedArticles.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 animate-in fade-in duration-1000 sm:px-6 sm:py-16 md:py-24">
      <div className="mb-10 text-center sm:mb-12">
        <h2 className="text-[11px] uppercase tracking-[0.4em] text-stone-400">
          Reportage
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-[10px] uppercase leading-relaxed tracking-[0.2em] text-stone-400">
          Ett urval av publicerade reportage och intervjuer, där jag har medverkat
        </p>
      </div>

      <div className="mb-10 border border-stone-100 bg-white p-4 shadow-sm sm:mb-14 sm:p-5 md:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 flex-1">
            <label
              htmlFor="article-search"
              className="text-[9px] font-bold uppercase tracking-[0.25em] text-stone-400"
            >
              Sök
            </label>
            <div className="relative mt-2 max-w-xl">
              <Search
                size={14}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
                aria-hidden="true"
              />
              <input
                id="article-search"
                type="text"
                enterKeyHint="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Titel, publikation eller ämne"
                className="h-10 w-full border border-stone-200 bg-white pl-9 pr-9 text-xs font-light text-stone-900 outline-none transition-colors placeholder:text-stone-300 focus:border-stone-900"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label="Rensa sökning"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-stone-400 transition-colors hover:text-stone-900"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 lg:flex lg:flex-wrap lg:items-center">
            <Dropdown
              label="Filtrera på publikation"
              value={publisherFilter}
              onChange={setPublisherFilter}
              icon={SlidersHorizontal}
              className="col-span-2 lg:col-auto"
              options={[
                { value: "all", label: "Alla publikationer" },
                ...publishers.map((publisher) => ({
                  value: publisher,
                  label: publisher,
                })),
              ]}
            />

            <Dropdown
              label="Filtrera på år"
              value={yearFilter}
              onChange={setYearFilter}
              icon={CalendarDays}
              options={[
                { value: "all", label: "Alla år" },
                ...years.map((year) => ({
                  value: String(year),
                  label: String(year),
                })),
              ]}
            />

            <Dropdown
              label="Sortera artiklar"
              value={sortOrder}
              onChange={(value) => setSortOrder(value as SortOrder)}
              icon={ArrowUpDown}
              align="right"
              options={sortOptions}
            />

            {hasFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="col-span-2 h-10 border border-stone-200 px-3 text-[9px] font-bold uppercase tracking-widest text-stone-500 transition-colors hover:border-stone-900 hover:text-stone-900 lg:col-auto lg:w-auto"
              >
                Rensa filter
              </button>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 border-t border-stone-100 pt-4 sm:mt-5 sm:flex-row sm:flex-wrap sm:items-center sm:pt-5">
          <div className="grid grid-cols-3 border border-stone-100 bg-stone-50 p-1 sm:inline-flex sm:flex-wrap">
            {typeOptions.map((option) => {
              const Icon = option.icon;
              const isActive = typeFilter === option.id;

              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setTypeFilter(option.id)}
                  aria-pressed={isActive}
                  className={`inline-flex items-center justify-center gap-2 whitespace-nowrap px-1.5 py-2 text-[8px] font-bold uppercase tracking-wide transition-colors sm:px-3.5 sm:text-[9px] sm:tracking-widest ${
                    isActive
                      ? "bg-stone-900 text-white"
                      : "text-stone-500 hover:text-stone-900"
                  }`}
                >
                  <Icon
                    size={13}
                    strokeWidth={isActive ? 2 : 1.5}
                    className="hidden shrink-0 sm:block"
                  />
                  {option.label}
                </button>
              );
            })}
          </div>

          <span className="text-[9px] uppercase tracking-widest text-stone-400">
            Visar {filteredArticles.length} av {publishedArticles.length}
          </span>
        </div>
      </div>

      {filteredArticles.length === 0 ? (
        <div className="border border-stone-100 bg-white px-4 py-14 text-center shadow-sm sm:py-20">
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-stone-400">
            Inga reportage matchar filtren
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="mt-4 text-[9px] font-bold uppercase tracking-widest text-stone-600 underline underline-offset-4 transition-colors hover:text-stone-900"
          >
            Rensa filter
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 sm:gap-y-14 lg:grid-cols-3 lg:gap-x-12 lg:gap-y-16">
          {filteredArticles.map((article) => {
            const isInternal = article.type === "internal";
            const destination = isInternal
              ? `/reportage/${article.slug || article.id}`
              : article.link_url;
            const Wrapper = isInternal ? Link : "a";
            const wrapperProps = isInternal
              ? { to: destination }
              : {
                href: destination,
                target: "_blank",
                rel: "noopener noreferrer",
              };

            return (
              <Wrapper
                key={article.id}
                {...(wrapperProps as any)}
                className="group flex flex-col overflow-hidden rounded-sm bg-stone-50/40 shadow-sm transition-colors duration-500 hover:bg-stone-50 hover:shadow-md animate-in fade-in slide-in-from-bottom-4 duration-1000 fill-mode-both"
              >
                <div className="relative aspect-[16/9] overflow-hidden bg-stone-100">
                  <img
                    src={cloudinaryImage(article.image_url, { width: 1200 })}
                    srcSet={cloudinarySrcSet(article.image_url, [
                      400,
                      640,
                      900,
                      1200,
                    ])}
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    alt={article.title}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-105"
                  />

                  <div className="pointer-events-auto absolute right-3 top-3 z-20 flex items-center gap-2 group/icon sm:right-4 sm:top-4">
                    <span className="whitespace-nowrap rounded-md bg-black/40 px-2 py-1.5 text-[10px] uppercase tracking-widest text-white opacity-0 backdrop-blur-md transition-all duration-300 -translate-x-2 group-hover/icon:translate-x-0 group-hover/icon:opacity-100">
                      {isInternal ? "Läs reportage" : "Öppna extern länk"}
                    </span>

                    <div className="rounded-md bg-black/40 p-2 text-white opacity-70 drop-shadow-md backdrop-blur-md transition-all duration-300 group-hover/icon:scale-110 group-hover/icon:opacity-100 sm:opacity-40">
                      {isInternal ? (
                        <BookOpen size={14} strokeWidth={1.5} />
                      ) : (
                        <ExternalLink size={14} strokeWidth={1.5} />
                      )}
                    </div>
                  </div>

                  <div className="absolute inset-0 bg-black/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                </div>

                <div className="flex flex-grow flex-col space-y-4 p-5 sm:p-6 lg:p-8">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-[10px] font-medium uppercase tracking-widest text-stone-400">
                    <span className="tracking-[0.2em]">{article.publisher}</span>
                    <span>{article.published_date}</span>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-lg font-light leading-snug text-stone-900 transition-colors duration-300 group-hover:text-stone-600 sm:text-xl">
                      {article.title}
                    </h3>
                    <p className="line-clamp-3 text-sm font-light leading-relaxed text-stone-500">
                      {article.description}
                    </p>
                  </div>

                  <div className="flex-grow" />

                  <div className="group flex flex-wrap flex-row items-center gap-1 pt-2">
                    <span className="border-b border-stone-200 pb-1 text-[10px] uppercase tracking-[0.2em] text-stone-900 transition-colors group-hover:border-stone-900">
                      {isInternal ? (
                        "Se hela Reportaget"
                      ) : (
                        <>
                          Läs mer på{" "}
                          <span className="font-bold text-stone-600">
                            {article.publisher}
                          </span>
                        </>
                      )}
                    </span>
                    {!isInternal && (
                      <ExternalLink
                        size={14}
                        strokeWidth={1.5}
                        className="mb-1 -translate-y-[3px] text-stone-900"
                      />
                    )}
                  </div>
                </div>
              </Wrapper>
            );
          })}
        </div>
      )}
    </section>
  );
}
