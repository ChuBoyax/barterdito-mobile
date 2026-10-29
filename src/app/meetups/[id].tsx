import { router, useLocalSearchParams } from 'expo-router';

import { RequireAuth } from '@/components/layout';
import { MeetupScheduler } from '@/components/trades';
import { WorkflowScreen } from '@/components/trades/WorkflowScreen';
import { useToast } from '@/providers';

export default function MeetupScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const showToast = useToast();

  function sent() {
    showToast('Meetup proposal sent');
    if (router.canGoBack()) router.back();
    else router.replace(`/trade-complete/${id}`);
  }

  return (
    <RequireAuth>
      <WorkflowScreen id={id}>{(state, userId) => <MeetupScheduler state={state} userId={userId} onSent={sent} />}</WorkflowScreen>
    </RequireAuth>
  );
}
