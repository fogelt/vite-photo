import { ImageContainer } from '@/components/ui/';

interface Photo {
  id: string;
  url: string;
  alt?: string;
}

export function PortfolioLayout({ photos, variant = 'default' }: { photos: Photo[], variant?: 'default' | 'weddings' }) {
  return (
    <section className="w-full py-4">
      <ImageContainer photos={photos} variant={variant} />
    </section>
  );
}