import { ArticlesLayout } from '@/components/layouts/articles-layout';
import { useSEO } from '@/utils';

export default function ArticlesRoute() {
  useSEO({
    title: 'Fotoreportage | Myelie Foto',
    description: 'Fotoreportage från professionell fotograf',
    keywords: 'fotoreportage, reportage, fotografi',
    canonical: 'https://myeliefoto.se/articles'
  });

  return (
    <ArticlesLayout />
  );
}