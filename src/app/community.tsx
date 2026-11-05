import { MessageSquare } from 'lucide-react-native';

import { EmptyState, Screen } from '@/components/ui';

/** Like the website: empty until real discussions exist. */
export default function CommunityScreen() {
  return (
    <Screen>
      <EmptyState icon={MessageSquare} title="No community discussions yet" text="There are no discussions to show right now." />
    </Screen>
  );
}
