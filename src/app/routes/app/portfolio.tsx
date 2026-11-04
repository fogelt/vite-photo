import { useQuery } from '@tanstack/react-query';
import { PortfolioLayout } from '@/components/layouts/portfolio-layout';
import { fetchPhotosByTag } from '@/services/photo-fetcher';
import { useSEO } from '@/utils';

export default function PortfolioRoute() {
  useSEO({
    title: 'Myelie Lendelund | Fotograf i Skåne',
    description: 'Fotograf i Skåne med portfolio inom bröllop, porträtt och reportage. Baserad i Skåne och fotograferar i Malmö, Lund, Helsingborg och övriga Sverige.',
    keywords: 'fotograf Skåne, fotograf Malmö, fotograf Lund, fotograf Helsingborg, bröllopsfotograf Skåne, porträttfotograf Skåne',
    canonical: 'https://myeliefoto.se/'
  });
  const { data: photos = [], isLoading, error } = useQuery({
    queryKey: ['photos', 'portfolio'],
    queryFn: () => fetchPhotosByTag('portfolio'),
  });

  if (error) return;

  return (
    <PortfolioLayout photos={photos} variant="default" isLoading={isLoading} />
  );
}