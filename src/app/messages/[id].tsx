import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowRightLeft, CalendarDays, ShieldCheck } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { ChatView } from '@/components/chat';
import { RequireAuth } from '@/components/layout';
import { AppText, Button, LoadingView } from '@/components/ui';
import { useAsync } from '@/hooks/useAsync';
import { useTheme } from '@/providers';
import { messageService, tradeService } from '@/services';
import { elevation } from '@/theme';

export default function TradeChatScreen() {
  return (
    <RequireAuth>
      <TradeChat />
    </RequireAuth>
  );
}

function TradeChat() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { data: thread, loading } = useAsync(() => messageService.getThread(id), [id]);
  const { data: offer } = useAsync(() => tradeService.getOffer(id).catch(() => undefined), [id]);

  if (loading) return <LoadingView />;
  const name = thread?.name ?? offer?.person ?? 'Trader';
  const initials = thread?.initials ?? offer?.initials ?? 'BD';

  const header = (
    <View style={[styles.context, { backgroundColor: colors.surface, borderColor: colors.line }, elevation(1, colors)]}>
      {offer ? (
        <View style={styles.swap}>
          <View style={styles.side}>
            <Image source={offer.theirs.image} style={styles.thumb} />
            <View style={styles.flex}>
              <AppText variant="caption">{name.split(' ')[0]} offers</AppText>
              <AppText variant="small" color="ink" weight="bold" numberOfLines={1}>
                {offer.theirs.title}
              </AppText>
            </View>
          </View>
          <View style={[styles.swapIcon, { backgroundColor: colors.orange }]}>
            <ArrowRightLeft size={14} color={colors.onPrimary} strokeWidth={2.4} />
          </View>
          <View style={styles.side}>
            <Image source={offer.yours.image} style={styles.thumb} />
            <View style={styles.flex}>
              <AppText variant="caption">You offer</AppText>
              <AppText variant="small" color="ink" weight="bold" numberOfLines={1}>
                {offer.yours.title}
              </AppText>
            </View>
          </View>
        </View>
      ) : null}
      <Button label="Schedule meetup" icon={CalendarDays} compact onPress={() => router.push(`/meetups/${id}`)} />
      <View style={[styles.warranty, { backgroundColor: colors.greenSoft }]}>
        <ShieldCheck size={16} color={colors.green} />
        <AppText variant="caption" color="ink" style={styles.flex}>
          7-day trade support: after completion, both traders can access this chat and file a dispute for seven days.
        </AppText>
      </View>
    </View>
  );

  return <ChatView kind="trade" threadId={id} name={name} initials={initials} header={header} typingName={name.split(' ')[0]} />;
}

const styles = StyleSheet.create({
  context: { gap: 12, borderWidth: 1, borderRadius: 26, padding: 14, margin: 12, marginBottom: 0 },
  swapIcon: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  swap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  side: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  thumb: { width: 44, height: 44, borderRadius: 14 },
  flex: { flex: 1 },
  warranty: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 16, padding: 10 },
});
