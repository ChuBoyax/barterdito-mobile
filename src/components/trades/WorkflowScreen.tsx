import { router } from 'expo-router';
import { MessageCircle } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Button, Card, LoadingView, Screen } from '@/components/ui';
import { useTradeConversation, type TradeConversationState } from '@/hooks/useTradeConversation';
import { useAuth } from '@/providers';
import { TradePair } from './TradePair';

type WorkflowScreenProps = {
  id: string;
  title: string;
  children: (state: TradeConversationState, userId: string) => ReactNode;
};

/** Shared frame for the meetup, trade status and review screens (like the website's TradeWorkflowScreen). */
export function WorkflowScreen({ id, title, children }: WorkflowScreenProps) {
  const { user } = useAuth();
  const state = useTradeConversation(id);
  const data = state.data;

  if (!user) return null;
  if (!data && !state.error) return <LoadingView variant="profile" />;

  const proposerMine = data?.offer.proposer.id === user.id;
  return (
    <Screen>
      <View style={styles.head}>
        <AppText variant="h1" style={styles.flex}>
          {title}
        </AppText>
        <Button label="Chat" icon={MessageCircle} variant="secondary" compact onPress={() => router.replace(`/messages/${id}`)} />
      </View>
      {state.error ? (
        <Card style={styles.error}>
          <AppText variant="small" color="red" weight="semibold">
            {state.error}
          </AppText>
          <Button label="Refresh trade" variant="secondary" compact onPress={() => void state.reload()} />
        </Card>
      ) : null}
      {data ? (
        <>
          <TradePair
            left={{ item: data.offer.offered, label: proposerMine ? 'You offer' : `${data.offer.proposer.fullName} offers` }}
            right={{ item: data.offer.requested, label: proposerMine ? `${data.offer.recipient.fullName}'s item` : 'Your item' }}
          />
          {children(state, user.id)}
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  flex: { flex: 1 },
  error: { gap: 8 },
});
