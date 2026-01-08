import { PHOTO_DATA } from '@/lib/image-paths';
import { PortfolioLayout } from '@/components/layouts/portfolio-layout';

export default function PortfolioRoute() {
  return (
    <div className="animate-in fade-in duration-1000">
      <PortfolioLayout photos={PHOTO_DATA.portfolio} variant="default" />
    </div>
  );
}