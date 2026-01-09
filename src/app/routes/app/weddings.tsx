import { PHOTO_DATA } from '@/lib/image-paths';
import { WeddingsLayout } from '@/components/layouts/weddings-layout';

export default function WeddingsRoute() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <WeddingsLayout photos={PHOTO_DATA.weddings} />
    </div>
  );
}