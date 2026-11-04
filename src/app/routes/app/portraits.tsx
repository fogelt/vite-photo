import { useQuery } from '@tanstack/react-query';
import { PortraitsLayout } from '@/components/layouts/portraits-layout';
import { fetchPhotosByTag } from '@/services/photo-fetcher';
import { useSEO } from '@/utils';

export default function PortraitsRoute() {
  useSEO({
    title: 'Porträttfotograf i Skåne | Malmö, Lund & Helsingborg',
    description: 'Porträttfotograf i Skåne för privatpersoner och företag. Naturliga porträtt och företagsbilder i Malmö, Lund, Helsingborg och övriga Skåne.',
    keywords: 'porträttfotograf Skåne, porträttfotograf Malmö, porträttfotograf Lund, porträttfotograf Helsingborg, porträttfotografering Skåne, företagsporträtt Skåne',
    canonical: 'https://myeliefoto.se/portraits'
  });
  const { data: photos = [], isLoading, error } = useQuery({
    queryKey: ['photos', 'portraits'],
    queryFn: () => fetchPhotosByTag('portraits'),
  });

  if (error) return;

  return (
    <PortraitsLayout photos={photos} variant="default" isLoading={isLoading} />
  );
}