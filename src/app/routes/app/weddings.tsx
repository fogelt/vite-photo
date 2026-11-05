import { useQuery } from '@tanstack/react-query';
import { WeddingsLayout } from '@/components/layouts/weddings-layout';
import { fetchPhotosByTag } from '@/services/photo-fetcher';
import { useSEO } from '@/utils';

export default function WeddingsRoute() {
  useSEO({
    title: 'Bröllopsfotograf i Skåne | Myelie Lendelund',
    description: 'Bröllopsfotograf i Skåne som fångar naturliga ögonblick. Fotograferar i Malmö, Lund, Helsingborg, Ystad och Österlen – och reser gärna längre.',
    keywords: 'bröllopsfotograf Skåne, bröllopsfotograf Malmö, bröllopsfotograf Lund, bröllopsfotograf Helsingborg, bröllopsfotografering Skåne, bröllopsfotograf pris',
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