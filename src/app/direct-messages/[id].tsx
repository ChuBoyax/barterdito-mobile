import { useLocalSearchParams } from 'expo-router';

import { ChatView } from '@/components/chat';
import { RequireAuth } from '@/components/layout';
import { LoadingView } from '@/components/ui';
import { useAsync } from '@/hooks/useAsync';
import { messageService } from '@/services';

export default function DirectChatScreen() {
  return (
    <RequireAuth>
      <DirectChat />
    </RequireAuth>
  );
}

function DirectChat() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: thread, loading } = useAsync(['messageService.getThread', id], () => messageService.getThread(id));
  if (loading) return <LoadingView variant="chat" />;
  return <ChatView kind="direct" threadId={id} name={thread?.name ?? 'Trader'} initials={thread?.initials ?? 'BD'} />;
}
