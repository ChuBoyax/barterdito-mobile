import { CalendarDays } from 'lucide-react-native';

import { EmptyState, Screen } from '@/components/ui';

/** Like the website: empty until real event data exists. */
export default function EventsScreen() {
  return (
    <Screen>
      <EmptyState icon={CalendarDays} title="No trade events yet" text="There are no upcoming trade events to show." />
    </Screen>
  );
}
