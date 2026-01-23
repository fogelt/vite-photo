import { useQuery } from '@tanstack/react-query';
import { PortfolioLayout } from '@/components/layouts/portfolio-layout';
import { fetchPhotosByTag } from '@/services/photo-fetcher';

export default function PortfolioRoute() {
  const { data: photos = [], isLoading, error } = useQuery({
    queryKey: ['photos', 'portfolio'],
    queryFn: () => fetchPhotosByTag('portfolio'),
  });

  if (error) return;

  return (
    <PortfolioLayout photos={photos} variant="default" isLoading={isLoading} />
  );
}