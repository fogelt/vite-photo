import { PHOTO_DATA } from '@/lib/image-paths';
import { WeddingsLayout } from '@/components/layouts/weddings-layout';

export default function WeddingsRoute() {
  return (
    <WeddingsLayout photos={PHOTO_DATA.weddings} />
  );
}