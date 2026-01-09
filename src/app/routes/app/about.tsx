import { useQuery } from '@tanstack/react-query';
import { AboutLayout } from '@/components/layouts/about-layout';
import { fetchPhotosByTag } from '@/services/photo-fetcher';

export default function AboutRoute() {
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