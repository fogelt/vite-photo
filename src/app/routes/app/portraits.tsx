import { PHOTO_DATA } from '@/lib/image-paths';
import { PortraitsLayout } from '@/components/layouts/portraits-layout';

export default function PortraitsRoute() {
  return (
    <PortraitsLayout photos={PHOTO_DATA.portraits} variant="default" />
  );
}