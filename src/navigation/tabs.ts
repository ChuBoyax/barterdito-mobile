import { ArrowRightLeft, Compass, Grid2X2, MessageCircle, User, type LucideIcon } from 'lucide-react-native';

export type TabConfig = {
  name: 'index' | 'offers' | 'inbox' | 'my-items' | 'profile';
  title: string;
  icon: LucideIcon;
  badge?: number;
};

export const tabs: TabConfig[] = [
  { name: 'index', title: 'Browse', icon: Compass },
  { name: 'offers', title: 'Offers', icon: ArrowRightLeft },
  { name: 'inbox', title: 'Inbox', icon: MessageCircle, badge: 2 },
  { name: 'my-items', title: 'My Items', icon: Grid2X2 },
  { name: 'profile', title: 'Profile', icon: User },
];
