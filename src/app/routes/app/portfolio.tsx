import { PHOTO_DATA } from '@/lib/image-paths';
import { PortfolioLayout } from '@/components/layouts/portfolio-layout';

export default function PortfolioRoute() {
  return (
    <PortfolioLayout photos={PHOTO_DATA.portfolio} variant="default" />
  );
}