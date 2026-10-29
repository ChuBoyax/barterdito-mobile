import { useLocalSearchParams } from 'expo-router';

import { RequireAuth } from '@/components/layout';
import { TradeControls } from '@/components/trades';
import { WorkflowScreen } from '@/components/trades/WorkflowScreen';

/** Trade status: meetups, two-person confirmation and problem reports. */
export default function TradeStatusScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <RequireAuth>
      <WorkflowScreen id={id}>
        {(state, userId) => <TradeControls state={state} userId={userId} />}
      </WorkflowScreen>
    </RequireAuth>
  );
}
