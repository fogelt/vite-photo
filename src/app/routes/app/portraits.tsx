import { useQuery } from '@tanstack/react-query';
import { PortraitsLayout } from '@/components/layouts/portraits-layout';
import { fetchPhotosByTag } from '@/services/photo-fetcher';
import { useSEO } from '@/utils';

export default function PortraitsRoute() {
  useSEO({
    title: 'Porträttfotograf | Professionell Porträttfotografering i Södra Sverige',
    description: 'Porträttfotograf erbjuder professionell porträttfotografering för familjer, företag och privatpersoner i Malmö, Lund, Helsingborg och Skåne.',
    keywords: 'porträttfotograf, porträtt fotograf, porträttfotografering, porträttfotograf Malmö, familjefoto, profilbild fotograf',
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