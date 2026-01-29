import { useQuery } from '@tanstack/react-query';
import { PortfolioLayout } from '@/components/layouts/portfolio-layout';
import { fetchPhotosByTag } from '@/services/photo-fetcher';
import { useSEO } from '@/utils';

export default function PortfolioRoute() {
  useSEO({
    title: 'Fotograf Portfolio | Professionell Bröllopsfotograf & Porträttfotograf i Skåne',
    description: 'Se min kompletta fotografi portfolio. Specialiserad på bröllop, porträtt och reportage fotografi i Malmö, Lund, Helsingborg och övriga Skåne.',
    keywords: 'fotograf, bröllopsfotograf, porträttfotograf, proffs fotograf, fotograf Malmö, fotograf Lund, fotograf Helsingborg, Skåne',
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