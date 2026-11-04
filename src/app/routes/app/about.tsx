import { useQuery } from '@tanstack/react-query';
import { AboutLayout } from '@/components/layouts/about-layout';
import { fetchPhotosByTag } from '@/services/photo-fetcher';
import { useSEO } from '@/utils';

export default function AboutRoute() {
  useSEO({
    title: 'Om Myelie Lendelund | Fotograf i Skåne',
    description: 'Lär känna Myelie Lendelund, fotograf i Skåne med fokus på bröllop, porträtt och reportage. Baserad i Skåne och verksam i Malmö, Lund och Helsingborg.',
    keywords: 'Myelie Lendelund, fotograf Skåne, bröllopsfotograf Skåne, porträttfotograf Skåne',
    canonical: 'https://myeliefoto.se/about'
  });
  const { data: photos, isLoading } = useQuery({
    queryKey: ['photos', 'about'],
    queryFn: () => fetchPhotosByTag('about'),
  });

  const profileImage = photos?.[0];

  return (
    <AboutLayout
      image={profileImage}
      isLoading={isLoading}
    />
  );
}