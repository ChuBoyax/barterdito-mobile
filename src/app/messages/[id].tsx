import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { CalendarDays, ChevronRight, Inbox, ShieldCheck, Star } from 'lucide-react-native';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { ChatView } from '@/components/chat';
import { RequireAuth } from '@/components/layout';
import { OfferStatusBadge } from '@/components/marketplace';
import { AppText, Button, LoadingView } from '@/components/ui';
import { useAsync } from '@/hooks/useAsync';
import { useTheme } from '@/providers';
import { messageService, tradeService } from '@/services';
import { elevation } from '@/theme';
import type { Offer } from '@/types/models';
import { firstName } from '@/utils/format';

export default function TradeChatScreen() {
  return (
    <RequireAuth>
      <TradeChat />
    </RequireAuth>
  );
}

function TradeChat() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: thread, loading } = useAsync(['messageService.getThread', id], () => messageService.getThread(id));
  const { data: offer } = useAsync(['tradeService.getOffer', id], () => tradeService.getOffer(id).catch(() => undefined));

  if (loading) return <LoadingView variant="chat" />;
  const name = thread?.name ?? offer?.person ?? 'Trader';
  const initials = thread?.initials ?? offer?.initials ?? 'BD';
  const traderId = offer?.theirs.userId;

  return (
    <ChatView
      kind="trade"
      threadId={id}
      name={name}
      initials={initials}
      subtitle={traderId ? 'Tap to view profile' : 'Trade conversation'}
      onPressProfile={traderId ? () => router.push(`/traders/${traderId}`) : undefined}
      header={offer ? <TradeContext offer={offer} tradeId={id} /> : null}
    />
  );
}


function TradeContext({ offer, tradeId }: { offer: Offer; tradeId: string }) {
  const { colors } = useTheme();
  const first = firstName(offer.person);

  const action =
    offer.status === 'Accepted'
      ? { label: 'Schedule meetup', icon: CalendarDays, onPress: () => router.push(`/meetups/${tradeId}`) }
      : offer.status === 'Completed'
        ? { label: 'Leave a review', icon: Star, onPress: () => router.push(`/trade-review/${tradeId}`) }
        : offer.status === 'Pending' && offer.received
          ? { label: 'Respond to offer', icon: Inbox, onPress: () => router.navigate('/offers') }
          : null;

  const hint =
    offer.status === 'Pending' && !offer.received
      ? `Waiting for ${first} to accept your offer.`
      : offer.status === 'Declined'
        ? 'This offer was declined.'
        : null;

  function explainSupport() {
    Alert.alert(
      '7-day trade support',
      'After the trade is completed, both traders can still access this chat and file a dispute for seven days if something goes wrong.',
    );
  }

  return (
    <View style={[styles.context, { backgroundColor: colors.surface, borderColor: colors.line }, elevation(1, colors)]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`View ${offer.theirs.title}`}
        onPress={() => router.push(`/items/${offer.theirs.id}`)}
        style={styles.summary}>
        <View style={styles.thumbs}>
          <Image source={offer.theirs.image} style={[styles.thumb, { borderColor: colors.surface }]} contentFit="cover" />
          <Image source={offer.yours.image} style={[styles.thumb, styles.thumbBack, { borderColor: colors.surface }]} contentFit="cover" />
        </View>
        <View style={styles.flex}>
          <AppText variant="small" color="ink" weight="bold" numberOfLines={1}>
            You get {offer.theirs.title}
          </AppText>
          <AppText variant="caption" numberOfLines={1}>
            You give {offer.yours.title}
          </AppText>
        </View>
        <OfferStatusBadge status={offer.status} />
      </Pressable>

      {action ? <Button label={action.label} icon={action.icon} compact onPress={action.onPress} /> : null}
      {hint ? (
        <AppText variant="caption" align="center">
          {hint}
        </AppText>
      ) : null}

      <Pressable accessibilityRole="button" onPress={explainSupport} hitSlop={6} style={styles.support}>
        <ShieldCheck size={13} color={colors.green} strokeWidth={2.4} />
        <AppText variant="caption" style={styles.flex}>
          Protected by 7-day trade support
        </AppText>
        <ChevronRight size={14} color={colors.muted2} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  context: { gap: 10, borderWidth: 1, borderRadius: 20, padding: 12, margin: 12, marginBottom: 0 },
  summary: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  thumbs: { width: 62, height: 44 },
  thumb: { position: 'absolute', left: 0, width: 44, height: 44, borderRadius: 12, borderWidth: 2, zIndex: 2 },
  thumbBack: { left: 20, top: 0, zIndex: 1 },
  flex: { flex: 1 },
  support: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
