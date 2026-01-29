import { useQuery } from '@tanstack/react-query';
import { WeddingsLayout } from '@/components/layouts/weddings-layout';
import { fetchPhotosByTag } from '@/services/photo-fetcher';
import { useSEO } from '@/utils';

export default function WeddingsRoute() {
  useSEO({
    title: 'Bröllopsfotograf | Professionell Bröllopslfotografering i Skåne',
    description: 'Bröllopsfotograf specialiserad på att fånga känslan och skönheten i era viktiga stunder. Serverar Malmö, Lund, Helsingborg, Landskrona och övriga Södra Sverige.',
    keywords: 'bröllopsfotograf, bröllop fotograf, bröllopsfotografering, bröllopsfotograf Malmö, bröllopsfotograf Lund, Skåne bröllopsfotograf',
    canonical: 'https://myeliefoto.se/weddings'
  });
  const { data: photos = [], isLoading, error } = useQuery({
    queryKey: ['photos', 'weddings'],
    queryFn: () => fetchPhotosByTag('weddings'),
  });

  if (error) return;

  return (
    <WeddingsLayout photos={photos} isLoading={isLoading} />
  );
}