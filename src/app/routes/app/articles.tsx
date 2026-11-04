import { ArticlesLayout } from '@/components/layouts/articles-layout';
import { useSEO } from '@/utils';

export default function ArticlesRoute() {
  useSEO({
    title: 'Fotoreportage & artiklar | Myelie Lendelund',
    description: 'Fotoreportage och artiklar av Myelie Lendelund, fotograf i Skåne. Läs om bröllop, porträtt och reportage från Malmö, Lund och Helsingborg.',
    keywords: 'fotoreportage, reportage, fotograf Skåne, bröllopsfotograf Skåne',
    canonical: 'https://myeliefoto.se/articles'
  });

  return (
    <ArticlesLayout />
  );
}