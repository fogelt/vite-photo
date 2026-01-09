import { PHOTO_DATA } from '@/lib/image-paths';
import { PortraitsLayout } from '@/components/layouts/portraits-layout';

export default function PortraitsRoute() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <PortraitsLayout photos={PHOTO_DATA.portraits} variant="default" />
    </div>
  );
}