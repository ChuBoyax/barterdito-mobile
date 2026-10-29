import { useLocalSearchParams } from 'expo-router';
import { ShieldCheck } from 'lucide-react-native';

import { RequireAuth } from '@/components/layout';
import { TradeControls } from '@/components/trades';
import { WorkflowScreen } from '@/components/trades/WorkflowScreen';
import { InfoNote } from '@/components/ui';

export default function MeetupScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <RequireAuth>
      <WorkflowScreen id={id} title="Arrange your meetup">
        {(state, userId) => (
          <>
            <InfoNote icon={ShieldCheck} title="Meet in a busy public place" text="Inspect both items before either trader confirms the exchange." />
            <TradeControls state={state} userId={userId} meetupForm />
          </>
        )}
      </WorkflowScreen>
    </RequireAuth>
  );
}
