import { useQuery } from '@tanstack/react-query';
import { PortraitsLayout } from '@/components/layouts/portraits-layout';
import { fetchPhotosByTag } from '@/services/photo-fetcher';

export default function PortraitsRoute() {
  const { data: photos, isLoading, error } = useQuery({
    queryKey: ['photos', 'portraits'],
    queryFn: () => fetchPhotosByTag('portraits'),
  });

  if (isLoading) return;
  if (error) return;

  return (
    <PortraitsLayout photos={photos} variant="default" />
  );
}