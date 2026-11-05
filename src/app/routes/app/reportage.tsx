import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/services";
import { ReportageLayout } from "@/components/layouts/reportage-layout";
import { cloudinaryImage, useSEO } from '@/utils';

export default function ReportageRoute() {
  const { slug } = useParams();

  const { data: article, isLoading, error } = useQuery({
    queryKey: ["article", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .eq("slug", slug)
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Set SEO with dynamic data from article
  const rawDescription = (
    article?.description || 'Fotoreportage av Myelie Lendelund, fotograf i Skåne.'
  ).replace(/\s+/g, ' ').trim();
  const description =
    rawDescription.length > 160
      ? `${rawDescription.slice(0, 157).trimEnd()}…`
      : rawDescription;

  useSEO({
    title: article?.title ? `${article.title} | Myelie Lendelund` : 'Fotoreportage | Myelie Lendelund',
    description,
    keywords: 'fotoreportage, reportage, fotograf Skåne, bröllopsfotograf Skåne',
    canonical: `https://myeliefoto.se/reportage/${article?.slug || slug}`,
    ogImage: article?.image_url ? cloudinaryImage(article.image_url, { width: 1200 }) : undefined,
    ogType: 'article'
  });

  if (isLoading) return;
  if (error) return;

  return <ReportageLayout article={article} />;
}