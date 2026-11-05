import { BarChart3 } from 'lucide-react-native';

import { RequireAuth } from '@/components/layout';
import { EmptyState, Screen } from '@/components/ui';

/** Like the website: empty until real listing performance data exists. */
export default function AnalyticsScreen() {
  return (
    <RequireAuth>
      <Screen>
        <EmptyState icon={BarChart3} title="No seller analytics yet" text="Listing performance data is not available right now." />
      </Screen>
    </RequireAuth>
  );
}
