import { Image } from 'expo-image';
import { router } from 'expo-router';
import { MessageCircle, Package } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Button, Card, IconButton, LoadingView, Screen } from '@/components/ui';
import { useTradeConversation, type TradeConversationState } from '@/hooks/useTradeConversation';
import { useAuth, useTheme } from '@/providers';
import { neu } from '@/theme';
import type { OfferListing } from '@/types/trades';
import { otherTrader } from '@/utils/trades';

type WorkflowScreenProps = {
  id: string;
  children: (state: TradeConversationState, userId: string) => ReactNode;
};

/** Shared frame for the meetup, trade status and review screens (the navigation header holds the title). */
export function WorkflowScreen({ id, children }: WorkflowScreenProps) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const state = useTradeConversation(id);
  const data = state.data;

  if (!user) return null;
  if (!data && !state.error) return <LoadingView variant="profile" />;

  const mineFirst = data?.offer.proposer.id === user.id;
  return (
    <Screen>
      {state.error ? (
        <Card style={styles.error}>
          <AppText variant="small" color="red" weight="semibold">
            {state.error}
          </AppText>
          <Button label="Refresh" variant="secondary" compact onPress={() => void state.reload()} />
        </Card>
      ) : null}
      {data ? (
        <>
          <View style={[styles.strip, { backgroundColor: colors.surface }, neu(colors, 1)]}>
            <View style={styles.thumbs}>
              <Thumb item={mineFirst ? data.offer.requested : data.offer.offered} />
              <Thumb item={mineFirst ? data.offer.offered : data.offer.requested} overlap />
            </View>
            <View style={styles.flex}>
              <AppText variant="h3" numberOfLines={1}>
                {otherTrader(data.offer, user.id).fullName}
              </AppText>
              <AppText variant="caption" numberOfLines={1}>
                {(mineFirst ? data.offer.requested : data.offer.offered).title} ↔ {(mineFirst ? data.offer.offered : data.offer.requested).title}
              </AppText>
            </View>
            <IconButton icon={MessageCircle} label="Open trade chat" size={18} dimension={40} onPress={() => router.replace(`/messages/${id}`)} />
          </View>
          {children(state, user.id)}
        </>
      ) : null}
    </Screen>
  );
}

function Thumb({ item, overlap }: { item: OfferListing; overlap?: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.thumb, overlap && styles.overlap, { backgroundColor: colors.surface2, borderColor: colors.surface }]}>
      {item.imageUrl ? (
        <Image source={item.imageUrl} cachePolicy="memory-disk" style={StyleSheet.absoluteFill} contentFit="cover" />
      ) : (
        <Package size={14} color={colors.muted} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  strip: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 10 },
  thumbs: { flexDirection: 'row' },
  thumb: { width: 40, height: 40, borderRadius: 12, borderWidth: 2, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  overlap: { marginLeft: -12 },
  flex: { flex: 1, minWidth: 0 },
  error: { gap: 8 },
});
