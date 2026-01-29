import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/services";
import { ReportageLayout } from "@/components/layouts/reportage-layout";
import { useSEO } from '@/utils';

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
  useSEO({
    title: article?.title ? `${article.title} | Fotografering` : 'Fotoreportage | Myelie Foto',
    description: article?.description || 'Fotoreportage från professionell fotograf',
    keywords: 'fotoreportage, reportage, fotografi',
    canonical: `https://myeliefoto.se/reportage/${slug}`
  });

  if (isLoading) return;
  if (error) return;

  return <ReportageLayout article={article} />;
}