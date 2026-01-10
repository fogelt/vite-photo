import { useQuery } from '@tanstack/react-query';
import { WeddingsLayout } from '@/components/layouts/weddings-layout';
import { fetchPhotosByTag } from '@/services/photo-fetcher';

export default function WeddingsRoute() {
  const { data: photos = [], isLoading, error } = useQuery({
    queryKey: ['photos', 'weddings'],
    queryFn: () => fetchPhotosByTag('weddings'),
  });

  if (isLoading) return;
  if (error) return;

  return (
    <WeddingsLayout photos={photos} />
  );
}