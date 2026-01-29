import { useQuery } from '@tanstack/react-query';
import { AboutLayout } from '@/components/layouts/about-layout';
import { fetchPhotosByTag } from '@/services/photo-fetcher';
import { useSEO } from '@/utils';

export default function AboutRoute() {
  useSEO({
    title: 'Om Mig | Professionell Fotograf i Skåne - Myelie Foto',
    description: 'Läs om mig och min passion för fotografering. Professionell fotograf baserad i södra Sverige, specialiserad på bröllop, porträtt och reportage i Malmö och Skåne.',
    keywords: 'om myelie, professionell fotograf, fotografkunskap, myelie foto, fotograf Skåne',
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