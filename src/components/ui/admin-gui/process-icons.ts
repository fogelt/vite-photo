import {
  CalendarCheck,
  Camera,
  Check,
  Circle,
  Clock,
  FileText,
  Flower2,
  Gem,
  HeartHandshake,
  Images,
  Mail,
  MapPin,
  MessagesSquare,
  Phone,
  Sparkles,
  Users,
  type LucideIcon,
} from 'lucide-react';

export interface ProcessStep {
  title: string;
  text: string;
  icon?: string;
}

export interface ProcessIconOption {
  value: string;
  label: string;
  icon: LucideIcon;
}

export const PROCESS_ICON_OPTIONS: ProcessIconOption[] = [
  { value: 'messages', label: 'Samtal', icon: MessagesSquare },
  { value: 'calendar', label: 'Kalender', icon: CalendarCheck },
  { value: 'camera', label: 'Kamera', icon: Camera },
  { value: 'images', label: 'Bilder', icon: Images },
  { value: 'heart', label: 'Hjärta', icon: HeartHandshake },
  { value: 'gem', label: 'Ring', icon: Gem },
  { value: 'users', label: 'Paret', icon: Users },
  { value: 'file', label: 'Dokument', icon: FileText },
  { value: 'mail', label: 'E-post', icon: Mail },
  { value: 'phone', label: 'Telefon', icon: Phone },
  { value: 'map-pin', label: 'Plats', icon: MapPin },
  { value: 'clock', label: 'Tid', icon: Clock },
  { value: 'sparkles', label: 'Detaljer', icon: Sparkles },
  { value: 'flower', label: 'Blomma', icon: Flower2 },
];

const ICON_BY_VALUE = new Map(
  PROCESS_ICON_OPTIONS.map((option) => [option.value, option.icon])
);

const FALLBACK_ICONS: LucideIcon[] = [
  MessagesSquare,
  CalendarCheck,
  Camera,
  Images,
  HeartHandshake,
  Sparkles,
  Check,
  Circle,
];

export function getProcessIcon(icon: string | undefined, index: number) {
  return (icon ? ICON_BY_VALUE.get(icon) : undefined) ??
    FALLBACK_ICONS[index % FALLBACK_ICONS.length];
}

export const DEFAULT_PROCESS_STEPS: ProcessStep[] = [
  {
    title: 'Hör av er',
    text: 'Datum, plats och önskemål.',
    icon: 'messages',
  },
  {
    title: 'Överenskommelse',
    text: 'Avtal och datum bokas.',
    icon: 'file',
  },
  {
    title: 'Bröllopsdagen',
    text: 'Jag fotograferar er dag.',
    icon: 'camera',
  },
  {
    title: 'Bilderna',
    text: 'Redigerade bilder levereras digitalt.',
    icon: 'images',
  },
];

export function normalizeProcessSteps(value: unknown): ProcessStep[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((step): step is Record<string, unknown> =>
      Boolean(step) && typeof step === 'object'
    )
    .map((step) => ({
      title: typeof step.title === 'string' ? step.title : '',
      text: typeof step.text === 'string' ? step.text : '',
      icon: typeof step.icon === 'string' ? step.icon : undefined,
    }))
    .filter((step) => step.title.trim() !== '' || step.text.trim() !== '');
}
